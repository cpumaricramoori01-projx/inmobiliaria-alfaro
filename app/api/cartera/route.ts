import { NextResponse } from "next/server";
import { desc, eq, and } from "drizzle-orm";
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
        id: inmInmuebles.codigo,
        posicion: inmPosiciones.numero,
        tipo: inmInmuebles.tipo,
        nombre: inmInmuebles.referencia,
        distrito: inmInmuebles.distrito,
        provincia: inmInmuebles.provincia,
        departamento: inmInmuebles.departamento,
        estado: inmInmuebles.estado,
        etapa: inmInmuebles.etapa,
        propietario: inmPropietarios.nombres,
        propietarioApellidos: inmPropietarios.apellidos,
        fechaSalida: inmInmuebles.fechaSalida,
      })
      .from(inmInmuebles)
      .leftJoin(inmPropietarios, eq(inmPropietarios.id, inmInmuebles.propietarioId))
      .leftJoin(
        inmAsignacionesPosicion,
        and(
          eq(inmAsignacionesPosicion.inmuebleId, inmInmuebles.id),
          eq(inmAsignacionesPosicion.activa, true)
        )
      )
      .leftJoin(inmPosiciones, eq(inmPosiciones.id, inmAsignacionesPosicion.posicionId))
      .orderBy(desc(inmInmuebles.fechaRegistro));

    return NextResponse.json({
      inmuebles: rows.map((row) => ({
        id: row.id,
        posicion: row.posicion ?? undefined,
        tipo: tipoMap[row.tipo?.toLowerCase()] ?? row.tipo,
        nombre: row.nombre,
        ubicacion: [row.distrito, row.provincia, row.departamento]
          .filter(Boolean)
          .join(", ") || "Sin ubicación registrada",
        estado: row.estado?.toLowerCase() === "activo" ? "Activo" : "Histórico",
        etapa: etapaMap[row.etapa?.toLowerCase()] ?? row.etapa,
        propietario: [row.propietario, row.propietarioApellidos]
          .filter(Boolean)
          .join(" ") || "Sin propietario",
        motivoLiberacion: row.fechaSalida ? "Liberación registrada" : undefined,
      })),
    });
  } catch (error) {
    console.error("Error al consultar cartera:", error);
    return NextResponse.json(
      { error: "No se pudo consultar la cartera de inmuebles." },
      { status: 500 }
    );
  }
}
