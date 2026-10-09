import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authorizeApi, SESSION_COOKIE } from '@/lib/auth';
import { db } from '@/lib/db';
import { inmUsuarios, inmSesiones, securityAudit } from '@/db/schema';
import { hashSessionToken, verifyPassword } from '@/lib/password.mjs';
import { authLimited } from '@/lib/auth-limits';
import { auditValues } from '@/lib/security-audit';
export async function POST(request: Request) {
  const auth=await authorizeApi(request);if(auth.response)return auth.response;
  try {
    if(await authLimited(request,'reauth',String(auth.user.id)))return NextResponse.json({error:'Demasiados intentos.'},{status:429});
    const {password}=await request.json();
    if(typeof password!=='string'||password.length>256)return NextResponse.json({error:'Datos no válidos.'},{status:400});
    const [current]=await db.select().from(inmUsuarios).where(eq(inmUsuarios.id,auth.user.id)).limit(1);
    const valid=await verifyPassword(password,current?.passwordHash);
    const token=(await cookies()).get(SESSION_COOKIE)?.value;
    const ok=await db.transaction(async tx=>{
      const [user]=await tx.select().from(inmUsuarios).where(eq(inmUsuarios.id,auth.user.id)).limit(1).for('update');
      if(!valid||!user?.activo||user.rol!=='administrador'||user.passwordHash!==current.passwordHash||!token)return false;
      await tx.update(inmSesiones).set({authenticatedAt:new Date()}).where(eq(inmSesiones.tokenHash,hashSessionToken(token)));
      await tx.insert(securityAudit).values(auditValues(user.id,'reauth','session'));return true;
    });
    return ok ? NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}}) : NextResponse.json({error:'Contraseña incorrecta.'},{status:401});
  } catch {return NextResponse.json({error:'No se pudo confirmar tu identidad.'},{status:500});}
}
