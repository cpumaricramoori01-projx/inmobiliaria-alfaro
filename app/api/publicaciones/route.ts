import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmAsignacionesPosicion,
  inmInmuebles,
  inmPosiciones,
  inmPropietarios,
  inmPublicaciones,
  inmTasaciones,
  inmTimeline,
  inmUsuarios,
} from "@/db/schema";

const clean = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

async function getSystemUser(tx: any) {
  const email = "sistema@inmobiliaria-alfaro.local";

  let [user] = await tx
    .select()
    .from(inmUsuarios)
    .where(eq(inmUsuarios.email, email))
    .limit(1);

  if (!user) {
    const [created] = await tx
      .insert(inmUsuarios)
      .values({
        nombre: "Usuario actual",
        email,
        rol: "usuario",
        activo: true,
      })
      .$returningId();

    [user] = await tx
      .select()
      .from(inmUsuarios)
      .where(eq(inmUsuarios.id, created.id))
      .limit(1);
  }

  if (!user) {
    throw new Error(
      "No fue posible registrar el usuario de trazabilidad."
    );
  }

  return user;
}

const mapPending = (row: any) => ({
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
  valorReferencia: row.valorReferencia,
  precioObjetivo: row.precioObjetivo,
  situacion: row.situacion,
});

async function approved() {
  return db
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
      posicion: inmPosiciones.numero,
      valorReferencia: inmTasaciones.valorReferencia,
      precioObjetivo: inmTasaciones.precioObjetivo,
      situacion: inmTasaciones.situacion,
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
    .leftJoin(
      inmPublicaciones,
      eq(
        inmPublicaciones.inmuebleId,
        inmInmuebles.id
      )
    )
    .where(
      and(
        eq(inmInmuebles.estado, "activo"),
        eq(inmTasaciones.situacion, "aprobado"),
        isNull(inmPublicaciones.id)
      )
    )
    .orderBy(desc(inmTasaciones.fechaActualizacion));
}

async function published() {
  return db
    .select({
      inmuebleId: inmInmuebles.id,
      codigo: inmInmuebles.codigo,
      tipo: inmInmuebles.tipo,
      referencia: inmInmuebles.referencia,
      posicion: inmPosiciones.numero,
      publicado: inmPublicaciones.publicado,
      fechaPublicacion: inmPublicaciones.fechaPublicacion,
    })
    .from(inmPublicaciones)
    .innerJoin(
      inmInmuebles,
      eq(inmInmuebles.id, inmPublicaciones.inmuebleId)
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
    .where(
      and(
        eq(inmInmuebles.estado, "activo"),
        eq(inmPublicaciones.publicado, true)
      )
    )
    .orderBy(desc(inmPublicaciones.fechaPublicacion));
}

async function ready() {
  return db
    .select({
      inmuebleId: inmInmuebles.id,
      codigo: inmInmuebles.codigo,
      tipo: inmInmuebles.tipo,
      referencia: inmInmuebles.referencia,
      posicion: inmPosiciones.numero,
      publicado: inmPublicaciones.publicado,
      fechaRegistro: inmPublicaciones.fechaRegistro,
    })
    .from(inmPublicaciones)
    .innerJoin(
      inmInmuebles,
      eq(inmInmuebles.id, inmPublicaciones.inmuebleId)
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
    .where(
      and(
        eq(inmInmuebles.estado, "activo"),
        eq(inmPublicaciones.publicado, false)
      )
    )
    .orderBy(desc(inmPublicaciones.fechaRegistro));
}

export async function GET() {
  try {
    const rows = await approved();
    const listos = await ready();
    const publicadas = await published();

    return NextResponse.json({
      ok: true,
      pendientes: rows.map(mapPending),
      listos,
      publicadas,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron consultar los textos pendientes.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const inmuebleId = Number(body.inmuebleId);
    const texto = clean(body.texto);
    const driveLink = clean(body.driveLink);

    if (!Number.isInteger(inmuebleId) || inmuebleId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Inmueble no válido." },
        { status: 400 }
      );
    }

    if (!texto) {
      return NextResponse.json(
        {
          ok: false,
          error: "El texto de publicación es obligatorio.",
        },
        { status: 400 }
      );
    }

    if (!/^https?:\/\//i.test(driveLink)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El enlace de Google Drive debe ser una URL HTTP o HTTPS.",
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

      if (!property || property.estado !== "activo") {
        throw new Error("El inmueble no está activo.");
      }

      const [tasacion] = await tx
        .select()
        .from(inmTasaciones)
        .where(
          and(
            eq(inmTasaciones.inmuebleId, inmuebleId),
            eq(inmTasaciones.situacion, "aprobado")
          )
        )
        .limit(1);

      if (!tasacion) {
        throw new Error(
          "El inmueble no tiene una tasación aprobada."
        );
      }

      const [existingPublication] = await tx
        .select({ id: inmPublicaciones.id })
        .from(inmPublicaciones)
        .where(eq(inmPublicaciones.inmuebleId, inmuebleId))
        .limit(1);

      if (existingPublication) {
        throw new Error(
          "El inmueble ya tiene una publicación registrada."
        );
      }

      const user = await getSystemUser(tx);

      await tx.insert(inmPublicaciones).values({
        inmuebleId,
        texto,
        driveLink,
        usuarioRegistroId: user.id,
        publicado: false,
      });

      await tx.insert(inmTimeline).values({
        inmuebleId,
        evento: "publicacion_registrada",
        observacion:
          "Texto y enlace de Google Drive registrados. Inmueble listo para publicar.",
        usuarioId: user.id,
      });

      return {
        situacion: "listo_para_publicar",
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
        : "No fue posible registrar la publicación.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status:
          /no está activo|no tiene|ya tiene/i.test(message)
            ? 409
            : 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const inmuebleId = Number(body.inmuebleId);

    if (!Number.isInteger(inmuebleId) || inmuebleId <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Inmueble no válido.",
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

      if (!property || property.estado !== "activo") {
        throw new Error("El inmueble no está activo.");
      }

      const [publication] = await tx
        .select()
        .from(inmPublicaciones)
        .where(eq(inmPublicaciones.inmuebleId, inmuebleId))
        .limit(1);

      if (!publication) {
        throw new Error(
          "El inmueble no tiene una publicación registrada."
        );
      }

      if (publication.publicado) {
        throw new Error(
          "La publicación ya figura como publicada."
        );
      }

      const user = await getSystemUser(tx);
      const ahora = new Date();

      await tx
        .update(inmPublicaciones)
        .set({
          publicado: true,
          fechaPublicacion: ahora,
          usuarioPublicacionId: user.id,
        })
        .where(eq(inmPublicaciones.id, publication.id));

      await tx.insert(inmTimeline).values({
        inmuebleId,
        evento: "publicado",
        observacion:
          "La publicación fue marcada como publicada.",
        usuarioId: user.id,
      });

      return {
        codigo: property.codigo,
        situacion: "publicado",
        fechaPublicacion: ahora,
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
        : "No fue posible marcar la publicación.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status:
          /no está activo|no tiene|ya figura/i.test(message)
            ? 409
            : 500,
      }
    );
  }
}
