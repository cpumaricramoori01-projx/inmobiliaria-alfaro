import { loadEnvFile } from 'node:process';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const db = await mysql.createConnection({ uri: process.env.DATABASE_URL, ...(process.env.DATABASE_SSL_CA || process.env.DATABASE_TLS_REQUIRED === '1' ? {ssl:{...(process.env.DATABASE_SSL_CA ? {ca:process.env.DATABASE_SSL_CA.replace(/\\n/g,'\n')} : {}),rejectUnauthorized:true,verifyIdentity:true}} : {}) });
try {
  await db.query(await readFile(new URL('../db/updates/propietario-opcional.sql', import.meta.url), 'utf8'));
  console.log('DNI opcional habilitado. Se conservaron los propietarios y sus vínculos.');
} finally { await db.end(); }
