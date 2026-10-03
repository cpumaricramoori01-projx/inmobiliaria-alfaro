// Creates one uniquely named temporary image in the configured hosting and deletes it.
import { loadEnvFile } from 'node:process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
try { loadEnvFile('.env.local'); } catch {}
const endpoint = new URL(process.env.DOCUMENT_HOSTING_URL);
endpoint.searchParams.set('path', `inmuebles/TEST-FOTOS-sin-posicion/foto-inmueble/${randomUUID()}-prueba.webp`);
const headers = { Authorization: `Bearer ${process.env.DOCUMENT_HOSTING_TOKEN}`, 'Content-Type': 'application/octet-stream' };
let uploaded = false;
try {
  const image = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#c80000' } }).webp().toBuffer();
  const put = await fetch(endpoint, { method: 'PUT', headers, body: image, redirect: 'error', signal: AbortSignal.timeout(15000) });
  uploaded = put.ok;
  assert.equal(put.status, 201, 'Hosting PHP must accept WebP');
  const read = await fetch(endpoint, { headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
  assert.equal(read.status, 200);
  assert.deepEqual(Buffer.from(await read.arrayBuffer()), image);
  const privateRead = await fetch(endpoint, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  assert.equal(privateRead.status, 401);
  console.log('PASS: PHP real acepta WebP, conserva su contenido y exige autorización.');
} finally {
  if (uploaded) {
    const removed = await fetch(endpoint, { method: 'DELETE', headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
    assert.equal(removed.status, 204, 'Temporary hosting image must be cleaned up');
    console.log('Imagen temporal eliminada del hosting.');
  }
}
