import { asc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { inmUsuarios } from "@/db/schema";
import { createManagedUser, userManagementError } from "@/lib/user-admin";

export async function GET() {
  const auth = await authorizeApi();
  if (auth.response) return auth.response;
  try {
    const rows = await db.select({ id: inmUsuarios.id, nombre: inmUsuarios.nombre, usuario: inmUsuarios.usuario, email: inmUsuarios.email,
      rol: inmUsuarios.rol, activo: inmUsuarios.activo, fechaRegistro: inmUsuarios.fechaRegistro, bloqueoHasta: inmUsuarios.bloqueoHasta,
      tienePassword: sql<number>`(${inmUsuarios.passwordHash} IS NOT NULL AND ${inmUsuarios.passwordHash} <> '')`,
    }).from(inmUsuarios).orderBy(asc(inmUsuarios.nombre));
    const usuarios = rows.map(({ bloqueoHasta, ...user }) => ({ ...user, tienePassword: Boolean(user.tienePassword),
      email: user.email.endsWith("@inmobiliaria-alfaro.local") ? "" : user.email,
      rol: user.rol === "administrador" ? "administrador" : "operador",
      bloqueado: Boolean(bloqueoHasta && bloqueoHasta > new Date()),
    }));
    return NextResponse.json({ usuarios }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "No se pudieron consultar los usuarios." }, { status: 500 }); }
}
export async function POST(request: Request) {
  const auth = await authorizeApi(request);
  if (auth.response) return auth.response;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Datos de usuario no válidos." }, { status: 400 }); }
  try { return NextResponse.json(await createManagedUser(auth.user.id, body), { status: 201 }); }
  catch (error) { return userManagementError(error); }
}
