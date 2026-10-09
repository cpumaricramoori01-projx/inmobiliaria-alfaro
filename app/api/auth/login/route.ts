import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmUsuarios } from "@/db/schema";
import { sameOrigin } from "@/lib/auth";
import { verifyPassword } from "@/lib/password.mjs";
import { homeForUser } from "@/lib/access.mjs";

class LoginChangedError extends Error {}

import { authLimited } from '@/lib/auth-limits';
import { audit } from '@/lib/security-audit';
import { startSession } from '@/lib/auth-session';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  try {
    if (await authLimited(request,'login')) return NextResponse.json({error:'Demasiados intentos. Inténtalo más tarde.'},{status:429,headers:{'Retry-After':'900'}});
    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
    }
    const usuario = typeof body?.usuario === "string" ? body.usuario.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^[a-z0-9._-]{1,60}$/.test(usuario) || !password || password.length > 256) {
      return NextResponse.json({ error: "Ingresa tu usuario y contraseña." }, { status: 400 });
    }
    if (await authLimited(request,'login-account',usuario)) return NextResponse.json({error:'Demasiados intentos. Inténtalo más tarde.'},{status:429});
    const [user] = await db.select().from(inmUsuarios).where(eq(inmUsuarios.usuario, usuario)).limit(1);
    if (user?.bloqueoHasta && user.bloqueoHasta > new Date()) {
      return NextResponse.json({ error: "No se pudo iniciar sesión. Inténtalo de nuevo más tarde." }, { status: 429 });
    }
    const valid = await verifyPassword(password, user?.passwordHash);
    if (!valid || !user?.activo) {
      if (user?.activo) {
        // Atomic counter, including simultaneous failed requests.
        // Use the same clock as session validation: MySQL's NOW() can use a
        // different time zone from the application's date serialization.
        const now = new Date();
        const blockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
        await db.update(inmUsuarios).set({
          intentosFallidos: sql`CASE WHEN ${inmUsuarios.bloqueoHasta} <= ${now} THEN 1 ELSE ${inmUsuarios.intentosFallidos} + 1 END`,
          bloqueoHasta: sql`CASE WHEN ${inmUsuarios.intentosFallidos} >= 5 THEN ${blockedUntil} ELSE NULL END`,
        }).where(eq(inmUsuarios.id, user.id));
      }
      await audit(user?.id ?? null,'login','session','denied');
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }
    const authenticatedUser = await db.transaction(async tx => {
      const [current] = await tx.select().from(inmUsuarios).where(eq(inmUsuarios.id,user.id)).limit(1).for('update');
      if (!current?.activo || current.passwordHash !== user.passwordHash || current.usuario?.toLowerCase() !== usuario) throw new LoginChangedError();
      await tx.update(inmUsuarios).set({intentosFallidos:0,bloqueoHasta:null}).where(eq(inmUsuarios.id,user.id));
      return current;
    });
    await startSession(user.id,user.passwordHash!);
    return NextResponse.json({ok:true,redirectTo:homeForUser(authenticatedUser)},{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    if (error instanceof LoginChangedError) return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    console.error("Error al iniciar sesión:", (error as {code?:string}).code || "AUTH_ERROR");
    return NextResponse.json({ error: "No se pudo iniciar sesión. Inténtalo nuevamente." }, { status: 500 });
  }
}
