// Creates isolated temporary records and removes them in finally.
import { todayInPeru } from "../lib/calendar.mjs";
import assert from "node:assert/strict";
import { loadEnvFile } from "node:process";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import { createSessionToken, hashSessionToken } from "../lib/password.mjs";

loadEnvFile(".env.local");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const base = "http://127.0.0.1:3111";
let userId, inmuebleId, positionId, server;
const token = createSessionToken();
const cookie = `aa_session=${token}`;
const request = (path, method = "GET", body, origin = base, authenticated = true) => fetch(base + path, {
  method, headers: { Origin: origin, "Content-Type": "application/json", ...(authenticated ? { Cookie: cookie } : {}) },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}), redirect: "manual",
});
async function expect(path, method, body, status) {
  const response = await request(path, method, body);
  const data = await response.json();
  assert.equal(response.status, status, `${method} ${path}: ${data.error ?? response.status}`);
  return data;
}
let output = "";
try {
  const suffix = randomBytes(6).toString("hex");
  const [user] = await connection.execute("INSERT INTO inm_usuarios (nombre, email, usuario, rol, activo) VALUES (?, ?, ?, 'administrador', 1)", ["Prueba precios", `prices_${suffix}@example.invalid`, `prices_${suffix}`]);
  userId = user.insertId;
  await connection.execute("INSERT INTO inm_sesiones (token_hash, usuario_id, expira) VALUES (?, ?, ?)", [hashSessionToken(token), userId, new Date(Date.now() + 3600000)]);
  const [property] = await connection.execute("INSERT INTO inm_inmuebles (codigo, tipo, referencia, estado, etapa) VALUES (?, 'casa', 'Prueba temporal precios', 'activo', 'visita_pendiente')", [`TEST-PRICE-${suffix}`]);
  inmuebleId = property.insertId;
  const [positions] = await connection.execute('SELECT id,numero FROM inm_posiciones WHERE numero >= 201 OR id >= 201');
  positionId = Array.from({length: 50}, (_, i) => i + 201).find(n => !positions.some(p => p.numero === n || p.id === n));
  assert.ok(positionId);
  await connection.execute('INSERT INTO inm_posiciones (id,numero,activo) VALUES (?,?,1)', [positionId,positionId]);
  await connection.execute('INSERT INTO inm_asignaciones_posicion (inmueble_id,posicion_id,activa) VALUES (?,?,1)', [inmuebleId,positionId]);
  await connection.execute('INSERT INTO inm_visitas (inmueble_id,completada,fecha_visita,usuario_id) VALUES (?,1,?,?)', [inmuebleId,todayInPeru(),userId]);
  await connection.execute("INSERT INTO inm_archivos (inmueble_id,tipo_documento,nombre,enlace,almacenamiento,tipo_mime,usuario_id) VALUES (?,'FOTO_INMUEBLE','Temporal prueba precios','fixture','hosting','image/webp',?)", [inmuebleId,userId]);

  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3111", "-H", "127.0.0.1"], { env: { ...process.env, NODE_ENV: "production" }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", chunk => { output += chunk; });
  server.stderr.on("data", chunk => { output += chunk; });
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error("No pudo iniciar el servidor de prueba.");
    try { if ((await request("/login", "GET", undefined, base, false)).status === 200) { ready = true; break; } } catch { /* Starting. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.equal(ready, true);
  const prices = { inmuebleId, fechaTasacion: todayInPeru(), valorReferencia: "500000", precioObjetivo: "450000", precioVenta: "470000", observacion: "Precio acordado" };
  await expect("/api/tasaciones", "POST", { ...prices, precioVenta: "" }, 400);
  await expect("/api/tasaciones", "POST", prices, 201);
  await expect("/api/tasaciones", "POST", prices, 409);
  const pending = await expect("/api/publicaciones", "GET", undefined, 200);
  assert.equal(pending.pendientes.find(row => row.inmuebleId === inmuebleId).precioVenta, "470000.00");
  console.log("PASS: tres precios obligatorios y tasación negociada disponible para preparar texto");

  await expect("/api/tasaciones", "PATCH", { inmuebleId, precioVenta: "460000", observacion: "Ajuste antes de publicar" }, 200);
  await expect("/api/publicaciones", "POST", { inmuebleId, texto: "Texto de prueba" }, 201);
  await expect("/api/publicaciones", "PUT", { inmuebleId }, 200);
  const [[beforeProperty]] = await connection.execute("SELECT * FROM inm_inmuebles WHERE id = ?", [inmuebleId]);
  const [[beforePublication]] = await connection.execute("SELECT * FROM inm_publicaciones WHERE inmueble_id = ?", [inmuebleId]);
  assert.equal((await request("/api/tasaciones", "PATCH", { inmuebleId, precioVenta: "430000" }, "https://evil.example")).status, 403);
  assert.equal((await request("/api/tasaciones", "PATCH", { inmuebleId, precioVenta: "430000" }, base, false)).status, 401);
  for (const precioVenta of ["-1", "0", "1.234", "10000000000000", "abc"]) await expect("/api/tasaciones", "PATCH", { inmuebleId, precioVenta }, 400);
  await expect("/api/tasaciones", "PATCH", { inmuebleId, precioVenta: "430000", observacion: "Propietario baja el precio" }, 200);
  await expect("/api/tasaciones", "PATCH", { inmuebleId, precioVenta: "425000" }, 200);
  const [[afterProperty]] = await connection.execute("SELECT * FROM inm_inmuebles WHERE id = ?", [inmuebleId]);
  const [[afterPublication]] = await connection.execute("SELECT * FROM inm_publicaciones WHERE inmueble_id = ?", [inmuebleId]);
  assert.deepEqual(afterProperty, beforeProperty);
  assert.deepEqual(afterPublication, beforePublication);
  const [[tasacion]] = await connection.execute("SELECT * FROM inm_tasaciones WHERE inmueble_id = ?", [inmuebleId]);
  assert.equal(tasacion.valor_referencia, "500000.00");
  assert.equal(tasacion.precio_objetivo, "450000.00");
  assert.equal(tasacion.precio_venta, "425000.00");
  assert.equal(tasacion.situacion, "aprobado");
  assert.equal(tasacion.observacion, "Propietario baja el precio");
  const [history] = await connection.execute("SELECT * FROM inm_timeline WHERE inmueble_id = ? AND evento = 'precio_venta_actualizado' ORDER BY id", [inmuebleId]);
  assert.equal(history.length, 3);
  assert.match(history.at(-1).observacion, /430000\.00.*425000\.00/);
  assert.equal(history.at(-1).usuario_id, userId);
  const details = await expect(`/api/inmuebles/${inmuebleId}`, "GET", undefined, 200);
  assert.equal(details.tasacion.precioVenta, "425000.00");
  const published = await expect("/api/publicaciones", "GET", undefined, 200);
  assert.equal(published.publicadas.some(row => row.inmuebleId === inmuebleId), true);
  console.log("PASS: precio editable después de publicar, observación e historial; inmueble y publicación intactos");
} catch (error) {
  console.error("Falló la prueba de precios:", error.message);
  if (output.includes("Error")) console.error(output.slice(-2000));
  process.exitCode = 1;
} finally {
  server?.kill("SIGTERM");
  if (inmuebleId) {
    for (const table of ["inm_timeline", "inm_publicaciones", "inm_tasaciones", "inm_archivos", "inm_visitas", "inm_asignaciones_posicion"]) await connection.execute(`DELETE FROM ${table} WHERE inmueble_id = ?`, [inmuebleId]);
    await connection.execute("DELETE FROM inm_inmuebles WHERE id = ?", [inmuebleId]);
  }
  if (positionId) await connection.execute("DELETE FROM inm_posiciones WHERE id = ?", [positionId]);
  if (userId) {
    await connection.execute("DELETE FROM inm_sesiones WHERE usuario_id = ?", [userId]);
    await connection.execute("DELETE FROM inm_usuarios WHERE id = ?", [userId]);
  }
  await connection.end();
}
