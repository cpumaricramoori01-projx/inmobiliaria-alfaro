import { authorizeApi } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmAsignacionesPosicion,
  inmInmuebles,
  inmPosiciones,
  inmPropietarios,
  inmTimeline,
  inmVisitas,
} from "@/db/schema";


function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidHttpUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;
    const rows = await db
      .select({
        id: inmInmuebles.id,
        codigo: inmInmuebles.codigo,
        tipo: inmInmuebles.tipo,
        referencia: inmInmuebles.referencia,
        direccion: inmInmuebles.direccion,
        distrito: inmInmuebles.distrito,
        provincia: inmInmuebles.provincia,
        departamento: inmInmuebles.departamento,
        propietario: sql<string>`
          CONCAT(
            COALESCE(${inmPropietarios.nombres}, ''),
            CASE
              WHEN ${inmPropietarios.nombres} IS NOT NULL
                AND ${inmPropietarios.apellidos} IS NOT NULL
                THEN ' '
              ELSE ''
            END,
            COALESCE(${inmPropietarios.apellidos}, '')
          )
        `,
        dni: inmPropietarios.dni,
        posicion: inmPosiciones.numero,
        fechaRegistro: inmInmuebles.fechaRegistro,
      })
      .from(inmInmuebles)
      .leftJoin(
        inmPropietarios,
        eq(inmInmuebles.propietarioId, inmPropietarios.id)
      )
      .innerJoin(
        inmAsignacionesPosicion,
        and(
          eq(inmAsignacionesPosicion.inmuebleId, inmInmuebles.id),
          eq(inmAsignacionesPosicion.activa, true)
        )
      )
      .innerJoin(
        inmPosiciones,
        eq(inmAsignacionesPosicion.posicionId, inmPosiciones.id)
      )
      .leftJoin(
        inmVisitas,
        and(
          eq(inmVisitas.inmuebleId, inmInmuebles.id),
          eq(inmVisitas.completada, true)
        )
      )
      .where(
        and(
          eq(inmInmuebles.estado, "activo"),
          sql`${inmVisitas.id} IS NULL`
        )
      )
      .orderBy(asc(inmInmuebles.fechaRegistro));

    const ahora = Date.now();

    const items = rows.map((row) => {
      const fechaRegistro = new Date(row.fechaRegistro).getTime();
      const dias = Math.max(
        0,
        Math.floor((ahora - fechaRegistro) / (1000 * 60 * 60 * 24))
      );

      return {
        id: row.id,
        codigo: row.codigo,
        tipo: row.tipo,
        nombre: row.referencia,
        ubicacion:
          [row.direccion, row.distrito, row.provincia, row.departamento]
            .filter(Boolean)
            .join(", ") || "Ubicación no registrada",
        propietario: row.propietario || "",
        dni: row.dni || "",
        posicion: String(row.posicion),
        dias,
      };
    });

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error) {
    console.error("Error al obtener visitas pendientes:", error);

    return NextResponse.json(
      { error: "No fue posible obtener las visitas pendientes." },
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
    const fechaVisita = clean(body.fechaVisita);
    const observaciones = clean(body.observaciones);
    const driveLink = clean(body.driveLink);

    if (!Number.isInteger(inmuebleId) || inmuebleId <= 0) {
      return NextResponse.json(
        { error: "El inmueble seleccionado no es válido." },
        { status: 400 }
      );
    }

    if (!isValidDate(fechaVisita)) {
      return NextResponse.json(
        { error: "La fecha de visita no es válida." },
        { status: 400 }
      );
    }

    const fechaVisitaObj = new Date(`${fechaVisita}T00:00:00`);

    if (Number.isNaN(fechaVisitaObj.getTime())) {
      return NextResponse.json(
        { error: "La fecha de visita no es válida." },
        { status: 400 }
      );
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaVisitaObj > hoy) {
      return NextResponse.json(
        { error: "La fecha de visita no puede ser futura." },
        { status: 400 }
      );
    }

    if (!isValidHttpUrl(driveLink)) {
      return NextResponse.json(
        { error: "El enlace de Google Drive no es válido." },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const [property] = await tx
        .select({
          id: inmInmuebles.id,
          codigo: inmInmuebles.codigo,
          estado: inmInmuebles.estado,
          referencia: inmInmuebles.referencia,
        })
        .from(inmInmuebles)
        .where(eq(inmInmuebles.id, inmuebleId))
        .limit(1);

      if (!property) {
        throw new Error("El inmueble seleccionado no existe.");
      }

      if (property.estado !== "activo") {
        throw new Error(
          "El inmueble ya no se encuentra activo en cartera. Actualiza la pantalla."
        );
      }

      const [activePosition] = await tx
        .select({
          id: inmAsignacionesPosicion.id,
        })
        .from(inmAsignacionesPosicion)
        .where(
          and(
            eq(inmAsignacionesPosicion.inmuebleId, inmuebleId),
            eq(inmAsignacionesPosicion.activa, true)
          )
        )
        .limit(1);

      if (!activePosition) {
        throw new Error(
          "El inmueble no tiene una posición activa en cartera."
        );
      }

      const [existingVisit] = await tx
        .select({ id: inmVisitas.id })
        .from(inmVisitas)
        .where(
          and(
            eq(inmVisitas.inmuebleId, inmuebleId),
            eq(inmVisitas.completada, true)
          )
        )
        .limit(1);

      if (existingVisit) {
        throw new Error("Este inmueble ya tiene una visita completada.");
      }

      const user = auth.user;

      const ahora = new Date();

      await tx.insert(inmVisitas).values({
        inmuebleId,
        fechaVisita: fechaVisitaObj,
        completada: true,
        fechaCompletada: ahora,
        observaciones: observaciones || null,
        driveLink: driveLink || null,
        usuarioId: user.id,
      });

      await tx.insert(inmTimeline).values({
        inmuebleId,
        evento: "visita_realizada",
        observacion:
          `Visita realizada el ${fechaVisita}.` +
          (observaciones ? ` ${observaciones}` : ""),
        usuarioId: user.id,
      });

      return {
        inmuebleId,
        codigo: property.codigo,
        referencia: property.referencia,
        estadoVisita: "realizada",
      };
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Visita registrada correctamente.",
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar visita:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible registrar la visita.",
      },
      { status: 500 }
    );
  }
}
