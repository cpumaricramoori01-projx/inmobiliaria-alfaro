import { propertyInput, ownerInput, PropertyInputError } from "@/lib/property-input.mjs";
import { authorizeApi } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmAsignacionesPosicion,
  inmInmuebles,
  inmPosiciones,
  inmPropietarios,
  inmTasaciones,
  inmPublicaciones,
} from "@/db/schema";

async function findProperty(key: string) {
  const [row] = await db
    .select({
      id: inmInmuebles.id,
      codigo: inmInmuebles.codigo,
      propietarioId: inmInmuebles.propietarioId,
      tipo: inmInmuebles.tipo,
      referencia: inmInmuebles.referencia,
      direccion: inmInmuebles.direccion,
      distrito: inmInmuebles.distrito,
      provincia: inmInmuebles.provincia,
      departamento: inmInmuebles.departamento,
      areaTerreno: inmInmuebles.areaTerreno,
      areaConstruida: inmInmuebles.areaConstruida,
      habitaciones: inmInmuebles.habitaciones,
      banos: inmInmuebles.banos,
      caracteristicas: inmInmuebles.caracteristicas,
      observaciones: inmInmuebles.observaciones,
      estado: inmInmuebles.estado,
      etapa: inmInmuebles.etapa,
      fechaRegistro: inmInmuebles.fechaRegistro,
      fechaActualizacion: inmInmuebles.fechaActualizacion,
      fechaSalida: inmInmuebles.fechaSalida,
      posicion: inmPosiciones.numero,
      propietarioDni: inmPropietarios.dni,
      propietarioNombres: inmPropietarios.nombres,
      propietarioApellidos: inmPropietarios.apellidos,
      propietarioTelefono: inmPropietarios.telefono,
      propietarioEmail: inmPropietarios.email,
      propietarioReferencia: inmPropietarios.referenciaContacto,
      tasacionId: inmTasaciones.id,
      fechaTasacion: inmTasaciones.fechaTasacion,
      valorReferencia: inmTasaciones.valorReferencia,
      precioObjetivo: inmTasaciones.precioObjetivo,
      precioVenta: inmTasaciones.precioVenta,
      situacionTasacion: inmTasaciones.situacion,
      observacionTasacion: inmTasaciones.observacion,
      publicacionId: inmPublicaciones.id,
      textoPublicacion: inmPublicaciones.texto,
      enlacePublicacion: inmPublicaciones.driveLink,
      publicado: inmPublicaciones.publicado,
      fechaPublicacion: inmPublicaciones.fechaPublicacion,
    })
    .from(inmInmuebles)
    .leftJoin(inmPropietarios, eq(inmPropietarios.id, inmInmuebles.propietarioId))
    .leftJoin(
      inmAsignacionesPosicion,
      and(eq(inmAsignacionesPosicion.inmuebleId, inmInmuebles.id), eq(inmAsignacionesPosicion.activa, true))
    )
    .leftJoin(inmPosiciones, eq(inmPosiciones.id, inmAsignacionesPosicion.posicionId))
    .leftJoin(inmTasaciones, eq(inmTasaciones.inmuebleId, inmInmuebles.id))
    .leftJoin(inmPublicaciones, eq(inmPublicaciones.inmuebleId, inmInmuebles.id))
    .where(key.match(/^\d+$/) ? eq(inmInmuebles.id, Number(key)) : eq(inmInmuebles.codigo, key))
    .limit(1);

  return row;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeApi(undefined, "informacion");
    if (auth.response) return auth.response;
    const key = (await context.params).id;
    const row = await findProperty(key);
    if (!row) return NextResponse.json({ error: "Inmueble no encontrado." }, { status: 404 });

    const { tasacionId, fechaTasacion, valorReferencia, precioObjetivo, precioVenta, situacionTasacion, observacionTasacion, publicacionId, textoPublicacion, enlacePublicacion, publicado, fechaPublicacion, ...inmueble } = row;

    return NextResponse.json({
      inmueble,
      tasacion: tasacionId ? { id: tasacionId, fechaTasacion, valorReferencia, precioObjetivo, precioVenta, situacion: situacionTasacion, observacion: observacionTasacion } : null,
      publicacion: publicacionId ? { id: publicacionId, texto: textoPublicacion, enlace: enlacePublicacion, publicado, fechaPublicacion } : null,
    });
  } catch (error) {
    console.error("Error al consultar ficha:", error);
    return NextResponse.json({ error: "No se pudo consultar la ficha del inmueble." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeApi(request, "informacion");
    if (auth.response) return auth.response;
    const key = (await context.params).id;
    const row = await findProperty(key);
    if (!row) return NextResponse.json({ error: "Inmueble no encontrado." }, { status: 404 });

    let body;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Datos no válidos." }, { status: 400 }); }
    const propertyValues = propertyInput(body);
    const ownerValues = body.propietario === undefined ? undefined : ownerInput(body.propietario);
    await db.transaction(async tx => {
      const [current] = await tx.select({ propietarioId: inmInmuebles.propietarioId }).from(inmInmuebles)
        .where(eq(inmInmuebles.id, row.id)).limit(1).for("update");
      if (!current) throw new PropertyInputError("Inmueble no encontrado.");
      if (Object.keys(propertyValues).length) await tx.update(inmInmuebles).set(propertyValues).where(eq(inmInmuebles.id, row.id));
      if (ownerValues) {
        let ownerId = current.propietarioId;
        if (ownerId == null) {
          await tx.insert(inmPropietarios).values(ownerValues).onDuplicateKeyUpdate({ set: { dni: sql`dni` } });
          const [owner] = await tx.select({ id: inmPropietarios.id }).from(inmPropietarios)
            .where(eq(inmPropietarios.dni, ownerValues.dni)).limit(1).for("update");
          ownerId = owner.id;
          await tx.update(inmInmuebles).set({ propietarioId: ownerId }).where(eq(inmInmuebles.id, row.id));
        }
        await tx.update(inmPropietarios).set(ownerValues).where(eq(inmPropietarios.id, ownerId));
      } else if (ownerValues === null && current.propietarioId != null) {
        throw new PropertyInputError("Completa los datos del propietario vinculado.");
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PropertyInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if ((error as { cause?: { code?: string } }).cause?.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Ese DNI ya pertenece a otro propietario. Revisa la identificación." }, { status: 409 });
    console.error("Error al actualizar ficha:", error);
    return NextResponse.json({ error: "No se pudieron guardar los datos del inmueble." }, { status: 500 });
  }
}
