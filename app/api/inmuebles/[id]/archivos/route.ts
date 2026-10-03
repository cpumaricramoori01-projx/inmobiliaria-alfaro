import { authorizeApi } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { hostingRequest } from '@/lib/document-hosting';
import { db } from '@/lib/db';
import { inmArchivos, inmInmuebles, inmAsignacionesPosicion, inmPosiciones } from '@/db/schema';
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, documentPath, storageConfigured, storeDocument, validateDocument } from '@/lib/document-files.mjs';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function findInmueble(key: string) {
  const [row] = await db.select({ id: inmInmuebles.id, codigo: inmInmuebles.codigo }).from(inmInmuebles)
    .where(/^\d+$/.test(key) ? eq(inmInmuebles.id, Number(key)) : eq(inmInmuebles.codigo, key)).limit(1);
  return row;
}
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeApi(undefined, 'informacion');
    if (auth.response) return auth.response;
    const inmueble = await findInmueble((await context.params).id);
    if (!inmueble) return NextResponse.json({ error: 'Inmueble no encontrado.' }, { status: 404 });
    const rows = await db.select().from(inmArchivos).where(eq(inmArchivos.inmuebleId, inmueble.id)).orderBy(asc(inmArchivos.tipoDocumento), asc(inmArchivos.fechaRegistro));
    const archivos = rows.map(row => ({ ...row, enlace: row.almacenamiento === 'hosting' ? `/api/inmuebles/${inmueble.id}/archivos/${row.id}` : row.enlace, rutaAlmacenamiento: undefined }));
    return NextResponse.json({ archivos, subidaHabilitada: storageConfigured() }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'No se pudieron consultar los archivos.' }, { status: 500 }); }
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeApi(request, 'informacion');
    if (auth.response) return auth.response;
    const inmueble = await findInmueble((await context.params).id);
    if (!inmueble) return NextResponse.json({ error: 'Inmueble no encontrado.' }, { status: 404 });
    if (!auth.user) return NextResponse.json({ error: 'Usuario no disponible.' }, { status: 401 });
    const usuarioId = auth.user.id;
    const multipart = request.headers.get('content-type')?.startsWith('multipart/form-data');
    if (Number(request.headers.get('content-length')) > MAX_DOCUMENT_BYTES + 65536) return NextResponse.json({ error: 'El archivo debe pesar como máximo 4 MB.' }, { status: 413 });
    let body: Record<string, unknown>;
    let file: File | null = null;
    try {
      if (multipart) {
        const form = await request.formData();
        body = Object.fromEntries(form.entries());
        const selected = form.get('archivo');
        if (selected instanceof File) file = selected;
      } else body = await request.json();
    } catch { return NextResponse.json({ error: 'Solicitud de documento no válida.' }, { status: 400 }); }
    const tipoDocumento = String(body.tipoDocumento ?? '').trim(), nombre = String(body.nombre ?? '').trim(), observacion = String(body.observacion ?? '').trim();
    if (!DOCUMENT_TYPES.has(tipoDocumento) || !nombre || nombre.length > 255 || observacion.length > 500) return NextResponse.json({ error: 'Revisa el tipo, nombre (máximo 255 caracteres) y observación (máximo 500).' }, { status: 400 });
    // Compatibility for previously registered external links and existing API clients.
    if (!multipart) {
      const enlace = String(body.enlace ?? '').trim();
      if (!/^https?:\/\//i.test(enlace) || enlace.length > 1000) return NextResponse.json({ error: 'Enlace no válido.' }, { status: 400 });
      const [created] = await db.insert(inmArchivos).values({ inmuebleId: inmueble.id, tipoDocumento, nombre, enlace, observacion: observacion || null, usuarioId }).$returningId();
      return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
    }
    if (!file) return NextResponse.json({ error: 'Selecciona un archivo.' }, { status: 400 });
    if (file.size > MAX_DOCUMENT_BYTES) return NextResponse.json({ error: 'El archivo debe pesar como máximo 4 MB.' }, { status: 413 });
    if (file.name.length > 255) return NextResponse.json({ error: 'El nombre del archivo es demasiado largo.' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    let contentType: string;
    try { contentType = validateDocument(file.name, bytes).contentType; }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Archivo no válido.' }, { status: 400 }); }
    if (!storageConfigured()) return NextResponse.json({ error: 'Falta configurar el almacenamiento de documentos.' }, { status: 503 });
    const [position] = await db.select({ numero: inmPosiciones.numero }).from(inmAsignacionesPosicion).innerJoin(inmPosiciones, eq(inmPosiciones.id, inmAsignacionesPosicion.posicionId)).where(and(eq(inmAsignacionesPosicion.inmuebleId, inmueble.id), eq(inmAsignacionesPosicion.activa, true))).limit(1);
    const pathname = documentPath({ position: position?.numero ?? null, propertyId: inmueble.id, propertyCode: inmueble.codigo, type: tipoDocumento, name: file.name, uniqueId: randomUUID() });
    const originalName = file.name;
    const created = await storeDocument({ pathname, bytes,
      upload: async (path: string, data: Uint8Array) => { await hostingRequest('PUT', path, data); },
      remove: async (path: string) => { await hostingRequest('DELETE', path); },
      register: async (stored: { pathname: string }) => {
      const [row] = await db.insert(inmArchivos).values({ inmuebleId: inmueble.id, tipoDocumento, nombre, enlace: stored.pathname, almacenamiento: 'hosting', rutaAlmacenamiento: stored.pathname, nombreOriginal: originalName, tamanoBytes: bytes.length, tipoMime: contentType, observacion: observacion || null, usuarioId }).$returningId();
      return row;
    } });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch { return NextResponse.json({ error: 'No se pudo guardar el documento. Comprueba la configuración del almacenamiento de documentos.' }, { status: 500 }); }
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeApi(request, 'informacion');
    if (auth.response) return auth.response;
    const inmueble = await findInmueble((await context.params).id);
    if (!inmueble) return NextResponse.json({ error: 'Inmueble no encontrado.' }, { status: 404 });
    const fileId = Number(new URL(request.url).searchParams.get('archivoId'));
    if (!Number.isSafeInteger(fileId) || fileId < 1) return NextResponse.json({ error: 'Archivo no válido.' }, { status: 400 });
    const condition = and(eq(inmArchivos.id, fileId), eq(inmArchivos.inmuebleId, inmueble.id));
    const [file] = await db.select().from(inmArchivos).where(condition).limit(1);
    if (!file) return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
    if (file.almacenamiento === 'hosting') {
      if (!file.rutaAlmacenamiento) throw new Error('Ruta no disponible.');
      await hostingRequest('DELETE', file.rutaAlmacenamiento);
    }
    await db.delete(inmArchivos).where(condition);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'No se pudo eliminar el documento. Puedes intentarlo de nuevo.' }, { status: 500 }); }
}
