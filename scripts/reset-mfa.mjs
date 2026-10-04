import {loadEnvFile} from 'node:process';
import mysql from 'mysql2/promise';
try{loadEnvFile('.env.local');}catch{}
const user=process.argv[2];
if(!user||!/^[a-z0-9._-]{1,60}$/.test(user))throw new Error('Usage: node scripts/reset-mfa.mjs USERNAME');
const db=await mysql.createConnection(process.env.DATABASE_URL);
try{
 await db.beginTransaction();
 const [[account]]=await db.execute('SELECT id FROM inm_usuarios WHERE usuario=? FOR UPDATE',[user]);
 if(!account)throw new Error('Account not found');
 await db.execute('UPDATE inm_usuarios SET mfa_secret=NULL,mfa_last_step=NULL WHERE id=?',[account.id]);
 await db.execute('DELETE FROM inm_sesiones WHERE usuario_id=?',[account.id]);
 await db.execute('DELETE FROM inm_auth_challenges WHERE user_id=?',[account.id]);
 await db.execute("INSERT INTO inm_security_audit (actor_id,action,resource,outcome) VALUES (NULL,'mfa.reset',?,'success')",['user:'+account.id]);
 await db.commit();console.log('MFA reset. The account must verify its password and enroll again.');
}catch(error){await db.rollback();throw error;}finally{await db.end();}
