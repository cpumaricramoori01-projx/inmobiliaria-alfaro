import { loadEnvFile } from 'node:process';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const db = await mysql.createConnection({ uri: process.env.DATABASE_URL, ...(process.env.DATABASE_SSL_CA || process.env.DATABASE_TLS_REQUIRED === '1' ? {ssl:{...(process.env.DATABASE_SSL_CA ? {ca:process.env.DATABASE_SSL_CA.replace(/\\n/g,'\n')} : {}),rejectUnauthorized:true,verifyIdentity:true}} : {}) });
try {
  const [columns] = await db.query("SHOW COLUMNS FROM inm_inmuebles LIKE 'datos_prueba'");
  if (!columns.length) await db.query('ALTER TABLE inm_inmuebles ADD COLUMN datos_prueba BOOLEAN NOT NULL DEFAULT FALSE');
  const [validated] = await db.query("SHOW COLUMNS FROM inm_inmuebles LIKE 'datos_validados'");
  if (!validated.length) await db.query('ALTER TABLE inm_inmuebles ADD COLUMN datos_validados BOOLEAN NOT NULL DEFAULT FALSE');
  for (const statement of (await readFile(new URL('../db/updates/mejoras-operativas.sql',import.meta.url),'utf8')).split(';').map(s=>s.trim()).filter(Boolean)) await db.query(statement);
  const [revision] = await db.query("SHOW COLUMNS FROM inm_anuncios LIKE 'revision_texto'");
  if(!revision.length) await db.query('ALTER TABLE inm_anuncios ADD COLUMN revision_texto BIGINT UNSIGNED NOT NULL DEFAULT 0');
  for (const [type,days] of [['visita',2],['tasacion',3],['expediente',3],['publicacion',2]]) await db.execute('INSERT IGNORE INTO inm_config_alertas (tipo,dias,activo,descripcion) VALUES (?,?,1,?)',[type,days,'Plazo de seguimiento para '+type]);
  console.log('Mejoras operativas instaladas. No se modificaron datos de inmuebles ni reglas de acceso.');
} finally { await db.end(); }
