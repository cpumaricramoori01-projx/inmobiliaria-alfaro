import {loadEnvFile} from 'node:process';
import {writeFile} from 'node:fs/promises';
import mysql from 'mysql2/promise';
loadEnvFile('.env.local');
const db=await mysql.createConnection(process.env.DATABASE_URL);
try {
 const data={};
 for(const table of ['inm_inmuebles','inm_propietarios','inm_asignaciones_posicion','inm_visitas','inm_tasaciones','inm_publicaciones','inm_liberaciones','inm_archivos','inm_seguimiento','inm_anuncios','inm_timeline']) {const [rows]=await db.query(`SELECT * FROM ${table}`);data[table]=rows;}
 await writeFile('/tmp/alfaro-audit-before.json',JSON.stringify(data,null,2),{mode:0o600});
 const [users]=await db.query('SELECT id,rol,activo FROM inm_usuarios');
 console.log(JSON.stringify({counts:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])),users,properties:data.inm_inmuebles.map(i=>{const owner=data.inm_propietarios.find(p=>p.id===i.propietario_id);return {...i,owner:owner?{id:owner.id,dniPresent:!!owner.dni,namesPresent:!!owner.nombres,lastnamesPresent:!!owner.apellidos,phonePresent:!!owner.telefono,emailPresent:!!owner.email}:null,positions:data.inm_asignaciones_posicion.filter(a=>a.inmueble_id===i.id),visits:data.inm_visitas.filter(v=>v.inmueble_id===i.id),prices:data.inm_tasaciones.filter(t=>t.inmueble_id===i.id),publications:data.inm_publicaciones.filter(p=>p.inmueble_id===i.id),closures:data.inm_liberaciones.filter(l=>l.inmueble_id===i.id),files:data.inm_archivos.filter(a=>a.inmueble_id===i.id).map(a=>({id:a.id,visit:a.visita_id,category:a.tipo_documento,name:a.nombre,storage:a.almacenamiento,path:a.ruta_almacenamiento,mime:a.tipo_mime,cover:a.es_portada})),followups:data.inm_seguimiento.filter(s=>s.inmueble_id===i.id),ads:data.inm_anuncios.filter(a=>a.inmueble_id===i.id)};})},null,2));
}finally{await db.end();}
