import {asc} from 'drizzle-orm';
import {db} from '@/lib/db';
import {inmUbicaciones} from '@/db/schema';
import {PropertyInputError} from '@/lib/property-input.mjs';
type Tx=Parameters<Parameters<typeof db.transaction>[0]>[0];
export const lockGeography=(tx:Tx)=>tx.select().from(inmUbicaciones).orderBy(asc(inmUbicaciones.id)).for('update');
export type Place={departamento?:string|null;provincia?:string|null;distrito?:string|null};
export async function validateGeography(tx:Tx,place:Place,previous?:Place){
 const names=[place.departamento,place.provincia,place.distrito].map(x=>x?.trim()||'');
 if(names.every(x=>!x))return {departamento:null,provincia:null,distrito:null};
 if(names.some(x=>!x))throw new PropertyInputError('Selecciona departamento, provincia y distrito completos.');
 const rows=await tx.select().from(inmUbicaciones);
 const same=!!previous&&[previous.departamento,previous.provincia,previous.distrito].every((x,i)=>x===names[i]);
 const department=rows.find(x=>x.nivel==='departamento'&&x.nombre.toLocaleLowerCase('es')===names[0].toLocaleLowerCase('es')&&!x.padreId);
 const province=rows.find(x=>x.nivel==='provincia'&&x.padreId===department?.id&&x.nombre.toLocaleLowerCase('es')===names[1].toLocaleLowerCase('es'));
 const district=rows.find(x=>x.nivel==='distrito'&&x.padreId===province?.id&&x.nombre.toLocaleLowerCase('es')===names[2].toLocaleLowerCase('es'));
 if(!department||!province||!district||!same&&(!department.activo||!province.activo||!district.activo))throw new PropertyInputError('La ubicación no corresponde a una relación activa del catálogo.');
 return {departamento:department.nombre,provincia:province.nombre,distrito:district.nombre};
}
