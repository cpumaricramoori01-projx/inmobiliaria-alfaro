import { sql } from 'drizzle-orm';
import { inmInmuebles } from '@/db/schema';

// Explicit evidence only; names and ordinary notes never classify real properties.
export const isDemoProperty = sql<number>`(${inmInmuebles.datosPrueba} = 1 OR (${inmInmuebles.datosValidados}=0 AND (EXISTS (SELECT 1 FROM inm_propietarios dp WHERE dp.id = ${inmInmuebles.propietarioId} AND dp.dni = '00000000') OR EXISTS (SELECT 1 FROM inm_archivos da WHERE da.inmueble_id = ${inmInmuebles.id} AND (da.nombre LIKE '%SOLO PRUEBA%' OR da.observacion LIKE '%SOLO PRUEBA%')) OR EXISTS (SELECT 1 FROM inm_timeline dt WHERE dt.inmueble_id = ${inmInmuebles.id} AND dt.evento IN ('precios_iniciales_simulados','foto_ejemplo_agregada','propietario_ficticio_vinculado')))))`;
