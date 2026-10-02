// Run explicitly against the configured database. Temporary test accounts are
// removed in finally; existing accounts and portfolio records are not changed.
import assert from "node:assert/strict";
import { loadEnvFile } from "node:process";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import { hashPassword, hashSessionToken } from "../lib/password.mjs";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
const origin = "http://127.0.0.1:3107";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const ids = [];
let server;
let testPropertyId;
let output = "";
const request = (path, options = {}) => fetch(origin + path, { redirect: "manual", ...options });
const post = (path, data, cookie, source = origin) => request(path, {
  method: "POST", headers: { "Content-Type": "application/json", Origin: source, ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(data),
});
const cookieFrom = response => response.headers.get("set-cookie")?.split(";")[0];

try {
  const password = randomBytes(24).toString("hex");
  const suffix = randomBytes(8).toString("hex");
  const accounts = [];
  for (const rol of ["administrador", "operador", "usuario"]) {
    const usuario = `test_${rol}_${suffix}`;
    const [created] = await connection.execute("INSERT INTO inm_usuarios (nombre, email, usuario, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, 1)", ["Prueba " + rol, usuario + "@example.invalid", usuario, await hashPassword(password), rol]);
    ids.push(created.insertId);
    accounts.push({ id: created.insertId, usuario, password });
  }
  const [testProperty] = await connection.execute("INSERT INTO inm_inmuebles (codigo, tipo, referencia, estado, etapa) VALUES (?, 'casa', 'Ficha temporal permisos', 'activo', 'visita_pendiente')", ["TEST-ACCESS-" + suffix]);
  testPropertyId = testProperty.insertId;
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3107", "-H", "127.0.0.1"], { env: { ...process.env, NODE_ENV: "production" }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", chunk => { output += chunk; });
  server.stderr.on("data", chunk => { output += chunk; });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error("El servidor de prueba no pudo iniciar.");
    try {
      const response = await request("/login");
      if (response.status === 200) { ready = true; break; }
    } catch { /* Server is starting. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.equal(ready, true, "Login page must render");
  const loginMarkup = await (await request("/login")).text();
  assert.match(loginMarkup, /Iniciar sesión/);
  assert.equal(loginMarkup.includes("Cerrar sesión"), false);
  console.log("PASS: login público sin menú privado");

  const pages = ["/", "/cartera", "/registrar-inmueble", "/registrar-visitas", "/visitas-pendientes", "/registrar-tasaciones", "/tasaciones-textos-pendientes", "/liberar-inmuebles", "/reportes", "/datos-inmuebles", "/nuevos", "/tasaciones-pendientes"];
  for (const path of pages) {
    const response = await request(path);
    assert.equal(response.status, 307, path);
    assert.equal(new URL(response.headers.get("location"), origin).pathname, "/login");
  }
  const apis = ["/api/cartera", "/api/dashboard", "/api/posiciones", "/api/propietarios?dni=00000000", "/api/visitas", "/api/tasaciones", "/api/publicaciones", "/api/liberaciones", "/api/reportes", "/api/inmuebles", "/api/inmuebles/1", "/api/inmuebles/1/archivos"];
  for (const path of apis) assert.equal((await request(path)).status, 401, path);
  for (const cookie of ["aa_session=falso", "aa_session=" + "a".repeat(64)]) {
    assert.equal((await request("/cartera", { headers: { Cookie: cookie } })).status, 307);
    assert.equal((await request("/api/cartera", { headers: { Cookie: cookie } })).status, 401);
  }
  console.log("PASS: todas las páginas y APIs rechazan acceso anónimo y cookies falsas");

  assert.equal((await post("/api/auth/login", accounts[0], undefined, "https://example.invalid")).status, 403);
  assert.equal((await post("/api/auth/login", { usuario: accounts[0].usuario, password: "incorrecta" })).status, 401);
  assert.equal((await post("/api/auth/login", { usuario: "desconocido_" + suffix, password })).status, 401);
  assert.equal((await post("/api/auth/login", { usuario: accounts[0].usuario, password: "x".repeat(257) })).status, 400);

  const login = await post("/api/auth/login", accounts[0]);
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(login.headers.get("set-cookie"), /Secure/i);
  assert.match(login.headers.get("set-cookie"), /SameSite=lax/i);
  assert.equal((await login.json()).redirectTo, "/");
  const adminCookie = cookieFrom(login);
  const [sessions] = await connection.execute("SELECT token_hash, expira FROM inm_sesiones WHERE usuario_id = ?", [accounts[0].id]);
  assert.equal(sessions[0].token_hash, hashSessionToken(adminCookie.split("=")[1]));
  assert.equal((await request("/api/propietarios?dni=00000000", { headers: { Cookie: adminCookie } })).status, 200);
  assert.equal((await request("/login", { headers: { Cookie: adminCookie } })).status, 307);
  const dashboard = await request("/", { headers: { Cookie: adminCookie } });
  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /Prueba administrador/);
  for (const path of pages.filter(path => path !== "/")) {
    assert.equal((await request(path, { headers: { Cookie: adminCookie } })).status, 200, `administrator page ${path}`);
  }
  assert.equal((await post("/api/inmuebles", {}, adminCookie, "https://example.invalid")).status, 403);
  console.log("PASS: administrador autenticado, cookie segura, sesión en MySQL y protección de origen");

  for (let i = 0; i < 5; i++) assert.equal((await post("/api/auth/login", { usuario: accounts[1].usuario, password: "incorrecta" })).status, 401);
  const blocked = await post("/api/auth/login", accounts[1]);
  if (blocked.status !== 429) {
    const [state] = await connection.execute("SELECT intentos_fallidos, bloqueo_hasta FROM inm_usuarios WHERE id = ?", [accounts[1].id]);
    throw new Error(`Bloqueo incorrecto: HTTP ${blocked.status}; intentos ${state[0].intentos_fallidos}; bloqueo vigente ${state[0].bloqueo_hasta > new Date()}`);
  }
  await connection.execute("UPDATE inm_usuarios SET bloqueo_hasta = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE id = ?", [accounts[1].id]);
  assert.equal((await post("/api/auth/login", { usuario: accounts[1].usuario, password: "incorrecta" })).status, 401);
  const [reset] = await connection.execute("SELECT intentos_fallidos, bloqueo_hasta FROM inm_usuarios WHERE id = ?", [accounts[1].id]);
  assert.equal(reset[0].intentos_fallidos, 1);
  assert.equal(reset[0].bloqueo_hasta, null);
  const operatorLogin = await post("/api/auth/login", accounts[1]);
  assert.equal(operatorLogin.status, 200);
  const operatorCookie = cookieFrom(operatorLogin);
  assert.equal((await operatorLogin.json()).redirectTo, "/datos-inmuebles");
  for (const account of [accounts[1], accounts[2]]) {
    const cookie = account === accounts[1] ? operatorCookie : cookieFrom(await post("/api/auth/login", account));
    for (const path of pages.filter(path => path !== "/datos-inmuebles")) {
      const response = await request(path, { headers: { Cookie: cookie } });
      assert.equal(response.status, 307, `restricted page ${path}`);
      assert.equal(new URL(response.headers.get("location"), origin).pathname, "/datos-inmuebles");
    }
    const info = await request("/datos-inmuebles", { headers: { Cookie: cookie } });
    assert.equal(info.status, 200);
    const markup = await info.text();
    assert.match(markup, /Información de inmuebles/);
    assert.equal(markup.includes('href="/cartera"'), false);
    assert.equal(markup.includes('href="/reportes"'), false);
    assert.equal(markup.includes('href="/registrar-tasaciones"'), false);
    assert.equal(markup.includes('href="/"'), false);
    for (const path of apis.filter(path => !path.startsWith("/api/inmuebles"))) {
      assert.equal((await request(path, { headers: { Cookie: cookie } })).status, 403, `restricted API ${path}`);
    }
    const selector = await request("/api/inmuebles", { headers: { Cookie: cookie } });
    assert.equal(selector.status, 200);
    assert.equal((await selector.json()).inmuebles.some(row => row.id === "TEST-ACCESS-" + suffix), true);
    assert.equal((await request(`/api/inmuebles/${testPropertyId}`, { headers: { Cookie: cookie } })).status, 200);
    const update = await request(`/api/inmuebles/${testPropertyId}`, { method: "PUT", headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ referencia: "Ficha completada", direccion: "Dirección de prueba", estado: "historico", etapa: "publicado" }) });
    assert.equal(update.status, 200);
    const [[property]] = await connection.execute("SELECT referencia, direccion, estado, etapa FROM inm_inmuebles WHERE id = ?", [testPropertyId]);
    assert.equal(property.referencia, "Ficha completada");
    assert.equal(property.estado, "activo");
    assert.equal(property.etapa, "visita_pendiente");
    const file = await post(`/api/inmuebles/${testPropertyId}/archivos`, { tipoDocumento: "OTRO", nombre: "Documento prueba permisos", enlace: "https://drive.google.com/test" }, cookie);
    assert.equal(file.status, 201);
    const fileId = (await file.json()).id;
    const files = await request(`/api/inmuebles/${testPropertyId}/archivos`, { headers: { Cookie: cookie } });
    assert.equal(files.status, 200);
    assert.equal((await files.json()).archivos.some(file => file.id === fileId), true);
    const remove = await request(`/api/inmuebles/${testPropertyId}/archivos?archivoId=${fileId}`, { method: "DELETE", headers: { Cookie: cookie, Origin: origin } });
    assert.equal(remove.status, 200);
    assert.equal((await post("/api/inmuebles", {}, cookie)).status, 403);
    for (const path of ["/api/visitas", "/api/tasaciones", "/api/publicaciones", "/api/liberaciones"]) {
      assert.equal((await post(path, {}, cookie)).status, 403, `restricted POST ${path}`);
    }
    const patch = await request("/api/tasaciones", { method: "PATCH", headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ inmuebleId: 11, precioVenta: "1" }) });
    assert.equal(patch.status, 403);
    assert.equal((await request("/login", { headers: { Cookie: cookie } })).headers.get("location")?.endsWith("/datos-inmuebles"), true);
  }
  console.log("PASS: operador y rol usuario solo acceden a Información de inmuebles; otras páginas y APIs bloqueadas");

  assert.equal((await post("/api/auth/logout", {}, adminCookie, "https://example.invalid")).status, 403);
  assert.equal((await post("/api/auth/logout", {}, adminCookie)).status, 200);
  assert.equal((await request("/api/cartera", { headers: { Cookie: adminCookie } })).status, 401);
  assert.equal((await request("/cartera", { headers: { Cookie: adminCookie } })).status, 307);
  await connection.execute("UPDATE inm_usuarios SET activo = 0 WHERE id = ?", [accounts[1].id]);
  assert.equal((await request("/api/cartera", { headers: { Cookie: operatorCookie } })).status, 401);
  await connection.execute("UPDATE inm_usuarios SET activo = 1 WHERE id = ?", [accounts[1].id]);
  await connection.execute("UPDATE inm_sesiones SET expira = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE usuario_id = ?", [accounts[1].id]);
  assert.equal((await request("/api/cartera", { headers: { Cookie: operatorCookie } })).status, 401);
  console.log("PASS: cierre de sesión, cuenta desactivada y sesión vencida revocan el acceso");
} catch (error) {
  // Avoid dumping request bodies, passwords, cookies or database credentials.
  console.error("Falló una comprobación:", error.message);
  if (output.includes("Error")) console.error(output.slice(-3000));
  process.exitCode = 1;
} finally {
  server?.kill("SIGTERM");
  if (testPropertyId) {
    await connection.execute("DELETE FROM inm_archivos WHERE inmueble_id = ?", [testPropertyId]);
    await connection.execute("DELETE FROM inm_inmuebles WHERE id = ?", [testPropertyId]);
  }
  for (const id of ids) {
    await connection.execute("DELETE FROM inm_sesiones WHERE usuario_id = ?", [id]);
    await connection.execute("DELETE FROM inm_usuarios WHERE id = ?", [id]);
  }
  await connection.end();
}
