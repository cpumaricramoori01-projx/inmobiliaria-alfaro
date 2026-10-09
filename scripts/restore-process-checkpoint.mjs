// Read-only by default. Destructive restoration requires both explicit flags.
import {loadEnvFile} from 'node:process';
import {readFile} from 'node:fs/promises';
import mysql from 'mysql2/promise';
const checkpoint='20261006-before-process-improvements';
const data=JSON.parse(await readFile(`restore-points/${checkpoint}/database.json`,'utf8'));
console.log(`Punto ${checkpoint}: ${Object.keys(data.tables).length} tablas, ${Object.values(data.tables).reduce((sum,t)=>sum+t.rows.length,0)} filas.`);
if(!process.argv.includes('--apply')){console.log('Vista previa. No se ha modificado la base. Para restaurar se requieren --apply --confirm y el nombre exacto del punto.');process.exit(0);}
if(process.argv[process.argv.indexOf('--confirm')+1]!==checkpoint)throw new Error('Confirmación de punto incorrecta.');
loadEnvFile('.env.local');
const db=await mysql.createConnection(process.env.DATABASE_URL);
try{
 await db.query('SET FOREIGN_KEY_CHECKS=0');
 for(const [table,value] of Object.entries(data.tables)){
  await db.query('DROP TABLE IF EXISTS ??',[table]);await db.query(value.ddl);
  for(const row of value.rows){const columns=Object.keys(row);const values=columns.map(key=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(String(row[key]))?new Date(row[key]):row[key]);await db.query('INSERT INTO ?? (??) VALUES ('+columns.map(()=>'?').join(',')+')',[table,columns,...values]);}
 }
 await db.query('SET FOREIGN_KEY_CHECKS=1');console.log('Base restaurada. Recupera source.tar.gz y recompila el código anterior antes de iniciar la aplicación.');
}finally{await db.end();}
