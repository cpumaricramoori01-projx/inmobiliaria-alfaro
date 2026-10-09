import 'server-only';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { inmSesiones, inmUsuarios, securityAudit } from '@/db/schema';
import { SESSION_COOKIE, SESSION_SECONDS, sessionCookieOptions } from '@/lib/auth';
import { createSessionToken, hashSessionToken } from '@/lib/password.mjs';
import { auditValues } from '@/lib/security-audit';
import { LOGIN_MFA_REQUIRED } from '@/lib/auth-policy';
export async function startSession(userId: number, passwordHash: string, mfaVerified = false) {
  const token=createSessionToken(),store=await cookies(),previous=store.get(SESSION_COOKIE)?.value;
  await db.transaction(async tx=>{
    const [user]=await tx.select().from(inmUsuarios).where(eq(inmUsuarios.id,userId)).limit(1).for('update');
    if (!user?.activo || user.passwordHash !== passwordHash || (LOGIN_MFA_REQUIRED && user.rol === 'administrador' && (!user.mfaSecret || !mfaVerified))) throw new Error('Account changed');
    if(previous)await tx.delete(inmSesiones).where(eq(inmSesiones.tokenHash,hashSessionToken(previous)));
    await tx.insert(inmSesiones).values({tokenHash:hashSessionToken(token),usuarioId:userId,expira:new Date(Date.now()+SESSION_SECONDS*1000),lastSeen:new Date(),authenticatedAt:new Date()});
    await tx.insert(securityAudit).values(auditValues(userId,'login','session'));
  });
  store.set(SESSION_COOKIE,token,{...sessionCookieOptions,maxAge:SESSION_SECONDS});
}
