import {NextResponse} from 'next/server';
import {asc,eq,and,isNull} from 'drizzle-orm';
import {db} from '@/lib/db';
import {authorizeApi} from '@/lib/auth';
import {inmUbicaciones,inmInmuebles,securityAudit} from '@/db/schema';
import {lockGeography} from '@/lib/geography';
import {auditValues} from '@/lib/security-audit';
class InputError extends Error {}
class LinkedError extends Error {}
const clean=(x:unknown)=>{if(typeof x!=='string')throw new InputError('Indica un nombre.');const name=x.trim().replace(/\s+/g,' ');if(!name||name.length>100||/[\x00-\x1f]/.test(name))throw new InputError('Nombre no válido; máximo 100 caracteres.');return name;};
export async function GET(){const auth=await authorizeApi(undefined,'informacion');if(auth.response)return auth.response;try{const items=await db.select().from(inmUbicaciones).orderBy(asc(inmUbicaciones.nombre));return NextResponse.json({items},{headers:{'Cache-Control':'private, no-store'}});}catch{return NextResponse.json({error:'No se pudo consultar el catálogo.'},{status:500});}}
async function mutate(request:Request,method:string){
 const auth=await authorizeApi(request);if(auth.response)return auth.response;
 try{const body=await request.json();const result=await db.transaction(async tx=>{
 const rows=await lockGeography(tx);
 if(method==='POST'){
 const nivel=body.nivel;const parent=rows.find(x=>x.id===body.padreId);if(!['departamento','provincia','distrito'].includes(nivel))throw new InputError('Nivel no válido.');
 if(nivel!=='departamento'&&(!parent?.activo||parent.nivel!==(nivel==='provincia'?'departamento':'provincia')))throw new InputError('Selecciona el padre activo correspondiente.');
 if(nivel==='distrito'&&!rows.find(x=>x.id===parent?.padreId)?.activo)throw new InputError('El departamento está desactivado.');
 const nombre=clean(body.nombre),padreId=nivel==='departamento'?null:parent!.id;
 if(rows.some(x=>x.nivel===nivel&&x.padreId===padreId&&x.nombre.toLocaleLowerCase('es')===nombre.toLocaleLowerCase('es')))throw new LinkedError('Ya existe esa ubicación dentro del mismo padre.');
 const [created]=await tx.insert(inmUbicaciones).values({nivel,nombre,padreId,activo:true}).$returningId();await tx.insert(securityAudit).values(auditValues(auth.user.id,'ubicacion_creada',String(created.id)));return created;
 }
 if(!Number.isSafeInteger(body.id))throw new InputError('Ubicación no válida.');const item=rows.find(x=>x.id===body.id);if(!item)throw new InputError('Ubicación no encontrada.');
 const province=item.nivel==='distrito'?rows.find(x=>x.id===item.padreId):item;
 const department=item.nivel==='departamento'?item:rows.find(x=>x.id===province?.padreId);
 const match=and(eq(inmInmuebles.departamento,department?.nombre||''),item.nivel!=='departamento'?eq(inmInmuebles.provincia,province?.nombre||''):undefined,item.nivel==='distrito'?eq(inmInmuebles.distrito,item.nombre):undefined);
 if(method==='DELETE'){
 if(rows.some(x=>x.padreId===item.id))throw new LinkedError('Tiene ubicaciones vinculadas; no se puede eliminar.');const [linked]=await tx.select({id:inmInmuebles.id}).from(inmInmuebles).where(match).limit(1);if(linked)throw new LinkedError('Tiene inmuebles activos o históricos vinculados; no se puede eliminar.');await tx.delete(inmUbicaciones).where(eq(inmUbicaciones.id,item.id));
 }else{
 if(body.activo!==undefined&&typeof body.activo!=='boolean')throw new InputError('Estado no válido.');const nombre=body.nombre===undefined?item.nombre:clean(body.nombre);
 if(rows.some(x=>x.id!==item.id&&x.nivel===item.nivel&&x.padreId===item.padreId&&x.nombre.toLocaleLowerCase('es')===nombre.toLocaleLowerCase('es')))throw new LinkedError('Ya existe ese nombre dentro del mismo padre.');
 if(nombre!==item.nombre){await tx.update(inmInmuebles).set({[item.nivel]:nombre}).where(match);}
 await tx.update(inmUbicaciones).set({nombre,activo:body.activo??item.activo}).where(and(eq(inmUbicaciones.id,item.id),item.padreId===null?isNull(inmUbicaciones.padreId):eq(inmUbicaciones.padreId,item.padreId)));
 }
 await tx.insert(securityAudit).values(auditValues(auth.user.id,method==='DELETE'?'ubicacion_eliminada':'ubicacion_actualizada',String(item.id)));return {id:item.id};
 },{isolationLevel:'read committed'});return NextResponse.json({ok:true,...result},{status:method==='POST'?201:200});
 }catch(error){const e=error as {cause?:{code?:string};code?:string};return NextResponse.json({error:error instanceof InputError||error instanceof LinkedError?error.message:'No se pudo guardar la ubicación.'},{status:error instanceof InputError?400:error instanceof LinkedError||e.cause?.code==='ER_DUP_ENTRY'||e.code==='ER_DUP_ENTRY'?409:500});}
}
export const POST=(request:Request)=>mutate(request,'POST');export const PATCH=(request:Request)=>mutate(request,'PATCH');export const DELETE=(request:Request)=>mutate(request,'DELETE');
