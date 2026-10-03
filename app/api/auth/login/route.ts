import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmSesiones, inmUsuarios } from "@/db/schema";
import { SESSION_COOKIE, SESSION_SECONDS, sameOrigin, sessionCookieOptions } from "@/lib/auth";
import { createSessionToken, hashSessionToken, verifyPassword } from "@/lib/password.mjs";
import { homeForUser } from "@/lib/access.mjs";

class LoginChangedError extends Error {}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  try {
    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
    }
    const usuario = typeof body?.usuario === "string" ? body.usuario.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^[a-z0-9._-]{1,60}$/.test(usuario) || !password || password.length > 256) {
      return NextResponse.json({ error: "Ingresa tu usuario y contraseña." }, { status: 400 });
    }
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
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }
    const token = createSessionToken();
    const store = await cookies();
    const previous = store.get(SESSION_COOKIE)?.value;
    const authenticatedUser = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(inmUsuarios).where(eq(inmUsuarios.id, user.id)).limit(1).for("update");
      if (!current?.activo || current.passwordHash !== user.passwordHash || current.usuario?.toLowerCase() !== usuario) throw new LoginChangedError();
      await tx.delete(inmSesiones).where(lt(inmSesiones.expira, new Date()));
      if (previous) await tx.delete(inmSesiones).where(eq(inmSesiones.tokenHash, hashSessionToken(previous)));
      await tx.update(inmUsuarios).set({ intentosFallidos: 0, bloqueoHasta: null }).where(eq(inmUsuarios.id, user.id));
      await tx.insert(inmSesiones).values({ tokenHash: hashSessionToken(token), usuarioId: user.id, expira: new Date(Date.now() + SESSION_SECONDS * 1000) });
      return { rol: current.rol };
    });
    store.set(SESSION_COOKIE, token, { ...sessionCookieOptions, maxAge: SESSION_SECONDS });
    return NextResponse.json({ ok: true, redirectTo: homeForUser(authenticatedUser) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof LoginChangedError) return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    console.error("Error al iniciar sesión:", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión. Inténtalo nuevamente." }, { status: 500 });
  }
}
