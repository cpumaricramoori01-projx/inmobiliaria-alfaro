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

const etapaProgress: Record<string, number> = {
  visita_pendiente: 15,
  visita_realizada: 30,
  tasacion_pendiente: 45,
  pendiente_aprobacion: 60,
  en_negociacion: 70,
  listo_para_publicar: 85,
  publicado: 100,
};

const siguienteAccion: Record<string, string> = {
  visita_pendiente: "Registrar visita",
  visita_realizada: "Registrar tasación",
  tasacion_pendiente: "Completar tasación",
  pendiente_aprobacion: "Revisar aprobación",
  en_negociacion: "Dar seguimiento",
  listo_para_publicar: "Publicar inmueble",
  publicado: "Seguimiento comercial",
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
        fechaRegistro: inmInmuebles.fechaRegistro,
      })
      .from(inmInmuebles)
      .leftJoin(
        inmPropietarios,
        eq(inmPropietarios.id, inmInmuebles.propietarioId)
      )
      .leftJoin(
        inmAsignacionesPosicion,
        and(
          eq(inmAsignacionesPosicion.inmuebleId, inmInmuebles.id),
          eq(inmAsignacionesPosicion.activa, true)
        )
      )
      .leftJoin(
        inmPosiciones,
        eq(inmPosiciones.id, inmAsignacionesPosicion.posicionId)
      )
      .orderBy(desc(inmInmuebles.fechaRegistro));

    return NextResponse.json({
      inmuebles: rows.map((row) => {
        const etapaKey = row.etapa?.toLowerCase() ?? "";

        return {
          id: row.id,
          posicion: row.posicion ?? undefined,
          tipo: tipoMap[row.tipo?.toLowerCase()] ?? row.tipo,
          nombre: row.nombre,
          ubicacion:
            [row.distrito, row.provincia, row.departamento]
              .filter(Boolean)
              .join(", ") || "Sin ubicación registrada",
          estado:
            row.estado?.toLowerCase() === "activo"
              ? "Activo"
              : "Histórico",
          etapa: etapaMap[etapaKey] ?? row.etapa,
          etapaKey,
          progreso: etapaProgress[etapaKey] ?? 0,
          siguienteAccion: siguienteAccion[etapaKey] ?? "Revisar inmueble",
          propietario:
            [row.propietario, row.propietarioApellidos]
              .filter(Boolean)
              .join(" ") || "Sin propietario",
          motivoLiberacion: row.fechaSalida
            ? "Liberación registrada"
            : undefined,
          fechaRegistro: row.fechaRegistro,
          fechaSalida: row.fechaSalida,
        };
      }),
    });
  } catch (error) {
    console.error("Error al consultar cartera:", error);

    return NextResponse.json(
      { error: "No se pudo consultar la cartera de inmuebles." },
      { status: 500 }
    );
  }
}
