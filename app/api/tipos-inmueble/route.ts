import { NextResponse } from 'next/server';
import { asc, eq, sql } from 'drizzle-orm';
import { authorizeApi } from '@/lib/auth';
import { db } from '@/lib/db';
import { inmInmuebles, inmTiposInmueble, securityAudit } from '@/db/schema';
import { auditValues } from '@/lib/security-audit';

class TypeInputError extends Error {}
function name(value: unknown) {
  if (typeof value !== 'string') throw new TypeInputError('Indica el nombre del tipo.');
  const result = value.trim().replace(/\s+/g, ' ');
  if (!result || result.length > 30 || /[\x00-\x1f\x7f]/.test(result)) throw new TypeInputError('Usa un nombre de entre 1 y 30 caracteres.');
  return result;
}
function failure(error: unknown) {
  if (error instanceof TypeInputError) return NextResponse.json({ error: error.message }, { status: 400 });
  const cause = error as { code?: string; cause?: { code?: string } };
  if (cause.code === 'ER_DUP_ENTRY' || cause.cause?.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe un tipo con ese nombre.' }, { status: 409 });
  return NextResponse.json({ error: 'No se pudo guardar el tipo de inmueble.' }, { status: 500 });
}
export async function GET() {
  const auth = await authorizeApi(undefined, 'informacion');
  if (auth.response) return auth.response;
  try {
    const tipos = await db.select({ id: inmTiposInmueble.id, nombre: inmTiposInmueble.nombre, activo: inmTiposInmueble.activo,
      inmuebles: sql<number>`(SELECT COUNT(*) FROM inm_inmuebles i WHERE i.tipo=${inmTiposInmueble.nombre})`,
    }).from(inmTiposInmueble).orderBy(asc(inmTiposInmueble.nombre));
    return NextResponse.json({ tipos }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'No se pudieron cargar los tipos de inmueble.' }, { status: 500 }); }
}
export async function POST(request: Request) {
  const auth = await authorizeApi(request);
  if (auth.response) return auth.response;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 }); }
  try {
    const nombre = name(body?.nombre);
    const id = await db.transaction(async tx => {
      const [created] = await tx.insert(inmTiposInmueble).values({ nombre }).$returningId();
      await tx.insert(securityAudit).values(auditValues(auth.user.id, 'property_type.create', `property_type:${created.id}`));
      return created.id;
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  const auth = await authorizeApi(request);
  if (auth.response) return auth.response;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 }); }
  try {
    if (!Number.isSafeInteger(body?.id) || body.id < 1 || (body.activo !== undefined && typeof body.activo !== 'boolean')) throw new TypeInputError('Datos del tipo no válidos.');
    const nombre = body.nombre === undefined ? undefined : name(body.nombre);
    if (nombre === undefined && body.activo === undefined) throw new TypeInputError('Indica el cambio que deseas guardar.');
    await db.transaction(async tx => {
      const [current] = await tx.select().from(inmTiposInmueble).where(eq(inmTiposInmueble.id, body.id)).limit(1).for('update');
      if (!current) throw new TypeInputError('Tipo de inmueble no encontrado.');
      await tx.update(inmTiposInmueble).set({ nombre: nombre ?? current.nombre, activo: body.activo ?? current.activo }).where(eq(inmTiposInmueble.id, current.id));
      if (nombre !== undefined && nombre !== current.nombre) await tx.update(inmInmuebles).set({ tipo: nombre }).where(eq(inmInmuebles.tipo, current.nombre));
      await tx.insert(securityAudit).values(auditValues(auth.user.id, 'property_type.update', `property_type:${current.id}`));
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request) {
  const auth = await authorizeApi(request);
  if (auth.response) return auth.response;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 }); }
  if (!Number.isSafeInteger(body?.id) || body.id < 1) return NextResponse.json({ error: 'Tipo de inmueble no válido.' }, { status: 400 });
  try {
    const result = await db.transaction(async tx => {
      // Assignments and renames lock this same catalog row before changing a type.
      const [type] = await tx.select().from(inmTiposInmueble).where(eq(inmTiposInmueble.id, body.id)).limit(1).for('update');
      if (!type) return 'missing';
      const [property] = await tx.select({ id: inmInmuebles.id }).from(inmInmuebles)
        .where(eq(inmInmuebles.tipo, type.nombre)).limit(1);
      if (property) return 'linked';
      await tx.delete(inmTiposInmueble).where(eq(inmTiposInmueble.id, type.id));
      await tx.insert(securityAudit).values(auditValues(auth.user.id, 'property_type.delete', `property_type:${type.id}`));
      return 'deleted';
    }, { isolationLevel: 'read committed' });
    if (result === 'missing') return NextResponse.json({ error: 'Tipo de inmueble no encontrado.' }, { status: 404 });
    if (result === 'linked') return NextResponse.json({ error: 'No se puede eliminar: tiene inmuebles vinculados, activos o históricos. Puedes desactivarlo.' }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'No se pudo eliminar el tipo de inmueble.' }, { status: 500 }); }
}
