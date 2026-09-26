import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmAsignacionesPosicion, inmPosiciones } from "@/db/schema";

export async function GET() {
  try {
    const rows = await db
      .select({
        numero: inmPosiciones.numero,
        activa: inmPosiciones.activo,
        ocupada: inmAsignacionesPosicion.inmuebleId,
      })
      .from(inmPosiciones)
      .leftJoin(
        inmAsignacionesPosicion,
        and(
          eq(inmAsignacionesPosicion.posicionId, inmPosiciones.id),
          eq(inmAsignacionesPosicion.activa, true)
        )
      )
      .orderBy(inmPosiciones.numero);

    return NextResponse.json({
      posiciones: rows.map((row) => ({
        numero: row.numero,
        disponible: Boolean(row.activa) && row.ocupada == null,
      })),
    });
  } catch (error) {
    console.error("Error al consultar posiciones:", error);
    return NextResponse.json(
      { error: "No se pudo consultar la disponibilidad de posiciones." },
      { status: 500 }
    );
  }
}
