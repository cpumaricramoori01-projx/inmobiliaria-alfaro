import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmAsignacionesPosicion, inmInmuebles, inmPosiciones, inmPropietarios, inmTimeline, inmUsuarios, inmVisitas } from "@/db/schema";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getSystemUser(tx: any) {
  const email = "sistema@inmobiliaria-alfaro.local";
  let [user] = await tx.select().from(inmUsuarios).where(eq(inmUsuarios.email, email)).limit(1);
  if (!user) {
    await tx.insert(inmUsuarios).values({ nombre: "Usuario actual", email, rol: "usuario", activo: true });
    [user] = await tx.select().from(inmUsuarios).where(eq(inmUsuarios.email, email)).limit(1);
  }
  if (!user) throw new Error("No fue posible registrar el usuario de trazabilidad.");
  return user;
}

export async function GET() {
  try {
    const rows = await db.select({
      inmuebleId: inmInmuebles.id, codigo: inmInmuebles.codigo, tipo: inmInmuebles.tipo,
      referencia: inmInmuebles.referencia, direccion: inmInmuebles.direccion,
      distrito: inmInmuebles.distrito, provincia: inmInmuebles.provincia, departamento: inmInmuebles.departamento,
      propietarioNombres: inmPropietarios.nombres, propietarioApellidos: inmPropietarios.apellidos,
      dni: inmPropietarios.dni, posicion: inmPosiciones.numero, fechaRegistro: inmInmuebles.fechaRegistro,
    }).from(inmInmuebles)
      .innerJoin(inmPropietarios, eq(inmPropietarios.id, inmInmuebles.propietarioId))
      .leftJoin(inmAsignacionesPosicion, and(eq(inmAsignacionesPosicion.inmuebleId, inmInmuebles.id), eq(inmAsignacionesPosicion.activa, true)))
      .leftJoin(inmPosiciones, eq(inmPosiciones.id, inmAsignacionesPosicion.posicionId))
      .where(and(eq(inmInmuebles.estado, "activo"), eq(inmInmuebles.etapa, "visita_pendiente")))
      .orderBy(desc(inmInmuebles.fechaRegistro));

    const now = Date.now();
    return NextResponse.json({ visitas: rows.map((row) => ({
      id: row.inmuebleId, codigo: row.codigo, posicion: row.posicion ? String(row.posicion).padStart(2, "0") : "—",
      nombre: row.referencia,
      ubicacion: [row.distrito, row.provincia, row.departamento, row.direccion].filter(Boolean).join(", ") || "Sin ubicación registrada",
      tipo: row.tipo, propietario: [row.propietarioNombres, row.propietarioApellidos].filter(Boolean).join(" ") || "Sin propietario",
      dni: row.dni, dias: Math.max(0, Math.floor((now - new Date(row.fechaRegistro).getTime()) / 86400000)),
    })) });
  } catch (error) {
    console.error("Error al consultar visitas pendientes:", error);
    return NextResponse.json({ error: "No se pudieron consultar las visitas pendientes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inmuebleId = Number(body.inmuebleId);
    const fechaVisita = clean(body.fechaVisita);
    const observaciones = clean(body.observaciones);
    const driveLink = clean(body.driveLink);

    if (!Number.isInteger(inmuebleId) || inmuebleId <= 0) return NextResponse.json({ error: "Inmueble no válido." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVisita)) return NextResponse.json({ error: "La fecha de visita no es válida." }, { status: 400 });
    const fecha = new Date(fechaVisita + "T00:00:00");
    if (Number.isNaN(fecha.getTime()) || fecha.getTime() > new Date().setHours(23, 59, 59, 999)) return NextResponse.json({ error: "La fecha de visita no puede ser futura." }, { status: 400 });
    if (driveLink && !/^https?:\/\//i.test(driveLink)) return NextResponse.json({ error: "El enlace debe ser una URL HTTP o HTTPS." }, { status: 400 });

    const result = await db.transaction(async (tx) => {
      const [property] = await tx.select().from(inmInmuebles).where(eq(inmInmuebles.id, inmuebleId)).limit(1);
      if (!property) throw new Error("El inmueble no existe.");
      if (property.etapa !== "visita_pendiente") throw new Error("El inmueble ya no está pendiente de visita.");
      const [existing] = await tx.select({ id: inmVisitas.id }).from(inmVisitas)
        .where(and(eq(inmVisitas.inmuebleId, inmuebleId), eq(inmVisitas.completada, true))).limit(1);
      if (existing) throw new Error("El inmueble ya tiene una visita realizada registrada.");

      const user = await getSystemUser(tx);
      await tx.insert(inmVisitas).values({
        inmuebleId, fechaVisita, completada: true, fechaCompletada: new Date(),
        observaciones: observaciones || null, driveLink: driveLink || null, usuarioId: user.id,
      });
      await tx.update(inmInmuebles).set({ etapa: "tasacion_pendiente" }).where(eq(inmInmuebles.id, inmuebleId));
      await tx.insert(inmTimeline).values({
        inmuebleId, evento: "visita_realizada",
        observacion: observaciones || "Visita realizada y registrada. El inmueble pasa a tasación pendiente.",
        usuarioId: user.id,
      });
      return { codigo: property.codigo, etapa: "tasacion_pendiente" };
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible registrar la visita.";
    const status = /no existe|no es válido|ya no está|ya tiene/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
