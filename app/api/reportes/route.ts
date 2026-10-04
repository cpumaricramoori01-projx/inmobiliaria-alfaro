import type { ReportRow } from "@/lib/report-types";
import { authorizeApi } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmArchivos,
  inmAsignacionesPosicion,
  inmInmuebles,
  inmLiberaciones,
  inmNegociaciones,
  inmPosiciones,
  inmPropietarios,
  inmPublicaciones,
  inmTasaciones,
  inmTimeline,
  inmVisitas,
} from "@/db/schema";

const tipoMap: Record<string, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
  otros: "Otros",
};

function fmtDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function daysBetween(
  a?: Date | string | null,
  b?: Date | string | null,
) {
  if (!a || !b) return null;

  const diff = new Date(b).getTime() - new Date(a).getTime();

  if (!Number.isFinite(diff)) return null;

  return Math.max(0, Math.round(diff / 86400000));
}

function normalizarTipo(value: string | null | undefined) {
  if (!value) return "Otros";
  return tipoMap[value.toLowerCase()] ?? value;
}

function esActivo(estado: string | null | undefined) {
  return estado?.toLowerCase() === "activo";
}

function esTasacionAprobada(
  situacion: string | null | undefined,
) {
  return ["aprobado", "aprobada"].includes(
    situacion?.toLowerCase() ?? "",
  );
}

function esTasacionRechazada(
  situacion: string | null | undefined,
) {
  return ["rechazado", "rechazada", "tasacion_rechazada"].includes(
    situacion?.toLowerCase() ?? "",
  );
}

function agregarSituaciones(item: {
  visitaPendiente: boolean;
  tasacionPendiente: boolean;
  aprobacionPendiente: boolean;
  materialPendiente: boolean;
  negociacionEnCurso: boolean;
  listoParaPublicar: boolean;
  publicado: boolean;
}) {
  const situaciones: string[] = [];

  if (item.visitaPendiente) situaciones.push("Visita pendiente");
  if (item.tasacionPendiente) situaciones.push("Tasación pendiente");
  if (item.aprobacionPendiente) {
    situaciones.push("Pendiente de aprobación");
  }
  if (item.materialPendiente) situaciones.push("Material pendiente");
  if (item.negociacionEnCurso) situaciones.push("En negociación");
  if (item.listoParaPublicar) situaciones.push("Listo para publicar");
  if (item.publicado) situaciones.push("Publicado");

  return situaciones;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;
    const sp = request.nextUrl.searchParams;

    const reporte = sp.get("reporte") || "Cartera activa";
    const desde = sp.get("desde") || "";
    const hasta = sp.get("hasta") || "";
    const situacion = sp.get("situacion") || "Todas";
    const estado = sp.get("estado") || "Todos";
    const posicionFiltro = sp.get("posicion") || "";
    const tipo = sp.get("tipo") || "Todos";

    const inmuebleRows = await db
      .select({
        id: inmInmuebles.id,
        codigo: inmInmuebles.codigo,
        referencia: inmInmuebles.referencia,
        tipo: inmInmuebles.tipo,
        estado: inmInmuebles.estado,
        fechaRegistro: inmInmuebles.fechaRegistro,
        fechaSalida: inmInmuebles.fechaSalida,
        distrito: inmInmuebles.distrito,
        provincia: inmInmuebles.provincia,
        departamento: inmInmuebles.departamento,
        propietario: inmPropietarios.nombres,
        propietarioApellidos: inmPropietarios.apellidos,
      })
      .from(inmInmuebles)
      .leftJoin(
        inmPropietarios,
        eq(inmPropietarios.id, inmInmuebles.propietarioId),
      )
      .orderBy(asc(inmInmuebles.fechaRegistro));

    const positionRows = await db
      .select({
        inmuebleId: inmAsignacionesPosicion.inmuebleId,
        posicion: inmPosiciones.numero,
        activa: inmAsignacionesPosicion.activa,
        fechaInicio: inmAsignacionesPosicion.fechaInicio,
        fechaFin: inmAsignacionesPosicion.fechaFin,
      })
      .from(inmAsignacionesPosicion)
      .leftJoin(
        inmPosiciones,
        eq(inmPosiciones.id, inmAsignacionesPosicion.posicionId),
      )
      .orderBy(
        asc(inmAsignacionesPosicion.fechaInicio),
      );

    const positionAvailability = await db.select({ numero: inmPosiciones.numero, assigned: inmAsignacionesPosicion.id })
      .from(inmPosiciones).leftJoin(inmAsignacionesPosicion, and(
        eq(inmAsignacionesPosicion.posicionId, inmPosiciones.id), eq(inmAsignacionesPosicion.activa, true),
      )).where(eq(inmPosiciones.activo, true));
    const availablePositions = positionAvailability.filter(position => position.assigned == null).map(position => position.numero);

    const visitas = await db
      .select()
      .from(inmVisitas)
      .where(eq(inmVisitas.completada, true))
      .orderBy(desc(inmVisitas.fechaRegistro));

    const photos = await db.select({ inmuebleId: inmArchivos.inmuebleId }).from(inmArchivos)
      .where(and(eq(inmArchivos.tipoDocumento, "FOTO_INMUEBLE"), eq(inmArchivos.almacenamiento, "hosting")));
    const propertiesWithPhotos = new Set(photos.map(photo => photo.inmuebleId));

    const tasaciones = await db
      .select()
      .from(inmTasaciones)
      .orderBy(desc(inmTasaciones.fechaRegistro));

    const publicaciones = await db
      .select()
      .from(inmPublicaciones)
      .orderBy(desc(inmPublicaciones.fechaRegistro));

    const negociaciones = await db
      .select()
      .from(inmNegociaciones)
      .orderBy(desc(inmNegociaciones.fechaRegistro));

    const liberaciones = await db
      .select()
      .from(inmLiberaciones)
      .orderBy(desc(inmLiberaciones.fechaRegistro));

    const timeline = await db
      .select()
      .from(inmTimeline)
      .orderBy(asc(inmTimeline.fechaEvento));

    const posByInmueble = new Map<
      number,
      typeof positionRows
    >();

    for (const position of positionRows) {
      const arr = posByInmueble.get(position.inmuebleId) || [];
      arr.push(position);
      posByInmueble.set(position.inmuebleId, arr);
    }

    const visitaByInmueble = new Map<number, (typeof visitas)[number]>();

    for (const visita of visitas) {
      if (!visitaByInmueble.has(visita.inmuebleId)) {
        visitaByInmueble.set(visita.inmuebleId, visita);
      }
    }

    const tasacionByInmueble = new Map<
      number,
      (typeof tasaciones)[number]
    >();

    for (const tasacion of tasaciones) {
      if (!tasacionByInmueble.has(tasacion.inmuebleId)) {
        tasacionByInmueble.set(tasacion.inmuebleId, tasacion);
      }
    }

    const publicacionByInmueble = new Map<
      number,
      (typeof publicaciones)[number]
    >();

    for (const publicacion of publicaciones) {
      if (!publicacionByInmueble.has(publicacion.inmuebleId)) {
        publicacionByInmueble.set(
          publicacion.inmuebleId,
          publicacion,
        );
      }
    }

    const negociacionByInmueble = new Map<
      number,
      (typeof negociaciones)[number]
    >();

    for (const negociacion of negociaciones) {
      if (!negociacionByInmueble.has(negociacion.inmuebleId)) {
        negociacionByInmueble.set(
          negociacion.inmuebleId,
          negociacion,
        );
      }
    }

    const liberacionByInmueble = new Map<
      number,
      (typeof liberaciones)[number]
    >();

    for (const liberacion of liberaciones) {
      if (!liberacionByInmueble.has(liberacion.inmuebleId)) {
        liberacionByInmueble.set(
          liberacion.inmuebleId,
          liberacion,
        );
      }
    }

    const timelineByInmueble = new Map<
      number,
      typeof timeline
    >();

    for (const event of timeline) {
      const arr =
        timelineByInmueble.get(event.inmuebleId) || [];

      arr.push(event);
      timelineByInmueble.set(event.inmuebleId, arr);
    }

    const base = inmuebleRows.map((x) => {
      const positions = posByInmueble.get(x.id) || [];

      const activePosition = positions.find(
        (position) => position.activa,
      );

      const latestPosition =
        positions.length > 0
          ? positions[positions.length - 1]
          : null;

      const visita = visitaByInmueble.get(x.id);
      const tasacion = tasacionByInmueble.get(x.id);
      const publicacion = publicacionByInmueble.get(x.id);
      const negociacion = negociacionByInmueble.get(x.id);
      const liberacion = liberacionByInmueble.get(x.id);

      const activo = esActivo(x.estado);

      const visitaRealizada = Boolean(
        visita?.completada,
      );

      const visitaPendiente =
        activo && Boolean(activePosition) && !visitaRealizada;

      const tasacionPendiente =
        activo &&
        Boolean(activePosition) &&
        visitaRealizada &&
        !tasacion;

      const aprobacionPendiente =
        activo &&
        Boolean(
          tasacion &&
            tasacion.situacion?.toLowerCase() ===
              "pendiente_aprobacion",
        );

      const materialPendiente =
        activo &&
        esTasacionAprobada(tasacion?.situacion) &&
        (!publicacion?.texto?.trim() || !propertiesWithPhotos.has(x.id));

      const negociacionEnCurso =
        activo &&
        negociacion?.estado?.toLowerCase() ===
          "en_curso";

      const listoParaPublicar =
        activo &&
        Boolean(
          publicacion &&
            !publicacion.publicado,
        );

      const publicado =
        activo &&
        Boolean(publicacion?.publicado);

      const situaciones = agregarSituaciones({
        visitaPendiente,
        tasacionPendiente,
        aprobacionPendiente,
        materialPendiente,
        negociacionEnCurso,
        listoParaPublicar,
        publicado,
      });

      const fechaVisita =
        visita?.fechaCompletada ??
        visita?.fechaVisita ??
        null;

      return {
        inmuebleId: x.id,
        codigo: x.codigo,
        nombre: x.referencia,
        tipo: normalizarTipo(x.tipo),
        ubicacion:
          [
            x.distrito,
            x.provincia,
            x.departamento,
          ]
            .filter(Boolean)
            .join(", ") || "Sin ubicación",
        propietario:
          [
            x.propietario,
            x.propietarioApellidos,
          ]
            .filter(Boolean)
            .join(" ") || "Sin propietario",
        posicion:
          activePosition?.posicion ??
          latestPosition?.posicion ??
          null,
        estado: activo ? "Activo" : "Histórico",

        visitaRealizada,
        visitaPendiente,
        fechaVisita: fmtDate(fechaVisita),

        tasacionRegistrada: Boolean(tasacion),
        tasacionPendiente,
        fechaTasacion: fmtDate(
          tasacion?.fechaTasacion,
        ),
        tasacion:
          tasacion
            ? Number(
                tasacion.precioObjetivo ??
                  tasacion.valorReferencia ??
                  0,
              )
            : null,
        situacionTasacion:
          tasacion?.situacion ?? null,
        aprobacionPendiente,
        tasacionAprobada:
          esTasacionAprobada(
            tasacion?.situacion,
          ),
        tasacionRechazada:
          esTasacionRechazada(
            tasacion?.situacion,
          ),

        materialPendiente,

        negociacionEnCurso,
        estadoNegociacion:
          negociacion?.estado ?? null,

        publicacionRegistrada:
          Boolean(publicacion),
        listoParaPublicar,
        publicado,
        fechaPublicacion: fmtDate(
          publicacion?.fechaPublicacion,
        ),

        situaciones,

        fechaRegistro: fmtDate(
          x.fechaRegistro,
        ),
        fechaSalida: fmtDate(
          x.fechaSalida,
        ),

        motivoLiberacion:
          liberacion?.motivo ?? null,
        detalleLiberacion:
          liberacion?.detalleOtro ?? null,
      };
    });

    const filtered = base.filter((x) => {
      const fecha = x.fechaRegistro
        ? new Date(x.fechaRegistro)
        : null;

      if (
        desde &&
        (!fecha ||
          fecha <
            new Date(`${desde}T00:00:00`))
      ) {
        return false;
      }

      if (
        hasta &&
        (!fecha ||
          fecha >
            new Date(`${hasta}T23:59:59`))
      ) {
        return false;
      }

      if (
        situacion !== "Todas" &&
        !x.situaciones.includes(situacion)
      ) {
        return false;
      }

      if (
        estado !== "Todos" &&
        x.estado !== estado
      ) {
        return false;
      }

      if (
        posicionFiltro &&
        String(x.posicion) !==
          posicionFiltro.replace(/^0+/, "")
      ) {
        return false;
      }

      if (
        tipo !== "Todos" &&
        x.tipo !== tipo
      ) {
        return false;
      }

      return true;
    });

    const active = filtered.filter(
      (x) => x.estado === "Activo",
    );

    let rows: ReportRow[] = filtered;

    if (reporte === "Posiciones disponibles") {
      const posicionSolicitada =
        posicionFiltro
          ? Number(posicionFiltro)
          : null;

      rows = availablePositions.filter(numero => !posicionSolicitada || numero === posicionSolicitada)
        .map((numero) => ({
          posicion: numero,
          estado: "Disponible",
        }));
    } else if (
      reporte === "Visitas realizadas"
    ) {
      rows = filtered.filter(
        (x) => x.visitaRealizada,
      );
    } else if (
      reporte === "Visitas pendientes"
    ) {
      rows = filtered.filter(
        (x) => x.visitaPendiente,
      );
    } else if (
      reporte === "Tasaciones realizadas"
    ) {
      rows = filtered.filter(
        (x) => x.tasacionRegistrada,
      );
    } else if (
      reporte === "Tasaciones pendientes"
    ) {
      rows = filtered.filter(
        (x) => x.tasacionPendiente,
      );
    } else if (
      reporte === "Aprobaciones pendientes"
    ) {
      rows = filtered.filter(
        (x) => x.aprobacionPendiente,
      );
    } else if (
      reporte === "Negociaciones"
    ) {
      rows = filtered.filter(
        (x) => x.negociacionEnCurso,
      );
    } else if (
      reporte === "Aprobaciones y negociación"
    ) {
      rows = filtered.filter(
        (x) =>
          x.aprobacionPendiente ||
          x.negociacionEnCurso ||
          x.tasacionAprobada ||
          x.tasacionRechazada,
      );
    } else if (
      reporte === "Material pendiente"
    ) {
      rows = filtered.filter(
        (x) => x.materialPendiente,
      );
    } else if (
      reporte === "Listos para publicar"
    ) {
      rows = filtered.filter(
        (x) => x.listoParaPublicar,
      );
    } else if (
      reporte === "Publicados"
    ) {
      rows = filtered.filter(
        (x) => x.publicado,
      );
    } else if (
      reporte === "Vendidos"
    ) {
      rows = filtered.filter(
        (x) => x.motivoLiberacion === "vendido",
      );
    } else if (
      reporte === "Retirados / cancelados"
    ) {
      rows = filtered.filter(
        (x) =>
          [
            "cancelacion_propietario",
            "cancelacion_externa",
            "otro",
          ].includes(
            x.motivoLiberacion || "",
          ),
      );
    } else if (
      reporte === "Motivos de liberación"
    ) {
      rows = filtered.filter(
        (x) => Boolean(x.motivoLiberacion),
      );
    } else if (
      reporte === "Tiempo de permanencia"
    ) {
      rows = filtered.map((x) => ({
        ...x,
        dias:
          daysBetween(
            x.fechaRegistro,
            x.fechaSalida,
          ) ??
          daysBetween(
            x.fechaRegistro,
            new Date(),
          ),
      }));
    } else if (
      reporte === "Posición ocupada"
    ) {
      rows = positionRows
        .map((position) => {
          const x = base.find(
            (item) =>
              item.inmuebleId ===
              position.inmuebleId,
          );

          if (!x) return null;

          if (
            posicionFiltro &&
            String(position.posicion) !==
              posicionFiltro.replace(/^0+/, "")
          ) {
            return null;
          }

          return {
            ...x,
            posicion: position.posicion,
            fechaInicioPosicion:
              fmtDate(position.fechaInicio),
            fechaFinPosicion:
              fmtDate(position.fechaFin),
            activaPosicion:
              position.activa,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
    } else if (reporte.includes("→")) {
      const events = timelineByInmueble;

      const targetMap: Record<
        string,
        [string, string]
      > = {
        "Registro → visita": [
          "inmueble_registrado",
          "visita_realizada",
        ],
        "Visita → tasación": [
          "visita_realizada",
          "tasacion_realizada",
        ],
        "Tasación → aprobación": [
          "tasacion_realizada",
          "tasacion_actualizada",
        ],
        "Aprobación → publicación": [
          "tasacion_actualizada",
          "publicacion_registrada",
        ],
      };

      const [from, to] =
        targetMap[reporte] || ["", ""];

      rows = filtered
        .map((x) => {
          const ev =
            events.get(x.inmuebleId) || [];

          const startEvent = ev.find(
            (event) =>
              event.evento === from,
          );

          const endEvent = ev.find(
            (event) =>
              event.evento === to &&
              (!startEvent ||
                new Date(event.fechaEvento).getTime() >=
                  new Date(
                    startEvent.fechaEvento,
                  ).getTime()),
          );

          const fechaInicioFlujo =
            fmtDate(
              startEvent?.fechaEvento,
            );

          const fechaFinFlujo =
            fmtDate(
              endEvent?.fechaEvento,
            );

          return {
            ...x,
            fechaInicioFlujo,
            fechaFinFlujo,
            dias: daysBetween(
              startEvent?.fechaEvento,
              endEvent?.fechaEvento,
            ),
          };
        })
        .filter(
          (x) =>
            x.fechaInicioFlujo,
        );
    } else if (
      reporte === "Histórico de inmuebles"
    ) {
      rows = filtered.filter(
        (x) => x.estado === "Histórico",
      );
    } else if (
      reporte === "Inmuebles por estado"
    ) {
      rows = filtered;
    } else if (
      reporte === "Situación de cartera"
    ) {
      rows = filtered;
    } else if (
      reporte === "Cartera activa"
    ) {
      rows = active;
    }

    const activosBase = base.filter(
      (x) => x.estado === "Activo",
    );

    const disponibles = availablePositions.length;

    const resumen = {
      total: rows.length,
      activos: activosBase.length,
      historicos: base.filter(
        (x) => x.estado === "Histórico",
      ).length,
      disponibles,

      visitasPendientes:
        activosBase.filter(
          (x) => x.visitaPendiente,
        ).length,

      visitasRealizadas:
        activosBase.filter(
          (x) => x.visitaRealizada,
        ).length,

      tasacionesPendientes:
        activosBase.filter(
          (x) => x.tasacionPendiente,
        ).length,

      tasacionesRealizadas:
        activosBase.filter(
          (x) => x.tasacionRegistrada,
        ).length,

      aprobaciones:
        activosBase.filter(
          (x) => x.aprobacionPendiente,
        ).length,

      negociaciones:
        activosBase.filter(
          (x) => x.negociacionEnCurso,
        ).length,

      materialPendiente:
        activosBase.filter(
          (x) => x.materialPendiente,
        ).length,

      listosParaPublicar:
        activosBase.filter(
          (x) => x.listoParaPublicar,
        ).length,

      publicados:
        activosBase.filter(
          (x) => x.publicado,
        ).length,
    };

    return NextResponse.json({
      ok: true,
      reporte,
      resumen,
      rows,
    });
  } catch (error) {
    console.error("Operación fallida: reportes", (error as { code?: string; cause?: { code?: string } }).cause?.code ?? (error as { code?: string }).code ?? "ERROR");

    return NextResponse.json(
      {
        ok: false,
        error:
          "No se pudo generar el reporte.",
      },
      { status: 500 },
    );
  }
}