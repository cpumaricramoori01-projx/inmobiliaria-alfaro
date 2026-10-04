import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function newSecret() {
  const bytes=randomBytes(20); let bits=0,value=0,out='';
  for(const byte of bytes) { value=(value<<8)|byte;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5;} }
  return out;
}
function decode(secret) {
  let value=0,bits=0;const bytes=[];
  for(const c of secret) { const i=alphabet.indexOf(c);if(i<0)throw new Error('Invalid MFA secret');value=(value<<5)|i;bits+=5;if(bits>=8){bytes.push((value>>>(bits-8))&255);bits-=8;} }
  return Buffer.from(bytes);
}
export function totp(secret, step) {
  const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(step));
  const digest=createHmac('sha1',decode(secret)).update(counter).digest();const offset=digest[19]&15;
  return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
}
export function validStep(secret,code,lastStep=-1,now=Date.now()) {
  if(typeof code!=='string'||!/^\d{6}$/.test(code))return null;
  const current=Math.floor(now/30000);
  for(const step of [current,current-1,current+1]) {
    if(step>lastStep && timingSafeEqual(Buffer.from(totp(secret,step)),Buffer.from(code)))return step;
  }
  return null;
}
function key(){const value=process.env.AUTH_MFA_KEY;if(!value||!/^[a-f0-9]{64}$/.test(value))throw new Error('MFA encryption key missing');return Buffer.from(value,'hex');}
export function encryptSecret(secret) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);
  return Buffer.concat([iv,cipher.update(secret,'utf8'),cipher.final(),cipher.getAuthTag()]).toString('base64');
}
export function decryptSecret(value) {
  const bytes=Buffer.from(value,'base64'),cipher=createDecipheriv('aes-256-gcm',key(),bytes.subarray(0,12));
  cipher.setAuthTag(bytes.subarray(-16));return Buffer.concat([cipher.update(bytes.subarray(12,-16)),cipher.final()]).toString('utf8');
}
