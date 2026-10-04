import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmSesiones } from "@/db/schema";
import { SESSION_COOKIE, sameOrigin, sessionCookieOptions } from "@/lib/auth";
import { hashSessionToken } from "@/lib/password.mjs";
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/security-audit';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  try {
    const store = await cookies();
    const user=await getSession();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) await db.delete(inmSesiones).where(eq(inmSesiones.tokenHash, hashSessionToken(token)));
    store.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
    store.set('aa_mfa','',{...sessionCookieOptions,maxAge:0});
    if(user)await audit(user.id,'logout','session');
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Operación fallida: auth/logout", (error as { code?: string; cause?: { code?: string } }).cause?.code ?? (error as { code?: string }).code ?? "ERROR");
    return NextResponse.json({ error: "No se pudo cerrar sesión. Inténtalo nuevamente." }, { status: 500 });
  }
}
