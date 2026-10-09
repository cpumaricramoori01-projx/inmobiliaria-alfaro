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
import { encryptSecret, newSecret } from '../lib/mfa.mjs';
import { hashPassword, hashSessionToken } from '../lib/password.mjs';
try { loadEnvFile('.env.local'); } catch {}
process.env.AUTH_MFA_KEY ||= randomBytes(32).toString('hex');
const origin = 'http://127.0.0.1:3108';
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const temporary = mkdtempSync(join(tmpdir(), 'alfaro-photo-test-'));
const files = new Map();
const users = [], properties = [], managedTypes = [], managedGeography = [];
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
    if (rol === 'administrador') await connection.execute('UPDATE inm_usuarios SET mfa_secret=? WHERE id=?', [encryptSecret(newSecret()), user.insertId]);
    const session = randomBytes(32).toString('hex');
    await connection.execute('INSERT INTO inm_sesiones (token_hash,usuario_id,expira,last_seen,authenticated_at) VALUES (?,?,?,?,?)', [hashSessionToken(session), user.insertId, new Date(Date.now() + 60 * 60 * 1000), new Date(), new Date()]);
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
  const publication = { inmuebleId: properties[0], texto: 'Texto de prueba sin Drive' };
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'POST', publication)).status, 409, 'Appraisal document is required');
  const appraisalDocumentId = await upload(properties[0], cookies[1], 'TASACION');
  assert.ok(appraisalDocumentId);
  await connection.execute('UPDATE inm_inmuebles SET propietario_id=NULL WHERE id=?', [properties[0]]);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'POST', publication)).status, 409, 'Owner DNI is required');
  await connection.execute('UPDATE inm_inmuebles SET propietario_id=? WHERE id=?', [ownerId, properties[0]]);
  await connection.execute("UPDATE inm_archivos SET tipo_documento='OTRO' WHERE id=?", [documentId]);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'POST', publication)).status, 409, 'DNI file is required');
  await connection.execute("UPDATE inm_archivos SET tipo_documento='DNI_PROPIETARIO' WHERE id=?", [documentId]);
  const [[photoVisit]] = await connection.execute('SELECT visita_id FROM inm_archivos WHERE id=?', [photoId]);
  await connection.execute('UPDATE inm_archivos SET visita_id=NULL WHERE id=?', [photoId]);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'POST', publication)).status, 409, 'Unlinked gallery photos do not replace visit photos');
  await connection.execute('UPDATE inm_archivos SET visita_id=? WHERE id=?', [photoVisit.visita_id, photoId]);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'POST', publication)).status, 201);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'PUT', { inmuebleId: properties[0], texto: 'Texto editado sin enlace' })).status, 200);
  await connection.execute("UPDATE inm_archivos SET tipo_documento='OTRO' WHERE id=?", [appraisalDocumentId]);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'PUT', { inmuebleId: properties[0] })).status, 409, 'Requirements are checked again at publication');
  const notReadyDashboard = await (await request('/api/dashboard', cookies[0])).json();
  const notReadyReport = await (await request('/api/reportes?reporte=Listos%20para%20publicar', cookies[0])).json();
  assert.ok(!notReadyReport.rows.some(row => row.inmuebleId === properties[0]), 'Incomplete dossier is not ready in reports');
  await connection.execute("UPDATE inm_archivos SET tipo_documento='TASACION' WHERE id=?", [appraisalDocumentId]);
  const readyDashboard = await (await request('/api/dashboard', cookies[0])).json();
  assert.equal(readyDashboard.resumen.listosParaPublicar, notReadyDashboard.resumen.listosParaPublicar + 1);
  assert.equal((await jsonRequest('/api/publicaciones', cookies[0], 'PUT', { inmuebleId: properties[0] })).status, 200);
  assert.equal((await jsonRequest('/api/tasaciones', cookies[0], 'PATCH', { inmuebleId: properties[0], precioVenta: '180' })).status, 200, 'Listing price can change after publication');
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
  const invalidSale = { inmuebleId: properties[1], motivo: 'vendido' };
  assert.equal((await jsonRequest('/api/liberaciones', cookies[0], 'POST', invalidSale)).status, 400);
  assert.equal((await jsonRequest('/api/liberaciones', cookies[1], 'POST', { ...invalidSale, fechaVenta: '2026-01-01', precioFinal: '200', comision: '10' })).status, 403);
  assert.equal((await jsonRequest('/api/liberaciones', cookies[0], 'POST', { ...invalidSale, fechaVenta: '2026-01-01', precioFinal: '200', comision: '10' })).status, 201);
  const soldInfo = await (await request(`/api/inmuebles/${properties[1]}`, cookies[1])).json();
  assert.equal(soldInfo.venta.precioFinal, '200.00');
  assert.equal(soldInfo.venta.comision, '10.00');
  const soldReport = await (await request('/api/reportes?reporte=Vendidos', cookies[0])).json();
  assert.equal(soldReport.rows.find(row => row.inmuebleId === properties[1]).precioFinal, '200.00');
  const beforeRelease = await (await request('/api/dashboard', cookies[0])).json();
  const releaseResults = await Promise.all([1, 2].map(() => jsonRequest('/api/liberaciones', cookies[0], 'POST', { inmuebleId: properties[0], motivo: 'otro', detalleOtro: 'Prueba temporal' })));
  assert.deepEqual(releaseResults.map(response => response.status).sort(), [201, 409], 'Concurrent releases are serialized');
  const afterRelease = await (await request('/api/dashboard', cookies[0])).json();
  assert.equal(afterRelease.resumen.posicionesDisponibles, beforeRelease.resumen.posicionesDisponibles + 1, 'Released positions become available in dashboard');
  const report = await (await request('/api/reportes', cookies[0])).json();
  assert.equal(report.resumen.disponibles, afterRelease.resumen.posicionesDisponibles, 'Reports agree on available positions');
  const portfolio = await (await request('/api/cartera', cookies[0])).json();
  assert.equal(portfolio.resumen.disponibles, afterRelease.resumen.posicionesDisponibles, 'Dashboard and portfolio agree on capacity');
  // Register without photos, then regularize using the information module upload API.
  const [pendingProperty] = await connection.execute("INSERT INTO inm_inmuebles (codigo,tipo,referencia,estado,etapa) VALUES (?, 'casa', 'Visita sin evidencia temporal', 'activo','visita_pendiente')", [`TEST-EVIDENCE-${suffix}`]);
  properties.push(pendingProperty.insertId);
  await connection.execute('INSERT INTO inm_asignaciones_posicion (inmueble_id,posicion_id,activa) VALUES (?,?,1)', [pendingProperty.insertId, positionId]);
  const pendingBase = { inmuebleId: pendingProperty.insertId, fechaVisita: '2026-01-01', fotoIds: [], pendienteEvidencia: true };
  assert.equal((await jsonRequest('/api/visitas', cookies[1], 'POST', pendingBase)).status, 403);
  const pendingResponse = await jsonRequest('/api/visitas', cookies[0], 'POST', pendingBase);
  assert.equal(pendingResponse.status, 201);
  assert.equal((await pendingResponse.json()).pendienteEvidencia, true);
  const visitUrl = `/api/inmuebles/${pendingProperty.insertId}/visitas`;
  assert.equal((await request(visitUrl)).status, 401);
  const pendingVisit = (await (await request(visitUrl, cookies[1])).json()).visitas[0];
  assert.equal(pendingVisit.pendienteEvidencia, true);
  const regularize = async (propertyId, visitId, category = 'FOTO_INMUEBLE') => {
    const form = new FormData(); form.set('archivo', new Blob([image], { type: 'image/png' }), 'evidencia.png');
    form.set('nombre', 'Evidencia de visita'); form.set('tipoDocumento', category); form.set('visitaId', String(visitId));
    return request(`/api/inmuebles/${propertyId}/archivos`, cookies[1], { method: 'POST', body: form });
  };
  assert.equal((await regularize(properties[1], pendingVisit.id)).status, 400, 'Cross-property visits are rejected');
  assert.equal((await regularize(pendingProperty.insertId, pendingVisit.id, 'DNI_PROPIETARIO')).status, 400);
  assert.equal((await regularize(pendingProperty.insertId, -1)).status, 400);
  const evidenceResponse = await regularize(pendingProperty.insertId, pendingVisit.id);
  assert.equal(evidenceResponse.status, 201);
  const evidenceId = (await evidenceResponse.json()).id;
  const withEvidence = (await (await request(visitUrl, cookies[0])).json()).visitas[0];
  assert.equal(withEvidence.pendienteEvidencia, false); assert.equal(Number(withEvidence.fotos), 1);
  const evidenceFilesUrl = `/api/inmuebles/${pendingProperty.insertId}/archivos`;
  const evidenceListing = await (await request(evidenceFilesUrl, cookies[0])).json();
  assert.ok(evidenceListing.archivos.some(file => file.id === evidenceId && file.visitaId === pendingVisit.id));
  assert.equal((await request(`${evidenceFilesUrl}?archivoId=${evidenceId}`, cookies[0], { method: 'DELETE' })).status, 200);
  assert.equal((await (await request(visitUrl, cookies[0])).json()).visitas[0].pendienteEvidencia, true);
  // Dynamic property types: permissions, duplicates, assignment, rename and deactivation.
  assert.equal((await request('/api/tipos-inmueble')).status, 401);
  assert.equal((await request('/api/tipos-inmueble', cookies[1])).status, 200);
  const customType = `Cochera ${suffix}`, renamedType = `Almacén ${suffix}`;
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[1], 'POST', { nombre: customType })).status, 403);
  for (const nombre of ['', 'a'.repeat(31), 42]) assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'POST', { nombre })).status, 400);
  const typeResponse = await jsonRequest('/api/tipos-inmueble', cookies[0], 'POST', { nombre: customType });
  assert.equal(typeResponse.status, 201);
  const typeId = (await typeResponse.json()).id; managedTypes.push(typeId);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'POST', { nombre: customType.toLowerCase() })).status, 409);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[1], 'PATCH', { id: typeId, activo: false })).status, 403);
  const pendingInfoUrl = `/api/inmuebles/${pendingProperty.insertId}`;
  assert.equal((await jsonRequest(pendingInfoUrl, cookies[1], 'PUT', { tipo: customType })).status, 200);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'PATCH', { id: typeId, activo: false })).status, 200);
  assert.equal((await jsonRequest(pendingInfoUrl, cookies[1], 'PUT', { tipo: customType, habitaciones: 2 })).status, 200, 'Existing inactive types can be retained');
  assert.equal((await jsonRequest(`/api/inmuebles/${properties[1]}`, cookies[1], 'PUT', { tipo: customType })).status, 400, 'Inactive types cannot be newly assigned');
  assert.equal((await jsonRequest('/api/inmuebles', cookies[0], 'POST', { posicion: 1, tipo: customType, nombres: 'Tipo temporal', ubicacion: 'Calle de prueba 100' })).status, 400);
  assert.equal((await jsonRequest(pendingInfoUrl, cookies[1], 'PUT', { tipo: `No existe ${suffix}` })).status, 400);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'PATCH', { id: typeId, nombre: renamedType })).status, 200);
  const renamedInfo = await (await request(pendingInfoUrl, cookies[1])).json();
  assert.equal(renamedInfo.inmueble.tipo, renamedType);
  const typeListing = await (await request('/api/tipos-inmueble', cookies[0])).json();
  assert.equal(Number(typeListing.tipos.find(type => type.id === typeId).inmuebles), 1);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'PATCH', { id: typeId, nombre: 'Casa' })).status, 409);
  assert.equal((await (await request(pendingInfoUrl, cookies[0])).json()).inmueble.tipo, renamedType, 'Duplicate rename rolls back property changes');
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'PATCH', { id: typeId, activo: true })).status, 200);
  assert.equal((await jsonRequest(`/api/inmuebles/${properties[1]}`, cookies[1], 'PUT', { tipo: renamedType })).status, 200);
  // Deletion is limited to administrators and types with no active or historical links.
  assert.equal((await jsonRequest('/api/tipos-inmueble', '', 'DELETE', { id: typeId })).status, 401);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[1], 'DELETE', { id: typeId })).status, 403);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'DELETE', { id: -1 })).status, 400);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'DELETE', { id: typeId })).status, 409);
  assert.equal((await jsonRequest(pendingInfoUrl, cookies[1], 'PUT', { tipo: 'Casa' })).status, 200);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'DELETE', { id: typeId })).status, 409, 'Historical properties also prevent deletion');
  assert.equal((await jsonRequest(`/api/inmuebles/${properties[1]}`, cookies[1], 'PUT', { tipo: 'Casa' })).status, 200);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'DELETE', { id: typeId })).status, 200);
  assert.equal((await jsonRequest('/api/tipos-inmueble', cookies[0], 'DELETE', { id: typeId })).status, 404);
  assert.ok(!(await (await request('/api/tipos-inmueble', cookies[0])).json()).tipos.some(type => type.id === typeId));
  assert.equal((await jsonRequest(pendingInfoUrl, cookies[1], 'PUT', { tipo: renamedType })).status, 400);
  const raceName = `Dúplex ${suffix}`;
  const raceCreated = await jsonRequest('/api/tipos-inmueble', cookies[0], 'POST', { nombre: raceName });
  assert.equal(raceCreated.status, 201);
  const raceId = (await raceCreated.json()).id; managedTypes.push(raceId);
  const [assignRace, deleteRace] = await Promise.all([
    jsonRequest(pendingInfoUrl, cookies[1], 'PUT', { tipo: raceName }),
    jsonRequest('/api/tipos-inmueble', cookies[0], 'DELETE', { id: raceId }),
  ]);
  assert.ok((assignRace.status === 200 && deleteRace.status === 409) || (assignRace.status === 400 && deleteRace.status === 200), `Assignment/deletion must serialize: ${assignRace.status}/${deleteRace.status}`);
  // Rental operation, monetary semantics, closure and report separation.
  assert.equal((await jsonRequest(pendingInfoUrl, cookies[1], 'PUT', {operacion:'alquiler'})).status, 400);
  assert.equal((await jsonRequest(pendingInfoUrl, cookies[0], 'PUT', {operacion:'alquiler'})).status, 200);
  assert.equal((await (await request(pendingInfoUrl,cookies[0])).json()).inmueble.operacion,'alquiler');
  assert.equal((await jsonRequest(pendingInfoUrl, cookies[0], 'PUT', {operacion:'otro'})).status, 400);
  assert.equal((await jsonRequest('/api/tasaciones',cookies[0],'POST',{inmuebleId:pendingProperty.insertId,fechaTasacion:'2025-12-31',valorReferencia:'1500',precioObjetivo:'1600',precioVenta:'1550'})).status,400);
  assert.equal((await jsonRequest('/api/tasaciones',cookies[0],'POST',{inmuebleId:pendingProperty.insertId,fechaTasacion:'2026-01-01',valorReferencia:'1500',precioObjetivo:'1600',precioVenta:'1550'})).status,201);
  assert.equal((await jsonRequest(pendingInfoUrl,cookies[0],'PUT',{operacion:'venta'})).status,400);
  assert.equal((await jsonRequest('/api/liberaciones',cookies[0],'POST',{inmuebleId:pendingProperty.insertId,motivo:'vendido',fechaVenta:'2026-01-01',precioFinal:'1550',comision:'100'})).status,409);
  const rental = {inmuebleId:pendingProperty.insertId,motivo:'alquilado',fechaAlquiler:'2026-01-01',rentaMensual:'1500',comision:'1500',garantia:'3000',adelanto:'1500',fechaInicioAlquiler:'2026-02-01',fechaFinAlquiler:'2027-02-01'};
  assert.equal((await jsonRequest('/api/liberaciones',cookies[0],'POST',{...rental,rentaMensual:'0'})).status,400);
  assert.equal((await jsonRequest('/api/liberaciones',cookies[0],'POST',rental)).status,201);
  const rentalInfo = await (await request(pendingInfoUrl,cookies[0])).json();
  assert.equal(rentalInfo.inmueble.estado,'inactivo');
  assert.equal(rentalInfo.venta,null);
  assert.equal(Number(rentalInfo.alquiler.rentaMensual),1500);
  assert.equal(rentalInfo.alquiler.fechaFinAlquiler,'2027-02-01');
  const rentals = await (await request('/api/reportes?reporte=Alquilados&operacion=alquiler&pruebas=1&todos=1',cookies[0])).json();
  const rentalRow = rentals.rows.find(row=>row.inmuebleId===pendingProperty.insertId);
  assert.ok(rentalRow);
  assert.equal(rentalRow.operacion,'Alquiler');
  assert.equal(rentalRow.tasacion,null);
  assert.equal(Number(rentalRow.rentaMensual),1500);
  for (const report of ['Vendidos','Retirados / cancelados']) {
    const result = await (await request(`/api/reportes?reporte=${encodeURIComponent(report)}&pruebas=1&todos=1`,cookies[0])).json();
    assert.ok(!result.rows.some(row=>row.inmuebleId===pendingProperty.insertId));
  }
  const [rentalClosures]=await connection.query("SELECT id FROM inm_liberaciones WHERE inmueble_id=? AND motivo='alquilado'",[pendingProperty.insertId]);
  const contractId=rentalClosures[0].id;
  assert.equal((await request('/api/alquileres',cookies[1])).status,403);
  assert.equal((await jsonRequest('/api/alquileres',cookies[1],'PATCH',{id:contractId,fin:'2028-02-01'})).status,403);
  assert.equal((await jsonRequest('/api/alquileres',cookies[0],'PATCH',{id:contractId,fin:'2026-01-01'})).status,400);
  assert.equal((await jsonRequest('/api/alquileres',cookies[0],'PATCH',{id:contractId,fin:'2028-02-01'})).status,200);
  assert.equal((await (await request(pendingInfoUrl,cookies[0])).json()).alquiler.fechaFinAlquiler,'2028-02-01');
  assert.equal((await jsonRequest('/api/alquileres',cookies[0],'POST',{id:contractId,posicion:90})).status,409,'Active contract cannot reenter');
  await connection.execute("UPDATE inm_liberaciones SET fecha_fin_alquiler='2026-02-01' WHERE id=?",[contractId]);
  const [freePositions]=await connection.query('SELECT p.numero FROM inm_posiciones p WHERE p.activo=1 AND p.numero<=90 AND NOT EXISTS(SELECT 1 FROM inm_asignaciones_posicion a WHERE a.posicion_id=p.id AND a.activa=1) ORDER BY p.numero DESC LIMIT 1');
  assert.ok(freePositions.length);
  const returned=await jsonRequest('/api/alquileres',cookies[0],'POST',{id:contractId,posicion:freePositions[0].numero});
  assert.equal(returned.status,201);const returnedId=(await returned.json()).id;properties.push(returnedId);
  const returnedInfo=await (await request('/api/inmuebles/'+returnedId,cookies[0])).json();
  assert.equal(returnedInfo.inmueble.inmuebleOrigenId,pendingProperty.insertId);
  assert.equal(returnedInfo.inmueble.etapa,'visita_pendiente');assert.equal(returnedInfo.tasacion,null);assert.equal(returnedInfo.alquiler,null);
  assert.equal((await (await request(pendingInfoUrl,cookies[0])).json()).inmueble.estado,'inactivo');
  assert.equal((await jsonRequest('/api/alquileres',cookies[0],'POST',{id:contractId,posicion:freePositions[0].numero})).status,409,'Duplicate return blocked');
  assert.equal((await jsonRequest('/api/alquileres',cookies[0],'PATCH',{id:contractId,fin:'2029-02-01'})).status,400,'Old contract cannot renew after return');
  const realPanel=await (await request('/api/dashboard?modo=real',cookies[0])).json();const demoPanel=await (await request('/api/dashboard?modo=demo',cookies[0])).json();assert.ok(demoPanel.resumen.activos>=12);assert.ok(realPanel.resumen.activos>=1);
  assert.equal((await request('/api/dashboard?modo=bad',cookies[0])).status,400);
  assert.equal((await request('/api/seguimiento?modo=bad',cookies[0])).status,400);
  const [registerPositions]=await connection.query('SELECT p.numero FROM inm_posiciones p WHERE p.activo=1 AND p.numero<=90 AND NOT EXISTS(SELECT 1 FROM inm_asignaciones_posicion a WHERE a.posicion_id=p.id AND a.activa=1) ORDER BY p.numero DESC LIMIT 1');
  const newRegistration=await jsonRequest('/api/inmuebles',cookies[0],'POST',{posicion:registerPositions[0].numero,tipo:'Casa',operacion:'alquiler',referencia:'Nombre exclusivo del inmueble',ubicacion:'Calle de prueba',numeroDireccion:'123',distrito:'Chimbote',provincia:'Santa',departamento:'Áncash'});
  assert.equal(newRegistration.status,201);const registeredBody=await newRegistration.json();
  const [registeredRows]=await connection.query('SELECT id,propietario_id,referencia,numero_direccion,distrito FROM inm_inmuebles WHERE codigo=?',[registeredBody.codigo]);properties.push(registeredRows[0].id);
  assert.equal(registeredRows[0].propietario_id,null);assert.equal(registeredRows[0].referencia,'Nombre exclusivo del inmueble');assert.equal(registeredRows[0].numero_direccion,'123');assert.equal(registeredRows[0].distrito,'Chimbote');
  const registerBody={posicion:registerPositions[0].numero,tipo:'Casa',operacion:'venta',referencia:'Auditoría de registro',ubicacion:'Calle temporal'};
  for(const invalid of [{posicion:0},{posicion:91},{tipo:'No existe '+suffix},{referencia:'x'.repeat(256)},{dni:'123',nombres:'Temporal'},{numeroDireccion:'x'.repeat(31)}]) {
    assert.equal((await jsonRequest('/api/inmuebles',cookies[0],'POST',{...registerBody,...invalid})).status,400,'Registro inválido debe rechazarse');
  }
  assert.equal((await jsonRequest('/api/inmuebles',cookies[0],'POST',registerBody)).status,409,'No duplicar posición ocupada');
  const [salePositions]=await connection.query('SELECT p.numero FROM inm_posiciones p WHERE p.activo=1 AND p.numero<=90 AND NOT EXISTS(SELECT 1 FROM inm_asignaciones_posicion a WHERE a.posicion_id=p.id AND a.activa=1) ORDER BY p.numero DESC LIMIT 1');
  assert.ok(salePositions.length);
  const racedRegistrations=await Promise.all([1,2].map(()=>jsonRequest('/api/inmuebles',cookies[0],'POST',{...registerBody,posicion:salePositions[0].numero})));
  // Track every success before asserting, so cleanup also covers a concurrency regression.
  const saleIds=[];
  for(const response of racedRegistrations)if(response.status===201){const body=await response.json();properties.push(body.inmuebleId);saleIds.push(body.inmuebleId);}
  assert.deepEqual(racedRegistrations.map(r=>r.status).sort(),[201,409],'Captación simultánea conserva una sola asignación');
  const sale={inmuebleId:saleIds[0],motivo:'vendido',fechaVenta:'2026-01-01',precioFinal:'100000',comision:'3000'};
  for(const invalid of [{fechaVenta:'2999-01-01'},{fechaVenta:'2026-02-30'},{precioFinal:'0'},{precioFinal:'-1'},{comision:'100001'},{comision:'-1'}])assert.equal((await jsonRequest('/api/liberaciones',cookies[0],'POST',{...sale,...invalid})).status,400);
  const saleResults=await Promise.all([1,2].map(()=>jsonRequest('/api/liberaciones',cookies[0],'POST',sale)));
  assert.deepEqual(saleResults.map(r=>r.status).sort(),[201,409],'Venta simultánea genera un solo cierre');
  const saleDetails=await(await request('/api/inmuebles/'+saleIds[0],cookies[0])).json();
  assert.equal(saleDetails.inmueble.estado,'inactivo');assert.equal(Number(saleDetails.venta.precioFinal),100000);assert.equal(Number(saleDetails.venta.comision),3000);
  const [[saleAssignments]]=await connection.execute('SELECT COUNT(*) total FROM inm_asignaciones_posicion WHERE inmueble_id=? AND activa=1',[saleIds[0]]);assert.equal(saleAssignments.total,0);
  console.log('PASS: llenados inválidos, captación concurrente, venta antes de publicar, importes/fechas y cierre concurrente con liberación atómica');
  const geoEndpoint='/api/catalogo-ubicaciones';
  assert.equal((await request(geoEndpoint,cookies[1])).status,200);
  assert.equal((await jsonRequest(geoEndpoint,cookies[1],'POST',{nivel:'departamento',nombre:'No autorizado'})).status,403);
  const geoNames={departamento:'Departamento '+suffix,provincia:'Provincia '+suffix,distrito:'Distrito '+suffix};
  let parent=null;
  for(const nivel of ['departamento','provincia','distrito']) {
    const created=await jsonRequest(geoEndpoint,cookies[0],'POST',{nivel,nombre:geoNames[nivel],padreId:parent});
    assert.equal(created.status,201);parent=(await created.json()).id;managedGeography.push(parent);
  }
  const registeredUrl='/api/inmuebles/'+registeredRows[0].id;
  assert.equal((await jsonRequest(registeredUrl,cookies[0],'PUT',{...geoNames,provincia:'Santa'})).status,400);
  assert.equal((await jsonRequest(registeredUrl,cookies[0],'PUT',geoNames)).status,200);
  for(let i=0;i<3;i++) {
    const nivel=['departamento','provincia','distrito'][i];geoNames[nivel]+=' editado';
    assert.equal((await jsonRequest(geoEndpoint,cookies[0],'PATCH',{id:managedGeography[i],nombre:geoNames[nivel]})).status,200);
    assert.equal((await (await request(registeredUrl,cookies[0])).json()).inmueble[nivel],geoNames[nivel]);
    assert.equal((await jsonRequest(geoEndpoint,cookies[0],'DELETE',{id:managedGeography[i]})).status,409);
  }
  assert.equal((await jsonRequest(geoEndpoint,cookies[0],'PATCH',{id:parent,activo:false})).status,200);
  assert.equal((await jsonRequest(registeredUrl,cookies[0],'PUT',geoNames)).status,200,'Preserva ubicación inactiva ya asignada');
  assert.equal((await jsonRequest('/api/inmuebles/'+returnedId,cookies[0],'PUT',geoNames)).status,400,'No permite asignar ubicación inactiva');
  assert.equal((await jsonRequest(registeredUrl,cookies[0],'PUT',{departamento:'Áncash',provincia:'Santa',distrito:'Chimbote'})).status,200);
  for(const id of [...managedGeography].reverse())assert.equal((await jsonRequest(geoEndpoint,cookies[0],'DELETE',{id})).status,200);
  const orderedPortfolio=await (await request('/api/cartera',cookies[0])).json();
  const numbers=orderedPortfolio.inmuebles.filter(x=>x.posicion!=null).map(x=>x.posicion);
  assert.deepEqual(numbers,[...numbers].sort((a,b)=>a-b));
  console.log('PASS: catálogo geográfico, jerarquía, permisos, renombrado vinculado, desactivación y eliminación protegida; cartera por posición');
  console.log('PASS: coherencia de fechas, modos del panel, renovación y reingreso con historial conservado');
  console.log('PASS: alquiler con precios mensuales, cierre separado, ficha y filtros de reportes');
  console.log('PASS: propietario opcional/vinculado; etapas de visita y tasación; publicación sin Drive; liberación simultánea; disponibilidad compartida; catálogo dinámico y permisos; renombrado y desactivación; eliminación protegida y simultánea; evidencia opcional explícita y regularización por visita; formato/compresión; acceso privado; propietario/categoría/inmueble; vínculo a visita; edición/portada única; borrado compartido');
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
  for (const id of [...managedGeography].reverse()) await connection.execute('DELETE FROM inm_ubicaciones WHERE id=?',[id]);
  for (const typeId of managedTypes) await connection.execute('DELETE FROM inm_tipos_inmueble WHERE id=?', [typeId]);
  if(ownerId) await connection.execute('DELETE FROM inm_propietarios WHERE id=?',[ownerId]);
  if(positionId) await connection.execute('DELETE FROM inm_posiciones WHERE id=?',[positionId]);
  for(const user of users) { await connection.execute('DELETE FROM inm_security_audit WHERE actor_id=?',[user]); await connection.execute('DELETE FROM inm_sesiones WHERE usuario_id=?',[user]); await connection.execute('DELETE FROM inm_usuarios WHERE id=?',[user]); }
  await connection.end(); rmSync(temporary,{recursive:true,force:true});
}
