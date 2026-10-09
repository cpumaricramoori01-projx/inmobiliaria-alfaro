import { loadEnvFile } from 'node:process';
import mysql from 'mysql2/promise';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const [name, definition] of [['fecha_venta','DATE NULL'],['precio_final','DECIMAL(15,2) NULL'],['comision','DECIMAL(15,2) NULL'],['datos_simulados','BOOLEAN NOT NULL DEFAULT FALSE']]) {
    const [columns] = await connection.query('SHOW COLUMNS FROM inm_liberaciones LIKE ?', [name]);
    if (!columns.length) await connection.query(`ALTER TABLE inm_liberaciones ADD COLUMN ${name} ${definition}`);
  }
  console.log('Campos de cierre económico instalados. Se conservaron los registros existentes sin inventar ventas ni acuerdos.');
} finally { await connection.end(); }
