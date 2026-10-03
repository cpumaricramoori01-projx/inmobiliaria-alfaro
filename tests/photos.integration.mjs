// Runs against the configured DB with temporary accounts/properties and an isolated
// HTTPS storage double. No real hosting files or existing portfolio data are changed.
import assert from 'node:assert/strict';
import { loadEnvFile } from 'node:process';
import { spawn, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import https from 'node:https';
import mysql from 'mysql2/promise';
import sharp from 'sharp';
import { hashPassword, hashSessionToken } from '../lib/password.mjs';
try { loadEnvFile('.env.local'); } catch {}
const origin = 'http://127.0.0.1:3108';
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const temporary = mkdtempSync(join(tmpdir(), 'alfaro-photo-test-'));
const files = new Map();
const users = [], properties = [];
let positionId, ownerId, storage, app;
const suffix = randomBytes(8).toString('hex');
const token = randomBytes(32).toString('hex');
const request = (path, cookie, options = {}) => fetch(origin + path, { ...options, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...options.headers } });
const jsonRequest = (path, cookie, method, data) => request(path, cookie, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
try {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(temporary, 'key.pem'), '-out', join(temporary, 'cert.pem'), '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' });
  storage = https.createServer({ key: readFileSync(join(temporary, 'key.pem')), cert: readFileSync(join(temporary, 'cert.pem')) }, async (req, res) => {
    if (req.headers.authorization !== `Bearer ${token}`) { res.writeHead(401).end(); return; }
    const path = new URL(req.url, 'https://localhost').searchParams.get('path');
    if (req.method === 'PUT') {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      files.set(path, Buffer.concat(chunks)); res.writeHead(201).end('{}');
    } else if (req.method === 'GET') {
      const file = files.get(path);
      if (!file) res.writeHead(404).end(); else res.writeHead(200).end(file);
    } else if (req.method === 'DELETE') { files.delete(path); res.writeHead(204).end(); }
    else res.writeHead(405).end();
  });
  await new Promise(resolve => storage.listen(0, '127.0.0.1', resolve));
  const storagePort = storage.address().port;
  const cookies = [];
  for (const rol of ['administrador', 'operador']) {
    const [user] = await connection.execute('INSERT INTO inm_usuarios (nombre,email,usuario,password_hash,rol,activo) VALUES (?,?,?,?,?,1)', ['Fotos prueba', `photos-${rol}-${suffix}@example.invalid`, `photos_${rol}_${suffix}`, await hashPassword(randomBytes(24).toString('hex')), rol]);
    users.push(user.insertId);
    const session = randomBytes(32).toString('hex');
    await connection.execute('INSERT INTO inm_sesiones (token_hash,usuario_id,expira) VALUES (?,?,?)', [hashSessionToken(session), user.insertId, new Date(Date.now() + 10 * 60 * 1000)]);
    cookies.push(`aa_session=${session}`);
  }
  for (let i = 0; i < 2; i++) {
    const [property] = await connection.execute("INSERT INTO inm_inmuebles (codigo,tipo,referencia,estado,etapa) VALUES (?, 'casa', 'Fotos prueba temporal', 'activo','visita_pendiente')", [`TEST-PHOTOS-${suffix}-${i}`]);
    properties.push(property.insertId);
  }
  const [positions] = await connection.execute('SELECT id,numero FROM inm_posiciones WHERE numero >= 201 OR id >= 201');
  const number = Array.from({length: 50}, (_, i) => i + 201).find(n => !positions.some(p => p.numero === n || p.id === n));
  assert.ok(number, 'Free temporary position required');
  await connection.execute('INSERT INTO inm_posiciones (id,numero,activo) VALUES (?,?,1)', [number, number]);
  positionId = number;
  await connection.execute('INSERT INTO inm_asignaciones_posicion (inmueble_id,posicion_id,activa) VALUES (?,?,1)', [properties[0], positionId]);
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3108', '-H', '127.0.0.1'], { env: { ...process.env, NODE_ENV: 'production', DOCUMENT_HOSTING_URL: `https://127.0.0.1:${storagePort}/documentos.php`, DOCUMENT_HOSTING_TOKEN: token, NODE_EXTRA_CA_CERTS: join(temporary, 'cert.pem') }, stdio: ['ignore','pipe','pipe'] });
  // Drain output without printing credentials or retaining unused logs.
  app.stdout.resume(); app.stderr.resume();
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try { if ((await request('/login')).status === 200) { ready = true; break; } } catch {}
    if (app.exitCode !== null) throw new Error('Next test server exited');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Next test server ready');
  for (const endpoint of ['/api/cartera', '/api/dashboard', '/api/reportes', '/api/publicaciones', '/api/tasaciones', '/api/posiciones']) {
    assert.equal((await request(endpoint, cookies[0])).status, 200, endpoint);
  }
  const releases = await (await request('/api/liberaciones', cookies[0])).json();
  assert.ok(releases.items.some(item => item.inmuebleId === properties[0]), 'Ownerless properties must be releasable');
  const appraisal = { inmuebleId: properties[0], fechaTasacion: '2026-01-01', valorReferencia: '100', precioObjetivo: '120', precioVenta: '150' };
  assert.equal((await jsonRequest('/api/tasaciones', cookies[0], 'POST', appraisal)).status, 409, 'A visit is required before appraisal');
  const propertyUrl = `/api/inmuebles/${properties[0]}`;
  assert.equal((await jsonRequest(propertyUrl, cookies[1], 'PUT', { habitaciones: '-1' })).status, 400);
  assert.equal((await jsonRequest(propertyUrl, cookies[1], 'PUT', { referencia: 'Should roll back', propietario: { dni: '123' } })).status, 400);
  const [[unchanged]] = await connection.execute('SELECT referencia FROM inm_inmuebles WHERE id=?', [properties[0]]);
  assert.equal(unchanged.referencia, 'Fotos prueba temporal');
  let dni;
  for (;;) {
    dni = String(Math.floor(10000000 + Math.random() * 89999999));
    const [[exists]] = await connection.execute('SELECT COUNT(*) total FROM inm_propietarios WHERE dni=?', [dni]);
    if (!exists.total) break;
  }
  assert.equal((await jsonRequest(propertyUrl, cookies[1], 'PUT', { propietario: { dni, nombres: 'Prueba', apellidos: suffix } })).status, 200);
  const [[propertyOwner]] = await connection.execute('SELECT propietario_id FROM inm_inmuebles WHERE id=?', [properties[0]]);
  ownerId = propertyOwner.propietario_id;
  assert.ok(ownerId, 'An owner can be linked from the information module');
  const [[beforeDimensions]] = await connection.execute('SELECT tipo,direccion FROM inm_inmuebles WHERE id=?', [properties[0]]);
  assert.equal(beforeDimensions.tipo, 'casa', 'Partial edits preserve omitted fields');
  const base = { inmuebleId: properties[0], fechaVisita: '2026-01-01', observaciones: 'Prueba de fotografías' };
  assert.equal((await jsonRequest('/api/visitas', cookies[0], 'POST', base)).status, 400);
  assert.equal((await jsonRequest('/api/visitas', cookies[0], 'POST', { ...base, fotoIds: [] })).status, 400);
  assert.equal((await jsonRequest('/api/visitas', cookies[1], 'POST', { ...base, fotoIds: [1] })).status, 403);
  const image = await sharp({ create: { width: 2300, height: 1200, channels: 3, background: '#c80000' } }).png().toBuffer();
  async function upload(property, cookie, category = 'FOTO_INMUEBLE') {
    const form = new FormData(); form.set('archivo', new Blob([image], { type: 'image/png' }), 'foto.png'); form.set('nombre','Foto prueba'); form.set('tipoDocumento',category);
    const response = await request(`/api/inmuebles/${property}/archivos`, cookie, { method: 'POST', body: form });
    const data = await response.json(); assert.equal(response.status, 201, data.error);
    return data.id;
  }
  const photoId = await upload(properties[0], cookies[0]);
  const otherId = await upload(properties[1], cookies[0]);
  const operatorId = await upload(properties[0], cookies[1]);
  const documentId = await upload(properties[0], cookies[0], 'DNI_PROPIETARIO');
  const imgUrl = `/api/inmuebles/${properties[0]}/archivos/${photoId}`;
  assert.equal((await request(imgUrl)).status, 401);
  assert.equal((await request(`/api/inmuebles/${properties[1]}/archivos/${photoId}`, cookies[0])).status, 404);
  const opened = await request(imgUrl, cookies[1]); assert.equal(opened.status, 200); assert.equal(opened.headers.get('content-type'),'image/webp'); assert.match(opened.headers.get('content-disposition'), /^inline/);
  const metadata = await sharp(Buffer.from(await opened.arrayBuffer())).metadata(); assert.equal(metadata.width,1920);
  const downloaded = await request(imgUrl+'?download=1',cookies[0]); assert.match(downloaded.headers.get('content-disposition'), /^attachment/); await downloaded.body.cancel();
  for (const id of [otherId, operatorId, documentId]) assert.equal((await jsonRequest('/api/visitas', cookies[0], 'POST', { ...base, fotoIds: [id] })).status, 409);
  const draftResponse = await (await request('/api/visitas', cookies[0])).json();
  assert.ok(draftResponse.items.find(item => item.id === properties[0]).fotos.some(photo => photo.id === photoId), 'Uploaded photos survive returning to the visit screen');
  assert.equal((await jsonRequest('/api/visitas', cookies[0], 'POST', { ...base, fechaVisita: '2026-02-30', fotoIds: [photoId] })).status, 400);
  const first = await jsonRequest('/api/visitas', cookies[0], 'POST', { ...base, fotoIds: [photoId] }); assert.equal(first.status,201,JSON.stringify(await first.json()));
  assert.equal((await jsonRequest('/api/visitas', cookies[0], 'POST', { ...base, fotoIds: [photoId] })).status,409);
  assert.equal((await jsonRequest('/api/tasaciones', cookies[0], 'POST', appraisal)).status, 201);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'POST', { inmuebleId: properties[0], texto: 'Texto de prueba sin Drive' })).status, 201);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'PUT', { inmuebleId: properties[0], texto: 'Texto editado sin enlace' })).status, 200);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'PUT', { inmuebleId: properties[0] })).status, 200);
  const [[linked]] = await connection.execute('SELECT visita_id FROM inm_archivos WHERE id=?',[photoId]); assert.ok(linked.visita_id);
  const [[visit]] = await connection.execute('SELECT drive_link FROM inm_visitas WHERE id=?',[linked.visita_id]); assert.equal(visit.drive_link,null);
  const filesUrl = `/api/inmuebles/${properties[0]}/archivos`;
  for (const id of [photoId,operatorId]) assert.equal((await jsonRequest(filesUrl,cookies[0],'PATCH',{archivoId:id,nombre:'Portada editada',observacion:'Descripción',esPortada:true})).status,200);
  assert.equal((await jsonRequest(filesUrl,cookies[0],'PATCH',{archivoId:otherId,nombre:'Otro'})).status,404);
  assert.equal((await jsonRequest(filesUrl,cookies[0],'PATCH',{archivoId:documentId,nombre:'DNI'})).status,404);
  const [[covers]] = await connection.execute('SELECT COUNT(*) AS total FROM inm_archivos WHERE inmueble_id=? AND es_portada=1',[properties[0]]); assert.equal(covers.total,1);
  const listing = await (await request(filesUrl,cookies[0])).json(); assert.ok(listing.archivos.some(file => file.id === photoId && file.visitaId === linked.visita_id));
  const visitsMarkup = await (await request('/registrar-visitas',cookies[0])).text(); assert.equal(visitsMarkup.includes('Google Drive'),false);
  const removed = await request(`${filesUrl}?archivoId=${photoId}`,cookies[0],{method:'DELETE'}); assert.equal(removed.status,200);
  assert.equal((await request(imgUrl,cookies[0])).status,404);
  const beforeRelease = await (await request('/api/dashboard', cookies[0])).json();
  const releaseResults = await Promise.all([1, 2].map(() => jsonRequest('/api/liberaciones', cookies[0], 'POST', { inmuebleId: properties[0], motivo: 'otro', detalleOtro: 'Prueba temporal' })));
  assert.deepEqual(releaseResults.map(response => response.status).sort(), [201, 409], 'Concurrent releases are serialized');
  const afterRelease = await (await request('/api/dashboard', cookies[0])).json();
  assert.equal(afterRelease.resumen.posicionesDisponibles, beforeRelease.resumen.posicionesDisponibles + 1, 'Released positions become available in dashboard');
  const report = await (await request('/api/reportes', cookies[0])).json();
  assert.equal(report.resumen.disponibles, afterRelease.resumen.posicionesDisponibles, 'Reports agree on available positions');
  const portfolio = await (await request('/api/cartera', cookies[0])).json();
  assert.equal(portfolio.resumen.disponibles, afterRelease.resumen.posicionesDisponibles, 'Dashboard and portfolio agree on capacity');
  console.log('PASS: propietario opcional/vinculado; etapas de visita y tasación; publicación sin Drive; liberación simultánea; disponibilidad compartida; fotos obligatorias; formato/compresión; acceso privado; propietario/categoría/inmueble; vínculo a visita; edición/portada única; borrado compartido');
} catch(error) {
  console.error('Comprobación de fotos fallida:',error.message); process.exitCode=1;
  // Server logs intentionally not printed to avoid exposing credentials or content.
} finally {
  if (app) { app.kill('SIGTERM'); await new Promise(resolve => { if(app.exitCode!==null) resolve(); else app.once('exit',resolve); }); }
  if(storage) await new Promise(resolve => storage.close(resolve));
  for(const property of properties) {
    await connection.execute('DELETE FROM inm_publicaciones WHERE inmueble_id=?',[property]);
    await connection.execute('DELETE FROM inm_tasaciones WHERE inmueble_id=?',[property]);
    await connection.execute('DELETE FROM inm_liberaciones WHERE inmueble_id=?',[property]);
    await connection.execute('DELETE FROM inm_archivos WHERE inmueble_id=?',[property]);
    await connection.execute('DELETE FROM inm_timeline WHERE inmueble_id=?',[property]);
    await connection.execute('DELETE FROM inm_visitas WHERE inmueble_id=?',[property]);
    await connection.execute('DELETE FROM inm_asignaciones_posicion WHERE inmueble_id=?',[property]);
    await connection.execute('DELETE FROM inm_inmuebles WHERE id=?',[property]);
  }
  if(ownerId) await connection.execute('DELETE FROM inm_propietarios WHERE id=?',[ownerId]);
  if(positionId) await connection.execute('DELETE FROM inm_posiciones WHERE id=?',[positionId]);
  for(const user of users) { await connection.execute('DELETE FROM inm_sesiones WHERE usuario_id=?',[user]); await connection.execute('DELETE FROM inm_usuarios WHERE id=?',[user]); }
  await connection.end(); rmSync(temporary,{recursive:true,force:true});
}
