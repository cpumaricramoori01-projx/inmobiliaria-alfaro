import 'server-only';
import { createHash } from 'node:crypto';
import { pool } from '@/lib/db';
export async function limited(key: string, maximum: number, seconds: number) {
  if(key.startsWith('global:')) {
    await pool.execute('DELETE FROM inm_auth_limits WHERE expires<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 DAY) LIMIT 100');
    await pool.execute('DELETE FROM inm_auth_challenges WHERE expires<CURRENT_TIMESTAMP LIMIT 100');
  }
  const digest = createHash('sha256').update(key).digest('hex');
  // MySQL serializes concurrent increments on this primary key across instances.
  await pool.execute(`INSERT INTO inm_auth_limits (bucket_key,hits,expires) VALUES (?,1,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND))
    ON DUPLICATE KEY UPDATE hits=IF(expires<=UTC_TIMESTAMP(),1,hits+1), expires=IF(expires<=UTC_TIMESTAMP(),DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND),expires)`,[digest,seconds,seconds]);
  const [rows] = await pool.execute('SELECT hits FROM inm_auth_limits WHERE bucket_key=?',[digest]);
  return (rows as {hits:number}[])[0].hits > maximum;
}
export async function authLimited(request: Request, scope: string, account = '') {
  const ip = process.env.VERCEL ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown' : 'local';
  const checks = await Promise.all([limited('global:'+scope,300,60),limited('ip:'+scope+':'+ip,30,900),...(account ? [limited('account:'+scope+':'+account,15,900)] : [])]);
  return checks.some(Boolean);
}
