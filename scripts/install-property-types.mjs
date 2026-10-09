import { loadEnvFile } from 'node:process';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, ...(process.env.DATABASE_SSL_CA || process.env.DATABASE_TLS_REQUIRED === '1' ? { ssl: { ...(process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, '\n') } : {}), rejectUnauthorized: true, verifyIdentity: true } } : {}) });
try {
  const sql = await readFile(new URL('../db/updates/tipos-inmueble.sql', import.meta.url), 'utf8');
  for (const statement of sql.split(';').map(value => value.trim()).filter(Boolean)) await connection.query(statement);
  console.log('Catálogo de tipos instalado; inmuebles existentes conservados.');
} finally { await connection.end(); }
