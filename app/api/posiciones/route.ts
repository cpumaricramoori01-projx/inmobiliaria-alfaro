import { authorizeApi } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmAsignacionesPosicion,
  inmInmuebles,
  inmPosiciones,
  inmPropietarios,
} from "@/db/schema";

const tipoMap: Record<string, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
  otros: "Otros",
};

export async function GET() {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;
    const rows = await db
      .select({
        numero: inmPosiciones.numero,
        activa: inmPosiciones.activo,
        inmuebleId: inmInmuebles.id,
        codigo: inmInmuebles.codigo,
        referencia: inmInmuebles.referencia,
        tipo: inmInmuebles.tipo,
        propietarioNombres: inmPropietarios.nombres,
        propietarioApellidos: inmPropietarios.apellidos,
      })
      .from(inmPosiciones)
      .leftJoin(
        inmAsignacionesPosicion,
        and(
          eq(inmAsignacionesPosicion.posicionId, inmPosiciones.id),
          eq(inmAsignacionesPosicion.activa, true)
        )
      )
      .leftJoin(
        inmInmuebles,
        eq(inmInmuebles.id, inmAsignacionesPosicion.inmuebleId)
      )
      .leftJoin(
        inmPropietarios,
        eq(inmPropietarios.id, inmInmuebles.propietarioId)
      )
      .orderBy(inmPosiciones.numero);

    return NextResponse.json({
      posiciones: rows.map((row) => ({
        numero: row.numero,
        disponible: Boolean(row.activa) && row.inmuebleId == null,
        codigo: row.codigo ?? null,
        nombre: row.referencia ?? null,
        tipo: row.tipo
          ? tipoMap[row.tipo.toLowerCase()] ?? row.tipo
          : null,
        propietario:
          [row.propietarioNombres, row.propietarioApellidos]
            .filter(Boolean)
            .join(" ") || null,
      })),
    });
  } catch (error) {
    console.error("Operación fallida: posiciones", (error as { code?: string; cause?: { code?: string } }).cause?.code ?? (error as { code?: string }).code ?? "ERROR");

    return NextResponse.json(
      { error: "No se pudo consultar la disponibilidad de posiciones." },
      { status: 500 }
    );
  }
}
