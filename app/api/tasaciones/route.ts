import { authorizeApi } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmAsignacionesPosicion,
  inmInmuebles,
  inmPosiciones,
  inmPropietarios,
  inmTasaciones,
  inmTimeline,
  inmVisitas,
} from "@/db/schema";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toMoney(value: unknown) {
  const raw = clean(value).replace(/,/g, "");
  if (!raw) return null;

  const n = Number(raw);

  return Number.isFinite(n) && n >= 0 ? raw : null;
}

const SITUACIONES = new Set([
  "pendiente_aprobacion",
  "en_negociacion",
  "aprobado",
  "rechazado",
]);


function mapRow(row: any) {
  return {
    id: row.tasacionId ?? null,
    inmuebleId: row.inmuebleId,
    codigo: row.codigo,
    posicion: row.posicion
      ? String(row.posicion).padStart(2, "0")
      : "—",
    nombre: row.referencia,
    ubicacion:
      [
        row.distrito,
        row.provincia,
        row.departamento,
        row.direccion,
      ]
        .filter(Boolean)
        .join(", ") || "Sin ubicación registrada",
    tipo: row.tipo,
    propietario:
      [row.propietarioNombres, row.propietarioApellidos]
        .filter(Boolean)
        .join(" ") || "Sin propietario",
    dni: row.dni ?? null,
    fechaTasacion: row.fechaTasacion ?? null,
    valorReferencia: row.valorReferencia ?? null,
    precioObjetivo: row.precioObjetivo ?? null,
    situacion: row.situacion ?? null,
    observacion: row.observacion ?? null,
  };
}

export async function GET() {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;
    const pendientes = await db
      .select({
        inmuebleId: inmInmuebles.id,
        codigo: inmInmuebles.codigo,
        tipo: inmInmuebles.tipo,
        referencia: inmInmuebles.referencia,
        direccion: inmInmuebles.direccion,
        distrito: inmInmuebles.distrito,
        provincia: inmInmuebles.provincia,
        departamento: inmInmuebles.departamento,
        propietarioNombres: inmPropietarios.nombres,
        propietarioApellidos: inmPropietarios.apellidos,
        dni: inmPropietarios.dni,
        posicion: inmPosiciones.numero,
      })
      .from(inmInmuebles)
      .leftJoin(
        inmPropietarios,
        eq(inmPropietarios.id, inmInmuebles.propietarioId)
      )
      .leftJoin(
        inmTasaciones,
        eq(inmTasaciones.inmuebleId, inmInmuebles.id)
      )
      .innerJoin(
        inmAsignacionesPosicion,
        and(
          eq(
            inmAsignacionesPosicion.inmuebleId,
            inmInmuebles.id
          ),
          eq(inmAsignacionesPosicion.activa, true)
        )
      )
      .innerJoin(
        inmPosiciones,
        eq(
          inmPosiciones.id,
          inmAsignacionesPosicion.posicionId
        )
      )
      .innerJoin(
        inmVisitas,
        and(
          eq(inmVisitas.inmuebleId, inmInmuebles.id),
          eq(inmVisitas.completada, true)
        )
      )
      .where(
        and(
          eq(inmInmuebles.estado, "activo"),
          isNull(inmTasaciones.id)
        )
      )
      .orderBy(asc(inmPosiciones.numero));

    const registradas = await db
      .select({
        tasacionId: inmTasaciones.id,
        inmuebleId: inmInmuebles.id,
        codigo: inmInmuebles.codigo,
        tipo: inmInmuebles.tipo,
        referencia: inmInmuebles.referencia,
        direccion: inmInmuebles.direccion,
        distrito: inmInmuebles.distrito,
        provincia: inmInmuebles.provincia,
        departamento: inmInmuebles.departamento,
        propietarioNombres: inmPropietarios.nombres,
        propietarioApellidos: inmPropietarios.apellidos,
        dni: inmPropietarios.dni,
        posicion: inmPosiciones.numero,
        fechaTasacion: inmTasaciones.fechaTasacion,
        valorReferencia: inmTasaciones.valorReferencia,
        precioObjetivo: inmTasaciones.precioObjetivo,
        situacion: inmTasaciones.situacion,
        observacion: inmTasaciones.observacion,
      })
      .from(inmTasaciones)
      .innerJoin(
        inmInmuebles,
        eq(inmInmuebles.id, inmTasaciones.inmuebleId)
      )
      .leftJoin(
        inmPropietarios,
        eq(inmPropietarios.id, inmInmuebles.propietarioId)
      )
      .leftJoin(
        inmAsignacionesPosicion,
        and(
          eq(
            inmAsignacionesPosicion.inmuebleId,
            inmInmuebles.id
          ),
          eq(inmAsignacionesPosicion.activa, true)
        )
      )
      .leftJoin(
        inmPosiciones,
        eq(
          inmPosiciones.id,
          inmAsignacionesPosicion.posicionId
        )
      )
      .where(eq(inmInmuebles.estado, "activo"))
      .orderBy(desc(inmTasaciones.fechaActualizacion));

    const aprobadas = registradas.filter(
      (item) => item.situacion === "aprobado"
    );

    return NextResponse.json({
      ok: true,
      pendientes: pendientes.map(mapRow),
      registradas: registradas.map(mapRow),
      aprobadas: aprobadas.map(mapRow),
    });
  } catch (error) {
    console.error("Error al consultar tasaciones:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron consultar las tasaciones.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeApi(request);
    if (auth.response) return auth.response;
    const body = await request.json();

    const inmuebleId = Number(body.inmuebleId);
    const fechaTasacion = clean(body.fechaTasacion);
    const situacion = clean(body.situacion);
    const valorReferencia = toMoney(body.valorReferencia);
    const precioObjetivo = toMoney(body.precioObjetivo);
    const observacion = clean(body.observacion);

    if (!Number.isInteger(inmuebleId) || inmuebleId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Inmueble no válido." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaTasacion)) {
      return NextResponse.json(
        { ok: false, error: "La fecha de tasación no es válida." },
        { status: 400 }
      );
    }

    const fecha = new Date(`${fechaTasacion}T00:00:00`);

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.getTime() > new Date().setHours(23, 59, 59, 999)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "La fecha de tasación no puede ser futura.",
        },
        { status: 400 }
      );
    }

    if (!SITUACIONES.has(situacion)) {
      return NextResponse.json(
        {
          ok: false,
          error: "La situación seleccionada no es válida.",
        },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const [property] = await tx
        .select()
        .from(inmInmuebles)
        .where(eq(inmInmuebles.id, inmuebleId))
        .limit(1);

      if (!property) {
        throw new Error("El inmueble no existe.");
      }

      if (property.estado !== "activo") {
        throw new Error("El inmueble ya no está activo.");
      }

      const [existing] = await tx
        .select({ id: inmTasaciones.id })
        .from(inmTasaciones)
        .where(eq(inmTasaciones.inmuebleId, inmuebleId))
        .limit(1);

      if (existing) {
        throw new Error(
          "El inmueble ya tiene una tasación vigente registrada."
        );
      }

      const user = auth.user;

      await tx.insert(inmTasaciones).values({
        inmuebleId,
        fechaTasacion: fecha,
        valorReferencia,
        precioObjetivo,
        situacion,
        observacion: observacion || null,
        usuarioId: user.id,
      });

      await tx.insert(inmTimeline).values({
        inmuebleId,
        evento: "tasacion_realizada",
        observacion:
          observacion ||
          `Tasación registrada. Situación: ${situacion}.`,
        usuarioId: user.id,
      });

      return {
        codigo: property.codigo,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No fue posible registrar la tasación.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status:
          /no existe|ya no está|ya tiene/i.test(message)
            ? 409
            : 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorizeApi(request);
    if (auth.response) return auth.response;
    const body = await request.json();

    const inmuebleId = Number(body.inmuebleId);
    const situacion = clean(body.situacion);
    const observacion =
      body.observacion === undefined
        ? undefined
        : clean(body.observacion);

    if (
      !Number.isInteger(inmuebleId) ||
      inmuebleId <= 0 ||
      !SITUACIONES.has(situacion)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Datos de actualización no válidos.",
        },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const [tasacion] = await tx
        .select()
        .from(inmTasaciones)
        .where(eq(inmTasaciones.inmuebleId, inmuebleId))
        .limit(1);

      if (!tasacion) {
        throw new Error(
          "El inmueble no tiene una tasación registrada."
        );
      }

      const user = auth.user;

      await tx
        .update(inmTasaciones)
        .set({
          situacion,
          ...(observacion !== undefined
            ? { observacion: observacion || null }
            : {}),
        })
        .where(eq(inmTasaciones.inmuebleId, inmuebleId));

      await tx.insert(inmTimeline).values({
        inmuebleId,
        evento: "tasacion_actualizada",
        observacion: `Situación actualizada a: ${situacion}.${
          observacion !== undefined && observacion
            ? ` Observación: ${observacion}`
            : ""
        }`,
        usuarioId: user.id,
      });

      return {
        situacion,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No fue posible actualizar la tasación.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
