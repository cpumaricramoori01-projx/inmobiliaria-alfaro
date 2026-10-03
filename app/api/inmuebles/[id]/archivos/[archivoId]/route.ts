import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { hostingRequest } from '@/lib/document-hosting';
import { get } from '@vercel/blob';
import { authorizeApi } from '@/lib/auth';
import { db } from '@/lib/db';
import { inmArchivos, inmInmuebles } from '@/db/schema';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string; archivoId: string }> }) {
  try {
    const auth = await authorizeApi(undefined, 'informacion');
    if (auth.response) return auth.response;
    const { id, archivoId } = await context.params;
    const fileId = Number(archivoId);
    if (!Number.isSafeInteger(fileId) || fileId < 1) return NextResponse.json({ error: 'Documento no válido.' }, { status: 400 });
    const [row] = await db.select({ file: inmArchivos }).from(inmArchivos).innerJoin(inmInmuebles, eq(inmInmuebles.id, inmArchivos.inmuebleId)).where(and(eq(inmArchivos.id, fileId), /^\d+$/.test(id) ? eq(inmInmuebles.id, Number(id)) : eq(inmInmuebles.codigo, id))).limit(1);
    if (!row || !['vercel_blob', 'hosting'].includes(row.file.almacenamiento) || !row.file.rutaAlmacenamiento) return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
    const hosted = row.file.almacenamiento === 'hosting' ? await hostingRequest('GET', row.file.rutaAlmacenamiento) : null;
    const result = hosted ? { statusCode: 200, stream: hosted.body } : await get(row.file.rutaAlmacenamiento, { access: 'private' });
    if (result?.statusCode !== 200) return NextResponse.json({ error: 'Archivo no disponible.' }, { status: 404 });
    const filename = (row.file.nombreOriginal || row.file.nombre).replace(/[\r\n]/g, '');
    const encoded = encodeURIComponent(filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    const disposition = new URL(request.url).searchParams.get('download') === '1' || row.file.tipoMime !== 'application/pdf' ? 'attachment' : 'inline';
    return new NextResponse(result.stream, { headers: {
      'Content-Type': row.file.tipoMime || 'application/octet-stream',
      'Content-Disposition': `${disposition}; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch { return NextResponse.json({ error: 'No se pudo abrir el documento.' }, { status: 500 }); }
}
