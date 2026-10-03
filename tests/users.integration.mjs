// Uses temporary accounts only. No existing users or portfolio records are changed.
import assert from 'node:assert/strict';
import { loadEnvFile } from 'node:process';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';
import { hashPassword, hashSessionToken, verifyPassword } from '../lib/password.mjs';
try { loadEnvFile('.env.local'); } catch {}
const connection=await mysql.createConnection(process.env.DATABASE_URL);
const origin='http://127.0.0.1:3115';
const suffix=randomBytes(6).toString('hex');const password=randomBytes(4).toString('hex');
const ids=[];const accounts=[];let server;
const request=(path,cookie,options={})=>fetch(origin+path,{redirect:'manual',...options,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...options.headers}});
const mutation=(path,cookie,method,body,source=origin)=>request(path,cookie,{method,headers:{Origin:source,'Content-Type':'application/json'},body:JSON.stringify(body)});
const login=(usuario,password)=>mutation('/api/auth/login',null,'POST',{usuario,password});
const bodyFor=account=>({nombre:account.nombre,usuario:account.usuario,email:account.email,rol:account.rol,activo:true});
try {
  for(const rol of ['administrador','administrador','operador','usuario']){
    const usuario=`test_users_${accounts.length}_${suffix}`;const nombre=`Usuarios prueba ${accounts.length}`;const email=`${usuario}@example.invalid`;
    const [user]=await connection.execute('INSERT INTO inm_usuarios (nombre,email,usuario,password_hash,rol,activo) VALUES (?,?,?,?,?,1)',[nombre,email,usuario,await hashPassword(password),rol]);ids.push(user.insertId);
    const token=randomBytes(32).toString('hex');await connection.execute('INSERT INTO inm_sesiones (token_hash,usuario_id,expira) VALUES (?,?,?)',[hashSessionToken(token),user.insertId,new Date(Date.now()+20*60*1000)]);
    accounts.push({id:user.insertId,usuario,nombre,email,rol,cookie:`aa_session=${token}`});
  }
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3115','-H','127.0.0.1'],{env:{...process.env,NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});server.stdout.resume();server.stderr.resume();
  let ready=false;for(let i=0;i<100;i++){try{if((await request('/login')).status===200){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}assert.ok(ready);
  const [admin,otherAdmin,operator,legacy]=accounts;
  assert.equal((await request('/api/usuarios')).status,401);
  assert.equal((await request('/api/usuarios','aa_session='+'f'.repeat(64))).status,401);
  for(const user of [operator,legacy]){
    assert.equal((await request('/api/usuarios',user.cookie)).status,403);
    assert.equal((await mutation('/api/usuarios',user.cookie,'POST',{})).status,403);
    assert.equal((await mutation(`/api/usuarios/${user.id}`,user.cookie,'PUT',{...bodyFor(user),rol:'administrador'})).status,403,'No privilege escalation');
    const response=await request('/usuarios',user.cookie);assert.equal(response.status,307);assert.equal(new URL(response.headers.get('location'),origin).pathname,'/datos-inmuebles');
    const markup=await (await request('/datos-inmuebles',user.cookie)).text();assert.equal(markup.includes('Usuarios y accesos'),false);
  }
  assert.equal((await request('/usuarios',admin.cookie)).status,200);
  const listResponse=await request('/api/usuarios',admin.cookie);assert.equal(listResponse.status,200);assert.match(listResponse.headers.get('cache-control'),/no-store/);
  const list=(await listResponse.json()).usuarios;
  for(const user of list)assert.ok(!('passwordHash' in user)&&!('password_hash' in user)&&!('password' in user),'No passwords or hashes returned');
  const draft={nombre:'Cuenta temporal creada',usuario:`test_created_${suffix}`,email:'',rol:'operador',activo:true,password,confirmacion:password};
  for(const bad of [{...draft,password:'1234567',confirmacion:'1234567'},{...draft,confirmacion:'mismatch'},{...draft,rol:'superadmin'},{...draft,activo:'true'},{...draft,usuario:'mal usuario'}])assert.equal((await mutation('/api/usuarios',admin.cookie,'POST',bad)).status,400);
  assert.equal((await mutation('/api/usuarios',admin.cookie,'POST',draft,'https://evil.invalid')).status,403);
  const created=await mutation('/api/usuarios',admin.cookie,'POST',draft);assert.equal(created.status,201);const id=(await created.json()).id;ids.push(id);
  const [[stored]]=await connection.execute('SELECT password_hash FROM inm_usuarios WHERE id=?',[id]);assert.ok(await verifyPassword(password,stored.password_hash));assert.notEqual(stored.password_hash,password);
  assert.equal((await mutation('/api/usuarios',admin.cookie,'POST',draft)).status,409);
  const signedIn=await login(draft.usuario,password);assert.equal(signedIn.status,200);assert.equal((await signedIn.json()).redirectTo,'/datos-inmuebles');let createdCookie=signedIn.headers.get('set-cookie').split(';')[0];
  const edited={...draft,nombre:'Nombre temporal actualizado',password:'',confirmacion:''};
  assert.equal((await mutation(`/api/usuarios/${id}`,admin.cookie,'PUT',edited)).status,200);
  const [[unchanged]]=await connection.execute('SELECT password_hash FROM inm_usuarios WHERE id=?',[id]);assert.equal(unchanged.password_hash,stored.password_hash);assert.equal((await request('/api/inmuebles',createdCookie)).status,200);
  const duplicateEmail={...edited,email:admin.email};assert.equal((await mutation(`/api/usuarios/${id}`,admin.cookie,'PUT',duplicateEmail)).status,409);
  const [[rollback]]=await connection.execute('SELECT email FROM inm_usuarios WHERE id=?',[id]);assert.notEqual(rollback.email,admin.email);
  const nextPassword=randomBytes(4).toString('hex');
  assert.equal((await mutation(`/api/usuarios/${id}`,admin.cookie,'PUT',{...edited,password:nextPassword,confirmacion:nextPassword})).status,200);
  assert.equal((await request('/api/inmuebles',createdCookie)).status,401,'Password reset revokes old sessions');assert.equal((await login(draft.usuario,password)).status,401);
  const renewed=await login(draft.usuario,nextPassword);assert.equal(renewed.status,200);createdCookie=renewed.headers.get('set-cookie').split(';')[0];
  assert.equal((await mutation(`/api/usuarios/${id}`,admin.cookie,'PUT',{...edited,activo:false})).status,200);assert.equal((await request('/api/inmuebles',createdCookie)).status,401);assert.equal((await login(draft.usuario,nextPassword)).status,401);
  assert.equal((await mutation(`/api/usuarios/${id}`,admin.cookie,'PUT',{...edited,activo:true})).status,200);
  await connection.execute('UPDATE inm_usuarios SET intentos_fallidos=5,bloqueo_hasta=? WHERE id=?',[new Date(Date.now()+5*60*1000),id]);assert.equal((await login(draft.usuario,nextPassword)).status,429);
  assert.equal((await mutation(`/api/usuarios/${id}`,admin.cookie,'PUT',{...edited,desbloquear:true})).status,200);assert.equal((await login(draft.usuario,nextPassword)).status,200);
  assert.equal((await mutation(`/api/usuarios/${admin.id}`,admin.cookie,'PUT',{...bodyFor(admin),activo:false})).status,409);
  assert.equal((await mutation(`/api/usuarios/${admin.id}`,admin.cookie,'PUT',{...bodyFor(admin),rol:'operador'})).status,409);
  assert.equal((await mutation('/api/usuarios/999999999999999999999',admin.cookie,'PUT',edited)).status,400);
  assert.equal((await mutation('/api/usuarios/0',admin.cookie,'PUT',edited)).status,400);
  // A login already verifying an old password must not create a session after a reset.
  await connection.beginTransaction();await connection.execute('SELECT id FROM inm_usuarios WHERE id=? FOR UPDATE',[id]);
  let loginSettled=false;const pendingLogin=login(draft.usuario,nextPassword).then(response=>{loginSettled=true;return response;});
  await new Promise(resolve=>setTimeout(resolve,400));assert.equal(loginSettled,false,'Login waits for the locked account');
  const racePassword=randomBytes(4).toString('hex');await connection.execute('UPDATE inm_usuarios SET password_hash=? WHERE id=?',[await hashPassword(racePassword),id]);await connection.execute('DELETE FROM inm_sesiones WHERE usuario_id=?',[id]);await connection.commit();
  assert.equal((await pendingLogin).status,401,'Stale password cannot create a new session');assert.equal((await login(draft.usuario,racePassword)).status,200);
  const concurrent=await Promise.all([
    mutation(`/api/usuarios/${otherAdmin.id}`,admin.cookie,'PUT',{...bodyFor(otherAdmin),activo:false}),
    mutation(`/api/usuarios/${admin.id}`,otherAdmin.cookie,'PUT',{...bodyFor(admin),activo:false}),
  ]);const statuses=concurrent.map(response=>response.status);assert.equal(statuses.filter(status=>status===200).length,1);assert.ok(statuses.some(status=>[401,403].includes(status)),'Deactivated actor loses management permission');
  const [remaining]=await connection.execute('SELECT id FROM inm_usuarios WHERE id IN (?,?) AND activo=1',[admin.id,otherAdmin.id]);assert.equal(remaining.length,1);
  const survivor=accounts.find(account=>account.id===remaining[0].id);const selfPassword=randomBytes(4).toString('hex');
  const selfChange=await mutation(`/api/usuarios/${survivor.id}`,survivor.cookie,'PUT',{...bodyFor(survivor),password:selfPassword,confirmacion:selfPassword});assert.equal(selfChange.status,200);assert.equal((await selfChange.json()).volverAIngresar,true);assert.equal((await request('/api/usuarios',survivor.cookie)).status,401);
  console.log('PASS: gestión exclusiva del administrador, creación y edición, contraseña de 8 caracteres, duplicados, sesiones, desactivación/reactivación, desbloqueo, concurrencia, login durante reset y protección del administrador.');
}catch(error){console.error('Integración de usuarios fallida:',error.message);process.exitCode=1;}
finally{
  await connection.rollback();
  if(server){server.kill('SIGTERM');await new Promise(resolve=>{if(server.exitCode!==null)resolve();else server.once('exit',resolve);});}
  for(const id of ids){await connection.execute('DELETE FROM inm_sesiones WHERE usuario_id=?',[id]);await connection.execute('DELETE FROM inm_usuarios WHERE id=?',[id]);}
  await connection.end();
}
