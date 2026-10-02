import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmSesiones } from "@/db/schema";
import { SESSION_COOKIE, sameOrigin, sessionCookieOptions } from "@/lib/auth";
import { hashSessionToken } from "@/lib/password.mjs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) await db.delete(inmSesiones).where(eq(inmSesiones.tokenHash, hashSessionToken(token)));
    store.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return NextResponse.json({ error: "No se pudo cerrar sesión. Inténtalo nuevamente." }, { status: 500 });
  }
}
