import { loadEnvFile } from 'node:process';
import mysql from 'mysql2/promise';
try {loadEnvFile('.env.local');} catch {}
const db=await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [[{database}]]=await db.query('SELECT DATABASE() AS `database`');
  for(const [table,column,definition] of [
    ['inm_usuarios','mfa_secret','VARCHAR(255) NULL'],
    ['inm_usuarios','mfa_last_step','BIGINT NULL'],
    ['inm_sesiones','last_seen','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'],
    ['inm_sesiones','authenticated_at','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ]) {
    const [rows]=await db.execute('SELECT 1 FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=?',[database,table,column]);
    if(!rows.length)await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
  await db.query(`CREATE TABLE IF NOT EXISTS inm_auth_limits (bucket_key VARCHAR(64) PRIMARY KEY,hits INT UNSIGNED NOT NULL,expires DATETIME NOT NULL,INDEX (expires))`);
  await db.query(`CREATE TABLE IF NOT EXISTS inm_security_audit (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,actor_id BIGINT UNSIGNED NULL,action VARCHAR(60) NOT NULL,resource VARCHAR(120) NOT NULL,outcome VARCHAR(20) NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX (created_at))`);
  await db.query(`CREATE TABLE IF NOT EXISTS inm_auth_challenges (token_hash VARCHAR(64) PRIMARY KEY,user_id BIGINT UNSIGNED NOT NULL,password_hash VARCHAR(255) NOT NULL,secret VARCHAR(255) NULL,expires TIMESTAMP NOT NULL,INDEX (expires),FOREIGN KEY (user_id) REFERENCES inm_usuarios(id))`);
  console.log('Security schema installed without deleting existing records.');
} finally {await db.end();}
