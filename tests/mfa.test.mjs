import test from 'node:test';
import assert from 'node:assert/strict';
import {newSecret,totp,validStep,encryptSecret,decryptSecret} from '../lib/mfa.mjs';
test('TOTP matches RFC 6238 SHA1 vectors truncated to six digits',()=>{
 const secret='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
 for(const [time,code] of [[59,'287082'],[1111111109,'081804'],[1111111111,'050471'],[1234567890,'005924'],[2000000000,'279037'],[20000000000,'353130']])assert.equal(totp(secret,Math.floor(time/30)),code);
});
test('TOTP rejects malformed, old and replayed codes',()=>{
 const secret=newSecret(),step=10000,now=step*30000,code=totp(secret,step);
 assert.equal(validStep(secret,code,-1,now),step);
 assert.equal(validStep(secret,code,step,now),null);
 assert.equal(validStep(secret,totp(secret,step-2),-1,now),null);
 assert.equal(validStep(secret,'123',-1,now),null);
});
test('MFA secrets use authenticated encryption and fail on corruption',()=>{
 const previous=process.env.AUTH_MFA_KEY;
 try{process.env.AUTH_MFA_KEY='a'.repeat(64);const secret=newSecret(),encrypted=encryptSecret(secret);
 assert.equal(decryptSecret(encrypted),secret);assert.notEqual(encryptSecret(secret),encrypted);
 const altered=Buffer.from(encrypted,'base64');altered[15]^=1;assert.throws(()=>decryptSecret(altered.toString('base64')));
 process.env.AUTH_MFA_KEY='b'.repeat(64);assert.throws(()=>decryptSecret(encrypted));
 }finally{if(previous===undefined)delete process.env.AUTH_MFA_KEY;else process.env.AUTH_MFA_KEY=previous;}
});
