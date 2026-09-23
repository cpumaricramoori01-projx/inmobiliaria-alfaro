import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmPropietarios } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const dni = new URL(request.url).searchParams.get("dni")?.trim() ?? "";

    if (!/^\d{8}$/.test(dni)) {
      return NextResponse.json({ propietario: null });
    }

    const [propietario] = await db
      .select({
        id: inmPropietarios.id,
        dni: inmPropietarios.dni,
        nombres: inmPropietarios.nombres,
        apellidos: inmPropietarios.apellidos,
        telefono: inmPropietarios.telefono,
      })
      .from(inmPropietarios)
      .where(eq(inmPropietarios.dni, dni))
      .limit(1);

    return NextResponse.json({ propietario: propietario ?? null });
  } catch {
    return NextResponse.json({ error: "No fue posible consultar el propietario." }, { status: 500 });
  }
}
