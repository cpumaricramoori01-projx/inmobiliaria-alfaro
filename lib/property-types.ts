import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { inmTiposInmueble } from '@/db/schema';
import { PropertyInputError } from '@/lib/property-input.mjs';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function assignedPropertyType(tx: Transaction, value: string, previous?: string) {
  // Lock by primary key, like catalog edits/deletions. Locking the unique name
  // index first can deadlock against deletion of the same catalog row.
  const [candidate] = await tx.select().from(inmTiposInmueble).where(eq(inmTiposInmueble.nombre, value)).limit(1);
  const [type] = candidate ? await tx.select().from(inmTiposInmueble).where(eq(inmTiposInmueble.id, candidate.id)).limit(1).for('update') : [];
  if (!candidate || !type || type.nombre !== candidate.nombre || (!type.activo && previous?.toLocaleLowerCase('es') !== type.nombre.toLocaleLowerCase('es'))) {
    throw new PropertyInputError('Selecciona un tipo de inmueble activo. Actualiza las opciones si cambiaron.');
  }
  return type.nombre;
}
