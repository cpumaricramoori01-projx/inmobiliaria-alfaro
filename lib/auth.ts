import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmSesiones, inmUsuarios } from "@/db/schema";
import { hashSessionToken } from "@/lib/password.mjs";
import { sameOrigin } from "@/lib/request-origin.mjs";
import { isAdministrator } from "@/lib/access.mjs";

export { sameOrigin };

export const SESSION_COOKIE = "aa_session";
export const SESSION_SECONDS = 60 * 60 * 8;
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function findSession(token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const [user] = await db.select({
    id: inmUsuarios.id,
    nombre: inmUsuarios.nombre,
    usuario: inmUsuarios.usuario,
    rol: inmUsuarios.rol,
  }).from(inmSesiones).innerJoin(inmUsuarios, eq(inmUsuarios.id, inmSesiones.usuarioId))
    .where(and(
      eq(inmSesiones.tokenHash, hashSessionToken(token)),
      gt(inmSesiones.expira, new Date()),
      eq(inmUsuarios.activo, true),
    )).limit(1);
  return user ?? null;
}

export const getSession = cache(async () => {
  return findSession((await cookies()).get(SESSION_COOKIE)?.value);
});

export async function authorizeApi(request?: Request, access: "administrador" | "informacion" = "administrador") {
  if (request && !["GET", "HEAD", "OPTIONS"].includes(request.method) && !sameOrigin(request)) {
    return { user: null, response: NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 }) };
  }
  const user = await getSession();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 }) };
  }
  if (access === "administrador" && !isAdministrator(user)) {
    return { user: null, response: NextResponse.json({ error: "No tienes permiso para acceder a este módulo." }, { status: 403 }) };
  }
  return { user, response: null };
}
