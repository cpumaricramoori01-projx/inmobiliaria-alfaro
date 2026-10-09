import {loadEnvFile} from 'node:process';import {readFile,writeFile,mkdir} from 'node:fs/promises';import mysql from 'mysql2/promise';
loadEnvFile('.env.local');const db=await mysql.createConnection(process.env.DATABASE_URL);
try{
 const [previous]=await db.query('SELECT * FROM inm_inmuebles');await mkdir('restore-points/20261006-before-geography',{recursive:true,mode:0o700});try{await writeFile('restore-points/20261006-before-geography/properties.json',JSON.stringify(previous,null,2),{mode:0o600,flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
 const sql=await readFile('db/updates/catalogo-ubicaciones.sql','utf8');for(const statement of sql.split(';').map(x=>x.trim()).filter(Boolean))await db.query(statement);
 await db.beginTransaction();await db.query('SELECT id FROM inm_ubicaciones ORDER BY id FOR UPDATE');
 async function add(nivel,nombre,padre=null){const [rows]=await db.query('SELECT id FROM inm_ubicaciones WHERE nivel=? AND nombre=? AND padre_id <=> ?',[nivel,nombre,padre]);if(rows.length)return rows[0].id;const [created]=await db.execute('INSERT INTO inm_ubicaciones(nivel,nombre,padre_id,activo) VALUES(?,?,?,1)',[nivel,nombre,padre]);return created.insertId;}
 const ancash=await add('departamento','Áncash');const santa=await add('provincia','Santa',ancash);
 for(const district of ['Chimbote','Nuevo Chimbote','Santa','Coishco','Cáceres del Perú','Macate','Moro','Nepeña','Samanco'])await add('distrito',district,santa);
 const casma=await add('provincia','Casma',ancash);await add('distrito','Casma',casma);await add('distrito','Comandante Noel',casma);
 const huarmey=await add('provincia','Huarmey',ancash);await add('distrito','Huarmey',huarmey);
 const lima=await add('departamento','Lima');const limaProv=await add('provincia','Lima',lima);await add('distrito','Lima',limaProv);
 const libertad=await add('departamento','La Libertad');const trujillo=await add('provincia','Trujillo',libertad);await add('distrito','Trujillo',trujillo);
 const [correction]=await db.execute("UPDATE inm_inmuebles SET distrito='Comandante Noel',provincia='Casma',observaciones=CONCAT(COALESCE(observaciones,''),'\nSOLO PRUEBA: localidad Tortugas normalizada a distrito Comandante Noel, provincia Casma.') WHERE codigo='BETA-006' AND datos_prueba=1 AND distrito='Tortugas'");
 if(correction.affectedRows)await db.query("INSERT INTO inm_timeline(inmueble_id,evento,observacion,usuario_id) SELECT id,'ficha_actualizada','SOLO PRUEBA: distrito Comandante Noel, provincia Casma para la localidad Tortugas; catálogo jerárquico.',1 FROM inm_inmuebles WHERE codigo='BETA-006'");
 await db.commit();const [[count]]=await db.query('SELECT COUNT(*) total FROM inm_ubicaciones');console.log('Catálogo instalado: '+count.total+' ubicaciones; relación de Tortugas corregida únicamente en el registro ficticio.');
} catch(e){await db.rollback();throw e;}finally{await db.end();}
