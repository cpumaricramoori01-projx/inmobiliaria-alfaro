// Read-only exact row fingerprint; private baseline stays outside the repository.
import { loadEnvFile } from 'node:process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
loadEnvFile('.env.local');
const db = await mysql.createConnection(process.env.DATABASE_URL);
const path = process.env.AUDIT_BASELINE || '/tmp/alfaro-db-audit-baseline.json';
try {
  await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
  const [tables] = await db.query('SHOW TABLES');
  const state = {};
  for (const table of tables.map(row => Object.values(row)[0]).sort()) {
    const [rows] = await db.query('SELECT * FROM ??', [table]);
    const serialized = rows.map(row => JSON.stringify(row)).sort();
    state[table] = { count: rows.length, sha256: createHash('sha256').update(JSON.stringify(serialized)).digest('hex') };
  }
  await db.commit();
  if (process.argv.includes('--inventory')) {
    const [properties] = await db.query(`SELECT i.id,i.codigo,i.referencia,i.operacion,i.estado,i.etapa,i.datos_prueba,p.numero posicion
      FROM inm_inmuebles i LEFT JOIN inm_asignaciones_posicion a ON a.inmueble_id=i.id AND a.activa=1
      LEFT JOIN inm_posiciones p ON p.id=a.posicion_id ORDER BY p.numero IS NULL,p.numero,i.id`);
    const cell = value => String(value ?? '—').replaceAll('|', '\\|').replace(/[\r\n]/g, ' ');
    const lines = ['# Base de datos actual — auditoría del 7 de octubre de 2026', '',
      'Vista de solo lectura al terminar las simulaciones. No contiene contraseñas, sesiones ni datos personales de propietarios.', '',
      '| Tabla | Registros |', '| --- | ---: |', ...Object.entries(state).map(([t,v]) => `| ${t} | ${v.count} |`), '',
      '| ID | Código | Referencia | Posición | Operación | Estado | Etapa | Indicador de prueba |', '| ---: | --- | --- | ---: | --- | --- | --- | --- |',
      ...properties.map(row => `| ${[row.id,row.codigo,row.referencia,row.posicion,row.operacion,row.estado,row.etapa,row.datos_prueba].map(cell).join(' | ')} |`), ''];
    await writeFile('output/bd-actual-2026-10-07.md', lines.join('\n'), { mode: 0o600 });
  }
  if (process.argv.includes('--baseline')) {
    await writeFile(path, JSON.stringify(state, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ baseline: path, counts: Object.fromEntries(Object.entries(state).map(([t,v]) => [t,v.count])) }, null, 2));
  } else {
    const before = JSON.parse(await readFile(path, 'utf8'));
    const changed = [...new Set([...Object.keys(before), ...Object.keys(state)])].filter(t => JSON.stringify(before[t]) !== JSON.stringify(state[t]));
    console.log(JSON.stringify({ identical: changed.length === 0, changed, counts: Object.fromEntries(Object.entries(state).map(([t,v]) => [t,v.count])) }, null, 2));
    if (changed.length) process.exitCode = 1;
  }
} finally { await db.end(); }
