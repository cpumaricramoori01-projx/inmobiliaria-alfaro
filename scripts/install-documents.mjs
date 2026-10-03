import { loadEnvFile } from 'node:process';
import mysql from 'mysql2/promise';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL.');
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const fields = { visita_id: 'BIGINT UNSIGNED NULL', es_portada: 'BOOLEAN NOT NULL DEFAULT FALSE', almacenamiento: "VARCHAR(20) NOT NULL DEFAULT 'enlace'", ruta_almacenamiento: 'VARCHAR(1000) NULL', nombre_original: 'VARCHAR(255) NULL', tamano_bytes: 'BIGINT UNSIGNED NULL', tipo_mime: 'VARCHAR(150) NULL' };
  for (const [name, definition] of Object.entries(fields)) {
    const [columns] = await connection.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inm_archivos' AND COLUMN_NAME = ?", [name]);
    if (!columns.length) await connection.query(`ALTER TABLE inm_archivos ADD COLUMN ${name} ${definition}`);
  }
  const [constraints] = await connection.execute("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inm_archivos' AND COLUMN_NAME = 'visita_id' AND REFERENCED_TABLE_NAME = 'inm_visitas'");
  if (!constraints.length) await connection.query('ALTER TABLE inm_archivos ADD CONSTRAINT inm_archivos_visita_id_inm_visitas_id_fk FOREIGN KEY (visita_id) REFERENCES inm_visitas(id)');
  console.log('Campos de documentación instalados. Enlaces existentes conservados.');
} catch (error) { console.error('No se pudo instalar documentación:', error.code || 'ERROR'); process.exitCode = 1; }
finally { await connection.end(); }
