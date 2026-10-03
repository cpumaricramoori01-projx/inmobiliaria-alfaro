import { loadEnvFile } from 'node:process';
import mysql from 'mysql2/promise';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL.');
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const fields = { almacenamiento: "VARCHAR(20) NOT NULL DEFAULT 'enlace'", ruta_almacenamiento: 'VARCHAR(1000) NULL', nombre_original: 'VARCHAR(255) NULL', tamano_bytes: 'BIGINT UNSIGNED NULL', tipo_mime: 'VARCHAR(150) NULL' };
  for (const [name, definition] of Object.entries(fields)) {
    const [columns] = await connection.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inm_archivos' AND COLUMN_NAME = ?", [name]);
    if (!columns.length) await connection.query(`ALTER TABLE inm_archivos ADD COLUMN ${name} ${definition}`);
  }
  console.log('Campos de documentación instalados. Enlaces existentes conservados.');
} catch (error) { console.error('No se pudo instalar documentación:', error.code || 'ERROR'); process.exitCode = 1; }
finally { await connection.end(); }
