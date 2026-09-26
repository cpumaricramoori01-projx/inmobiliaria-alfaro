import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inmArchivos, inmInmuebles } from "@/db/schema";

const TIPOS = new Set([
  "DNI_PROPIETARIO",
  "DOCUMENTO_PROPIEDAD",
  "COPIA_LITERAL",
  "CONTRATO",
  "TASACION",
  "TEXTO_PUBLICACION",
  "FOTO_INMUEBLE",
  "VIDEO_INMUEBLE",
  "PLANO",
  "RECIBO_SERVICIO",
  "OTRO",
]);

async function findInmueble(key: string) {
  const [row] = await db.select({ id: inmInmuebles.id }).from(inmInmuebles)
    .where(key.match(/^\d+$/) ? eq(inmInmuebles.id, Number(key)) : eq(inmInmuebles.codigo, key)).limit(1);
  return row;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const key = (await context.params).id;
    const inmueble = await findInmueble(key);
    if (!inmueble) return NextResponse.json({ error: "Inmueble no encontrado." }, { status: 404 });

    const archivos = await db.select().from(inmArchivos)
      .where(eq(inmArchivos.inmuebleId, inmueble.id))
      .orderBy(asc(inmArchivos.tipoDocumento), asc(inmArchivos.fechaRegistro));

    return NextResponse.json({ archivos });
  } catch {
    return NextResponse.json({ error: "No se pudieron consultar los archivos." }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const key = (await context.params).id;
    const inmueble = await findInmueble(key);
    if (!inmueble) return NextResponse.json({ error: "Inmueble no encontrado." }, { status: 404 });

    const body = await request.json();
    const tipoDocumento = String(body.tipoDocumento ?? "").trim();
    const nombre = String(body.nombre ?? "").trim();
    const enlace = String(body.enlace ?? "").trim();
    const observacion = String(body.observacion ?? "").trim();

    if (!TIPOS.has(tipoDocumento)) return NextResponse.json({ error: "Tipo de documento no válido." }, { status: 400 });
    if (!nombre || !enlace) return NextResponse.json({ error: "El nombre y el enlace de Drive son obligatorios." }, { status: 400 });
    if (!/^https?:\/\//i.test(enlace)) return NextResponse.json({ error: "El enlace debe comenzar con http:// o https://." }, { status: 400 });

    const [usuario] = await db.select({ id: 1 }).from({ get name(){ return inmArchivos; } } as never);
    void usuario;

    const systemUser = await db.query.inmUsuarios?.findFirst?.();
    void systemUser;

    return NextResponse.json({ error: "La ruta de archivos requiere un usuario de trazabilidad." }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el archivo." }, { status: 500 });
  }
}
