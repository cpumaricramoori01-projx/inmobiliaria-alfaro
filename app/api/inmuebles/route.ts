import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  inmAsignacionesPosicion,
  inmInmuebles,
  inmPosiciones,
  inmPropietarios,
  inmTimeline,
  inmUsuarios,
} from "@/db/schema";

const TIPOS = new Set(["Casa", "Departamento", "Terreno", "Local", "Oficina", "Otros"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const posicion = Number(body.posicion);
    const tipo = clean(body.tipo);
    const referencia = clean(body.referencia);
    const dni = clean(body.dni);
    const nombres = clean(body.nombres);
    const apellidos = clean(body.apellidos);
    const telefono = clean(body.telefono);
    const direccion = clean(body.ubicacion);

    if (!Number.isInteger(posicion) || posicion < 1 || posicion > 90) {
      return NextResponse.json({ error: "La posición debe estar entre 01 y 90." }, { status: 400 });
    }

    if (!TIPOS.has(tipo)) {
      return NextResponse.json({ error: "Tipo de inmueble no válido." }, { status: 400 });
    }

    if (!referencia || !/^\d{8}$/.test(dni) || !nombres || !apellidos) {
      return NextResponse.json({ error: "Completa posición, tipo, referencia, DNI, nombres y apellidos." }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const [position] = await tx.execute(
        sql`SELECT id, activo FROM inm_posiciones WHERE numero = ${posicion} LIMIT 1 FOR UPDATE`
      ) as unknown as [{ id: number; activo: number } | undefined];

      if (!position || !position.activo) {
        throw new Error("La posición seleccionada no existe o está deshabilitada.");
      }

      const [activeAssignment] = await tx.execute(
        sql`SELECT id FROM inm_asignaciones_posicion WHERE posicion_id = ${position.id} AND activa = 1 LIMIT 1`
      ) as unknown as [{ id: number } | undefined];

      if (activeAssignment) {
        throw new Error("La posición seleccionada acaba de ser ocupada. Actualiza la pantalla y elige otra.");
      }

      let [owner] = await tx
        .select()
        .from(inmPropietarios)
        .where(eq(inmPropietarios.dni, dni))
        .limit(1);

      if (owner) {
        await tx
          .update(inmPropietarios)
          .set({ nombres, apellidos, telefono: telefono || null })
          .where(eq(inmPropietarios.id, owner.id));
      } else {
        const [createdOwner] = await tx
          .insert(inmPropietarios)
          .values({ dni, nombres, apellidos, telefono: telefono || null })
          .$returningId();

        [owner] = await tx
          .select()
          .from(inmPropietarios)
          .where(eq(inmPropietarios.id, createdOwner.id))
          .limit(1);
      }

      if (!owner) throw new Error("No fue posible obtener el propietario.");

      const codigo = `INM-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

      const [createdProperty] = await tx
        .insert(inmInmuebles)
        .values({
          codigo,
          propietarioId: owner.id,
          tipo,
          referencia,
          direccion: direccion || null,
          estado: "activo",
          etapa: "visita_pendiente",
        })
        .$returningId();

      await tx.insert(inmAsignacionesPosicion).values({
        inmuebleId: createdProperty.id,
        posicionId: position.id,
        activa: true,
      });

      const systemEmail = "sistema@inmobiliaria-alfaro.local";
      let [user] = await tx
        .select()
        .from(inmUsuarios)
        .where(eq(inmUsuarios.email, systemEmail))
        .limit(1);

      if (!user) {
        const [createdUser] = await tx
          .insert(inmUsuarios)
          .values({
            nombre: "Usuario actual",
            email: systemEmail,
            rol: "usuario",
            activo: true,
          })
          .$returningId();

        [user] = await tx
          .select()
          .from(inmUsuarios)
          .where(eq(inmUsuarios.id, createdUser.id))
          .limit(1);
      }

      if (!user) throw new Error("No fue posible registrar el usuario de trazabilidad.");

      await tx.insert(inmTimeline).values({
        inmuebleId: createdProperty.id,
        evento: "inmueble_registrado",
        observacion: `Inmueble registrado en la posición ${String(posicion).padStart(2, "0")} y enviado a visita pendiente.`,
        usuarioId: user.id,
      });

      return {
        inmuebleId: createdProperty.id,
        codigo,
        posicion,
        etapa: "visita_pendiente",
      };
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible registrar el inmueble.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
