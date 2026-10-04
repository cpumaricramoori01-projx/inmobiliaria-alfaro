import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { authChallenges, inmUsuarios, inmSesiones, securityAudit } from '@/db/schema';
import { sameOrigin, sessionCookieOptions } from '@/lib/auth';
import { hashSessionToken } from '@/lib/password.mjs';
import { decryptSecret, validStep } from '@/lib/mfa.mjs';
import { authLimited } from '@/lib/auth-limits';
import { startSession } from '@/lib/auth-session';
import { auditValues } from '@/lib/security-audit';
export async function POST(request: Request) {
  if(!sameOrigin(request))return NextResponse.json({error:'Solicitud no permitida.'},{status:403});
  try {
    if(await authLimited(request,'mfa'))return NextResponse.json({error:'Demasiados intentos. Inténtalo más tarde.'},{status:429});
    const token=(await cookies()).get('aa_mfa')?.value;
    if(!token||!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:'Inicia sesión nuevamente.'},{status:401});
    const {code}=await request.json();
    if(await authLimited(request,'mfa-challenge',hashSessionToken(token)))return NextResponse.json({error:'Demasiados intentos.'},{status:429});
    const user=await db.transaction(async tx=>{
      const [challenge]=await tx.select().from(authChallenges).where(and(eq(authChallenges.tokenHash,hashSessionToken(token)),gt(authChallenges.expires,new Date()))).limit(1).for('update');
      if(!challenge)return null;
      const [current]=await tx.select().from(inmUsuarios).where(eq(inmUsuarios.id,challenge.userId)).limit(1).for('update');
      if(!current?.activo||current.passwordHash!==challenge.passwordHash||current.rol!=='administrador')return null;
      const encrypted=current.mfaSecret||challenge.secret;
      if(!encrypted)return null;
      const step=validStep(decryptSecret(encrypted),code,current.mfaLastStep??-1);
      if(step===null){await tx.insert(securityAudit).values(auditValues(current.id,'mfa','session','denied'));return null;}
      await tx.update(inmUsuarios).set({mfaSecret:encrypted,mfaLastStep:step}).where(eq(inmUsuarios.id,current.id));
      if(!current.mfaSecret) {
        await tx.delete(inmSesiones).where(eq(inmSesiones.usuarioId,current.id));
        await tx.insert(securityAudit).values(auditValues(current.id,'mfa.enroll',`user:${current.id}`));
      }
      await tx.delete(authChallenges).where(eq(authChallenges.tokenHash,challenge.tokenHash));
      return current;
    });
    if(!user)return NextResponse.json({error:'Código no válido o acceso vencido. Revisa el código o inicia sesión nuevamente.'},{status:401});
    await startSession(user.id,user.passwordHash!,true);
    (await cookies()).set('aa_mfa','',{...sessionCookieOptions,maxAge:0});
    return NextResponse.json({ok:true,redirectTo:'/'},{headers:{'Cache-Control':'no-store'}});
  } catch {return NextResponse.json({error:'No se pudo verificar el código.'},{status:500});}
}
