import assert from 'node:assert/strict';
import { loadEnvFile } from 'node:process';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';
// Set PLAYWRIGHT_MODULE_PATH when Playwright is installed outside this project.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
import { hashSessionToken } from '../lib/password.mjs';
loadEnvFile('.env.local');
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const origin = 'http://127.0.0.1:3113';
const suffix = randomBytes(6).toString('hex');
const code = `TEST-MAP-${suffix}`;
const token = randomBytes(32).toString('hex');
let userId, propertyId, app, browser;
const request = (path, options = {}) => fetch(origin + path, { ...options, headers: { Cookie: `aa_session=${token}`, Origin: origin, ...options.headers } });
try {
  const [user] = await connection.execute('INSERT INTO inm_usuarios (nombre,email,usuario,rol,activo) VALUES (?,?,?,?,1)', ['Prueba de mapa', `map-${suffix}@example.invalid`, `map_${suffix}`, 'operador']); userId = user.insertId;
  await connection.execute('INSERT INTO inm_sesiones (token_hash,usuario_id,expira) VALUES (?,?,?)', [hashSessionToken(token), userId, new Date(Date.now()+20*60*1000)]);
  const [property] = await connection.execute("INSERT INTO inm_inmuebles (codigo,tipo,referencia,direccion,distrito,provincia,departamento,estado,etapa) VALUES (?, 'casa', 'Casa de ejemplo · ubicación de demostración', 'Avenida José Pardo', 'Chimbote', 'Santa', 'Áncash', 'activo','visita_pendiente')", [code]); propertyId = property.insertId;
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-p','3113','-H','127.0.0.1'], { env:{...process.env,NODE_ENV:'production'}, stdio:['ignore','pipe','pipe'] }); app.stdout.resume(); app.stderr.resume();
  let ready = false;
  for (let i=0;i<120;i++) { try { if((await fetch(origin+'/login')).status===200) {ready=true;break;} } catch {} await new Promise(resolve=>setTimeout(resolve,250)); }
  assert.ok(ready,'App server ready');
  assert.equal((await fetch(origin+'/api/ubicaciones',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'})).status,401,'Anonymous resolver access rejected');
  const resolve = (enlace, requestOrigin=origin) => request('/api/ubicaciones',{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json'},body:JSON.stringify({enlace})});
  assert.equal((await resolve('https://127.0.0.1/maps')).status,400,'Unsafe resolver host rejected');
  assert.equal((await resolve('https://maps.google.com/?q=0,0','https://evil.invalid')).status,403,'Cross-origin requests rejected');
  const direct = await resolve('https://www.google.com/maps/place/Casa/@-9.1,-78.5,17z/data=!3d-9.074!4d-78.589'); assert.equal(direct.status,200); assert.equal((await direct.json()).lat,-9.074);
  const invalid = await request(`/api/inmuebles/${code}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({latitud:91,longitud:0})}); assert.equal(invalid.status,400);
  browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  const context = await browser.newContext({ viewport:{width:1440,height:1000},geolocation:{latitude:-9.074,longitude:-78.589,accuracy:12},permissions:['geolocation'] });
  await context.addCookies([{name:'aa_session',value:token,url:origin,httpOnly:true,sameSite:'Lax'}]);
  const page=await context.newPage();
  // Simulate a restrictive document policy: tile images must explicitly send
  // the real application origin without disclosing the property page path.
  await page.route('**/datos-inmuebles?*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'referrer-policy': 'no-referrer' } });
  });
  const tileReferrers = [];
  const tileResponses = [];
  page.on('request', req => { if (req.url().startsWith('https://tile.openstreetmap.org/')) tileReferrers.push(req.allHeaders().then(headers => headers.referer)); });
  page.on('response', res => { if (res.url().startsWith('https://tile.openstreetmap.org/')) tileResponses.push(res.status()); });
 const pageErrors=[]; page.on('pageerror',error=>pageErrors.push(error.message));
  await page.route('**/api/inmuebles',route=>route.fulfill({json:{inmuebles:[{id:code,posicion:1,nombre:'Casa de ejemplo · ubicación de demostración',tipo:'Casa',ubicacion:'Chimbote, Santa, Áncash',propietario:'Sin propietario',estado:'activo'}]}}));
  await page.goto(`${origin}/datos-inmuebles?codigo=${code}`,{waitUntil:'networkidle'});
  await page.getByText('Todavía no se ha marcado este inmueble').waitFor();
  await page.getByRole('button',{name:'Inmueble',exact:true}).click();
  await page.locator('.leaflet-container').waitFor();
  await page.getByRole('button',{name:'Marcar centro del mapa',exact:true}).waitFor();
  await page.locator('.leaflet-container').click({position:{x:150,y:140}});
  await page.getByText('Punto seleccionado. Guarda los cambios para conservarlo.',{exact:true}).waitFor();
  await page.locator('.leaflet-marker-draggable').waitFor();
  const beforeDrag = await page.locator('section[aria-label="Ubicación en el mapa"] p.font-mono').textContent();
  const pin = await page.locator('.leaflet-marker-icon').boundingBox();
  assert.ok(pin,'First click creates a marker on an initially empty map');
  await page.mouse.move(pin.x+16,pin.y+16); await page.mouse.down(); await page.mouse.move(pin.x+60,pin.y+35,{steps:12}); await page.mouse.up();
  assert.ok(await page.getByRole('button',{name:'Guardar cambios',exact:true}).isEnabled(),'Dragging keeps location editable');
  assert.notEqual(await page.locator('section[aria-label="Ubicación en el mapa"] p.font-mono').textContent(),beforeDrag,'Dragging changes coordinates');
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  await page.getByText('Cambios guardados correctamente.').waitFor();
  let saved=(await (await request(`/api/inmuebles/${code}`)).json()).inmueble;
  assert.ok(saved.latitud&&saved.longitud,'Map selection persisted');
  await page.getByRole('button',{name:'Usar mi ubicación actual',exact:true}).click();
  await page.getByText(/precisión aproximada de 12 m/).waitFor();
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  await page.getByText('Cambios guardados correctamente.').waitFor();
  saved=(await (await request(`/api/inmuebles/${code}`)).json()).inmueble; assert.equal(Number(saved.latitud),-9.074);assert.equal(Number(saved.longitud),-78.589);
  await page.getByRole('button',{name:'Quitar ubicación',exact:true}).click();
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  await page.getByText('Cambios guardados correctamente.').waitFor();
  saved=(await (await request(`/api/inmuebles/${code}`)).json()).inmueble;assert.equal(saved.latitud,null);assert.equal(saved.longitud,null);
  await page.locator('.leaflet-container').click({position:{x:150,y:140}});
  await page.locator('.leaflet-marker-draggable').waitFor();
  await page.getByText('Punto seleccionado. Guarda los cambios para conservarlo.',{exact:true}).waitFor();
  await page.getByPlaceholder('https://maps.app.goo.gl/…').fill('https://maps.google.com/?q=-9.074,-78.589');
  await page.getByRole('button',{name:'Importar ubicación del enlace',exact:true}).click();
  await page.getByText('Ubicación importada. Revisa el marcador y guarda los cambios.').waitFor();
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  await page.getByText('Cambios guardados correctamente.').waitFor();
  const mapSection=page.locator('section[aria-label="Ubicación en el mapa"]');
  await page.locator('.leaflet-tile-loaded').first().waitFor({timeout:20000});
  const referrers = await Promise.all(tileReferrers);
  assert.ok(referrers.length > 0, 'Map imagery requests observed');
  assert.ok(referrers.every(value => value === origin + '/'), 'Tiles identify the actual application origin despite restrictive document policy');
  assert.ok(tileResponses.length > 0 && tileResponses.every(status => status === 200 || status === 304), 'Map imagery succeeds without HTTP 403');
  await mapSection.screenshot({path:'output/location/editor-escritorio.png'});
  for(const width of [320,390,768,1024,1280,1536]) {
    await page.setViewportSize({width,height:900}); await page.waitForTimeout(350);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`No horizontal page overflow at ${width}px`);
    if(width===390) await mapSection.screenshot({path:'output/location/editor-celular.png'});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Resumen',exact:true}).click();
  await page.getByText('Ubicación registrada',{exact:true}).waitFor();
  await page.locator('.leaflet-tile-loaded').first().waitFor();
  await mapSection.screenshot({path:'output/location/mapa-guardado.png'});
  const directions=page.getByRole('link',{name:'Cómo llegar ↗',exact:true});assert.match(await directions.getAttribute('href'),/destination=-9.074%2C-78.589/);
  const blockedContext=await browser.newContext({viewport:{width:1440,height:1000}});
  await blockedContext.addCookies([{name:'aa_session',value:token,url:origin,httpOnly:true,sameSite:'Lax'}]);
  const blockedPage=await blockedContext.newPage();
  await blockedPage.route('**/api/inmuebles',route=>route.fulfill({json:{inmuebles:[]}}));
  await blockedPage.route('https://tile.openstreetmap.org/**', route => route.fulfill({status:403,contentType:'text/plain',body:'Forbidden'}));
  await blockedPage.goto(`${origin}/datos-inmuebles?codigo=${code}`,{waitUntil:'networkidle'});
  await blockedPage.getByRole('button',{name:'Inmueble',exact:true}).click();
  await blockedPage.getByText('No se pudieron cargar las imágenes del mapa. Reintenta o utiliza el enlace de Google Maps.',{exact:true}).waitFor();
  await blockedPage.unroute('https://tile.openstreetmap.org/**');
  await blockedPage.getByRole('button',{name:'Reintentar mapa',exact:true}).click();
  await blockedPage.locator('.leaflet-tile-loaded').first().waitFor({timeout:20000});
  await blockedPage.getByRole('button',{name:'Reintentar mapa',exact:true}).waitFor({state:'hidden'});
  await blockedContext.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await mobile.addCookies([{name:'aa_session',value:token,url:origin,httpOnly:true,sameSite:'Lax'}]);
  const mobilePage=await mobile.newPage();
  await mobilePage.route('**/api/inmuebles',route=>route.fulfill({json:{inmuebles:[]}}));
  await mobilePage.goto(`${origin}/datos-inmuebles?codigo=${code}`,{waitUntil:'networkidle'});
  await mobilePage.getByRole('button',{name:'Inmueble',exact:true}).click();
  await mobilePage.getByRole('button',{name:'Quitar ubicación',exact:true}).click();
  await mobilePage.locator('.leaflet-container').scrollIntoViewIfNeeded();
  const mobileMap=await mobilePage.locator('.leaflet-container').boundingBox();
  await mobilePage.touchscreen.tap(mobileMap.x+100,mobileMap.y+100);
  await mobilePage.getByText('Punto seleccionado. Guarda los cambios para conservarlo.',{exact:true}).waitFor();
  await mobilePage.locator('.leaflet-marker-draggable').waitFor();
  await mobile.close();
  assert.deepEqual(pageErrors,[],'No browser errors');
  console.log('Verificado: autenticación, permisos de operador, validación, primer clic, arrastre, toque en celular, GPS, importación, guardado, eliminación, enlaces y seis tamaños de pantalla. Capturas generadas.');
} catch(error) { console.error('Verificación del mapa fallida:',error.message); process.exitCode=1; }
finally {
  await browser?.close();
  if(app) {app.kill('SIGTERM');await new Promise(resolve=>{if(app.exitCode!==null)resolve();else app.once('exit',resolve);});}
  if(propertyId) await connection.execute('DELETE FROM inm_inmuebles WHERE id=?',[propertyId]);
  if(userId){await connection.execute('DELETE FROM inm_sesiones WHERE usuario_id=?',[userId]);await connection.execute('DELETE FROM inm_usuarios WHERE id=?',[userId]);}
  await connection.end();
}
