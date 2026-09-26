import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmAsignacionesPosicion,
  inmInmuebles,
  inmPosiciones,
  inmPropietarios,
} from "@/db/schema";

const etapaMap: Record<string, string> = {
  visita_pendiente: "Visita pendiente",
  visita_realizada: "Visita realizada",
  tasacion_pendiente: "Tasación pendiente",
  pendiente_aprobacion: "Pendiente de aprobación",
  en_negociacion: "En negociación",
  listo_para_publicar: "Listo para publicar",
  publicado: "Publicado",
};

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
    const rows = await db
      .select({
        numero: inmPosiciones.numero,
        activa: inmPosiciones.activo,
        inmuebleId: inmInmuebles.id,
        codigo: inmInmuebles.codigo,
        referencia: inmInmuebles.referencia,
        tipo: inmInmuebles.tipo,
        etapa: inmInmuebles.etapa,
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
        etapa: row.etapa
          ? etapaMap[row.etapa.toLowerCase()] ?? row.etapa
          : null,
        propietario:
          [row.propietarioNombres, row.propietarioApellidos]
            .filter(Boolean)
            .join(" ") || null,
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
