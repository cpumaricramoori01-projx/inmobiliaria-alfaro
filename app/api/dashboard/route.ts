import { authorizeApi } from "@/lib/auth";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmAsignacionesPosicion,
  inmInmuebles,
  inmNegociaciones,
  inmPosiciones,
  inmPublicaciones,
  inmTasaciones,
  inmTimeline,
  inmVisitas,
} from "@/db/schema";

const eventoMap: Record<string, string> = {
  inmueble_registrado: "Inmueble registrado",
  visita_realizada: "Visita realizada",
  tasacion_realizada: "Tasación realizada",
  tasacion_actualizada: "Tasación actualizada",
  publicacion_registrada: "Texto registrado",
  listo_para_publicar: "Listo para publicar",
  publicado: "Publicado",
  liberacion_registrada: "Liberación registrada",
  inmueble_liberado: "Inmueble liberado",
};

export async function GET() {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;
    const [
      inmueblesActivos,
      visitas,
      tasaciones,
      negociaciones,
      publicaciones,
      recientes,
      posicionesDisponibles,
    ] = await Promise.all([
      db
        .select({
          id: inmInmuebles.id,
        })
        .from(inmInmuebles)
        .where(eq(inmInmuebles.estado, "activo")),

      db
        .select({
          inmuebleId: inmVisitas.inmuebleId,
          completada: inmVisitas.completada,
          fechaRegistro: inmVisitas.fechaRegistro,
        })
        .from(inmVisitas)
        .orderBy(desc(inmVisitas.fechaRegistro)),

      db
        .select({
          inmuebleId: inmTasaciones.inmuebleId,
          situacion: inmTasaciones.situacion,
        })
        .from(inmTasaciones),

      db
        .select({
          inmuebleId: inmNegociaciones.inmuebleId,
          estado: inmNegociaciones.estado,
          fechaRegistro: inmNegociaciones.fechaRegistro,
        })
        .from(inmNegociaciones)
        .orderBy(desc(inmNegociaciones.fechaRegistro)),

      db
        .select({
          inmuebleId: inmPublicaciones.inmuebleId,
          publicado: inmPublicaciones.publicado,
        })
        .from(inmPublicaciones),

      db
        .select({
          numero: inmPosiciones.numero,
          nombre: inmInmuebles.referencia,
          evento: inmTimeline.evento,
          fecha: inmTimeline.fechaEvento,
        })
        .from(inmTimeline)
        .innerJoin(
          inmInmuebles,
          eq(inmInmuebles.id, inmTimeline.inmuebleId)
        )
        .leftJoin(
          inmAsignacionesPosicion,
          eq(
            inmAsignacionesPosicion.inmuebleId,
            inmInmuebles.id
          )
        )
        .leftJoin(
          inmPosiciones,
          eq(
            inmPosiciones.id,
            inmAsignacionesPosicion.posicionId
          )
        )
        .orderBy(desc(inmTimeline.fechaEvento))
        .limit(5),

      db
        .select({
          posicionId: inmPosiciones.id,
          inmuebleId: inmAsignacionesPosicion.inmuebleId,
        })
        .from(inmPosiciones)
        .leftJoin(
          inmAsignacionesPosicion,
          eq(
            inmAsignacionesPosicion.posicionId,
            inmPosiciones.id
          )
        )
        .where(eq(inmPosiciones.activo, true))
        .then((rows) =>
          rows.filter((row) => row.inmuebleId == null).length
        ),
    ]);

    const activos = new Set(inmueblesActivos.map((item) => item.id));

    const ultimaVisita = new Map<
      number,
      { completada: boolean }
    >();

    for (const visita of visitas) {
      if (!activos.has(visita.inmuebleId)) continue;
      if (ultimaVisita.has(visita.inmuebleId)) continue;

      ultimaVisita.set(visita.inmuebleId, {
        completada: visita.completada,
      });
    }

    const tasacionPorInmueble = new Map<
      number,
      string
    >();

    for (const tasacion of tasaciones) {
      if (!activos.has(tasacion.inmuebleId)) continue;

      tasacionPorInmueble.set(
        tasacion.inmuebleId,
        tasacion.situacion
      );
    }

    const negociacionPorInmueble = new Map<
      number,
      string
    >();

    for (const negociacion of negociaciones) {
      if (!activos.has(negociacion.inmuebleId)) continue;
      if (negociacionPorInmueble.has(negociacion.inmuebleId)) {
        continue;
      }

      negociacionPorInmueble.set(
        negociacion.inmuebleId,
        negociacion.estado
      );
    }

    const publicacionPorInmueble = new Map<
      number,
      boolean
    >();

    for (const publicacion of publicaciones) {
      if (!activos.has(publicacion.inmuebleId)) continue;

      publicacionPorInmueble.set(
        publicacion.inmuebleId,
        publicacion.publicado
      );
    }

    let visitasPendientes = 0;
    let tasacionesPendientes = 0;
    let aprobaciones = 0;
    let negociacionesEnCurso = 0;
    let textosPendientes = 0;
    let listosParaPublicar = 0;

    for (const inmuebleId of activos) {
      const visita = ultimaVisita.get(inmuebleId);
      const tasacion = tasacionPorInmueble.get(inmuebleId);
      const negociacion = negociacionPorInmueble.get(inmuebleId);
      const publicacion = publicacionPorInmueble.get(inmuebleId);

      if (!visita || !visita.completada) {
        visitasPendientes++;
      }

      if (visita?.completada && !tasacion) {
        tasacionesPendientes++;
      }

      if (tasacion === "pendiente_aprobacion") {
        aprobaciones++;
      }

      if (negociacion === "en_curso") {
        negociacionesEnCurso++;
      }

      if (tasacion === "aprobado" && publicacion === undefined) {
        textosPendientes++;
      }

      if (publicacion === false) {
        listosParaPublicar++;
      }
    }

    const totalActivos = activos.size;

    return NextResponse.json({
      resumen: {
        activos: totalActivos,
        posicionesDisponibles,
        visitasPendientes,
        tasacionesPendientes,
        aprobaciones,
        negociaciones: negociacionesEnCurso,
        textosPendientes,
        listosParaPublicar,
      },
      pendientes: [
        {
          etapa: "Visita pendiente",
          total: visitasPendientes,
          tone: "amber",
        },
        {
          etapa: "Tasación pendiente",
          total: tasacionesPendientes,
          tone: "orange",
        },
        {
          etapa: "Pendiente de aprobación",
          total: aprobaciones,
          tone: "violet",
        },
        {
          etapa: "En negociación",
          total: negociacionesEnCurso,
          tone: "violet",
        },
        {
          etapa: "Texto pendiente",
          total: textosPendientes,
          tone: "rose",
        },
        {
          etapa: "Listo para publicar",
          total: listosParaPublicar,
          tone: "emerald",
        },
      ],
      recientes: recientes.map((item) => ({
        numero: item.numero
          ? String(item.numero).padStart(2, "0")
          : "—",
        nombre: item.nombre,
        etapa: eventoMap[item.evento] ?? item.evento,
        fecha: item.fecha,
      })),
    });
  } catch (error) {
    console.error("Error al consultar dashboard:", error);

    return NextResponse.json(
      { error: "No se pudo consultar el dashboard." },
      { status: 500 }
    );
  }
}
