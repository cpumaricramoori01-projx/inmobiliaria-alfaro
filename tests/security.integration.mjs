// Creates isolated temporary users; never modifies pre-existing users or properties.
import assert from 'node:assert/strict';
import {loadEnvFile} from 'node:process';
import {randomBytes} from 'node:crypto';
import mysql from 'mysql2/promise';
import {readFile} from 'node:fs/promises';
import {hashPassword,hashSessionToken} from '../lib/password.mjs';
import {totp} from '../lib/mfa.mjs';
try{loadEnvFile('.env.local');}catch{}
const origin=process.env.SECURITY_TEST_ORIGIN;
if(!origin||!/^https?:\/\//.test(origin))throw new Error('Set SECURITY_TEST_ORIGIN to the deployment being verified.');
const db=await mysql.createConnection(process.env.DATABASE_URL),ids=[];
const suffix=randomBytes(6).toString('hex'),password=randomBytes(24).toString('hex');
const bypass=process.env.SECURITY_TEST_BYPASS_FILE ? (await readFile(process.env.SECURITY_TEST_BYPASS_FILE,'utf8')).trim() : undefined;
function cookie(response,name){const header=response.headers.getSetCookie().find(value=>value.startsWith(name+'='));assert.ok(header,`Expected ${name} cookie`);return header.split(';')[0];}
async function request(path,method='GET',body,session,source=origin){return fetch(origin+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:source}:{}),...(session?{Cookie:session}:{}),...(bypass?{'x-vercel-protection-bypass':bypass}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(20000)});}
try{
 for(const role of ['administrador','operador']){
  const username=`test_secure_${role}_${suffix}`;
  const [result]=await db.execute('INSERT INTO inm_usuarios (nombre,email,usuario,password_hash,rol,activo) VALUES (?,?,?,?,?,1)',['Security regression test',username+'@example.invalid',username,await hashPassword(password),role]);
  ids.push(result.insertId);
 }
 assert.equal((await request('/api/inmuebles')).status,401);
 assert.equal((await request('/api/auth/login','POST',{usuario:'invalid',password:'invalid'},undefined,'https://evil.invalid')).status,403);
 const login=await request('/api/auth/login','POST',{usuario:`test_secure_administrador_${suffix}`,password});assert.equal(login.status,200);
 const challenge=await login.json();assert.equal(challenge.mfaRequired,true);assert.equal(challenge.setup,true);assert.match(challenge.secret,/^[A-Z2-7]{32}$/);
 const challengeCookie=cookie(login,'aa_mfa');
 assert.equal((await request('/api/usuarios','GET',undefined,challengeCookie)).status,401,'Password alone cannot access administrator APIs');
 assert.equal((await request('/api/auth/mfa','POST',{code:'bad'},challengeCookie)).status,401);
 const step=Math.floor(Date.now()/30000);
 const verified=await request('/api/auth/mfa','POST',{code:totp(challenge.secret,step)},challengeCookie);assert.equal(verified.status,200);
 const adminCookie=cookie(verified,'aa_session');
 assert.equal((await request('/api/auth/mfa','POST',{code:totp(challenge.secret,step)},challengeCookie)).status,401,'MFA challenge is single use');
 assert.equal((await request('/api/usuarios','GET',undefined,adminCookie)).status,200);
 const page=await request('/datos-inmuebles','GET',undefined,adminCookie);assert.equal(page.status,200);
 assert.equal(page.headers.get('x-frame-options'),'DENY');assert.equal(page.headers.get('x-content-type-options'),'nosniff');
 const csp=page.headers.get('content-security-policy');assert.ok(csp?.includes("frame-ancestors 'none'"));assert.ok(csp?.includes("'strict-dynamic'"));
 const nonce=csp.match(/'nonce-([^']+)'/)[1];const html=await page.text();
 assert.ok(html.includes(`nonce="${nonce}"`),'Next.js renders scripts with the response CSP nonce');
 const operator=await request('/api/auth/login','POST',{usuario:`test_secure_operador_${suffix}`,password});assert.equal(operator.status,200);const operatorCookie=cookie(operator,'aa_session');
 assert.equal((await request('/api/inmuebles','GET',undefined,operatorCookie)).status,200);
 assert.equal((await request('/api/usuarios','GET',undefined,operatorCookie)).status,403);
 assert.equal((await request('/api/inmuebles/7/archivos?archivoId=31','DELETE',undefined,operatorCookie)).status,403,'Operator cannot delete any document');
 const managed={nombre:'Security managed test',usuario:'test_managed_'+suffix,email:'test_managed_'+suffix+'@example.invalid',rol:'operador',activo:true,password,confirmacion:password};
 const created=await request('/api/usuarios','POST',managed,adminCookie);assert.equal(created.status,201);ids.push((await created.json()).id);
 const hash=hashSessionToken(adminCookie.split('=')[1]);
 await db.execute('UPDATE inm_sesiones SET authenticated_at=? WHERE token_hash=?',[new Date(Date.now()-6*60*1000),hash]);
 const update={...managed,password:'',confirmacion:'',nombre:'Security updated test'};
 assert.equal((await request(`/api/usuarios/${ids[2]}`,'PUT',update,adminCookie)).status,428,'Sensitive mutations require recent authentication');
 assert.equal((await request('/api/auth/reauth','POST',{password:'incorrect',code:'000000'},adminCookie)).status,401);
 const reauth=await request('/api/auth/reauth','POST',{password,code:totp(challenge.secret,step+1)},adminCookie);assert.equal(reauth.status,200);
 assert.equal((await request(`/api/usuarios/${ids[2]}`,'PUT',update,adminCookie)).status,200);
 const [[stored]]=await db.execute('SELECT mfa_secret FROM inm_usuarios WHERE id=?',[ids[0]]);assert.notEqual(stored.mfa_secret,challenge.secret);
 const [events]=await db.execute('SELECT action FROM inm_security_audit WHERE actor_id=?',[ids[0]]);
 for(const action of ['mfa.enroll','login','reauth','user.create','user.update'])assert.ok(events.some(event=>event.action===action),`Audit event: ${action}`);
 await db.execute('UPDATE inm_sesiones SET last_seen=? WHERE token_hash=?',[new Date(Date.now()-31*60*1000),hash]);
 assert.equal((await request('/api/usuarios','GET',undefined,adminCookie)).status,401,'Inactive sessions expire');
 const unknown='test_limit_'+suffix;
 for(let n=0;n<16;n++){
  const response=await request('/api/auth/login','POST',{usuario:unknown,password});
  assert.equal(response.status,n<15?401:429,'Rate limit applies to nonexistent usernames');
 }
 console.log('PASS: MFA enrollment and login, replay rejection, encrypted secrets, role restrictions, reauthentication, idle expiration, audit events, CSP nonce and persistent login limiting.');
}finally{
 for(const id of ids){await db.execute('DELETE FROM inm_auth_challenges WHERE user_id=?',[id]);await db.execute('DELETE FROM inm_sesiones WHERE usuario_id=?',[id]);await db.execute('DELETE FROM inm_security_audit WHERE actor_id=?',[id]);await db.execute('DELETE FROM inm_usuarios WHERE id=?',[id]);}
 await db.end();
}
