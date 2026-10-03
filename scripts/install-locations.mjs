import { loadEnvFile } from 'node:process';
import mysql from 'mysql2/promise';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL.');
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const column of ['latitud', 'longitud']) {
    const [existing] = await connection.query(`SHOW COLUMNS FROM inm_inmuebles LIKE '${column}'`);
    if (!existing.length) await connection.query(`ALTER TABLE inm_inmuebles ADD COLUMN ${column} DECIMAL(10,7) NULL`);
  }
  console.log('Campos de ubicación disponibles. Se conservaron todos los datos existentes.');
} catch (error) {
  console.error('No se pudieron instalar las ubicaciones:', error.code || 'ERROR'); process.exitCode = 1;
} finally { await connection.end(); }
