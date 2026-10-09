import test from 'node:test';
import assert from 'node:assert/strict';
import { rentalResult } from '../lib/rental-result.mjs';
import { operation, priceLabel } from '../lib/operation.mjs';
const now = new Date('2026-10-06T18:00:00Z');
const base = {fechaAlquiler:'2026-10-06',rentaMensual:'1500.50'};
test('operation defaults to sale and validates supported choices',()=>{
 assert.equal(operation(),'venta'); assert.equal(operation('alquiler'),'alquiler'); assert.throws(()=>operation('otro')); assert.equal(priceLabel('alquiler'),'Renta mensual');
});
test('rental captures monthly price and optional contract amounts',()=>{
 const result=rentalResult({...base,comision:'2000',garantia:'0',fechaInicioAlquiler:'2026-11-01',fechaFinAlquiler:'2027-11-01'},now);
 assert.equal(result.rentaMensual,'1500.50');assert.equal(result.comision,'2000.00');assert.equal(result.garantia,'0.00');assert.equal(result.adelanto,null);assert.equal(result.fechaInicioAlquiler,'2026-11-01');
 assert.equal(rentalResult({...base,comision:''},now).comision,'0.00');
});
test('invalid dates, nonpositive rent and negative amounts are rejected',()=>{
 for(const values of [{fechaAlquiler:'2026-10-07'},{fechaAlquiler:'2026-02-30'},{rentaMensual:'0'},{rentaMensual:'-1'},{garantia:'-1'},{comision:'1.999'},{fechaInicioAlquiler:'2026-11-02',fechaFinAlquiler:'2026-11-01'}])assert.throws(()=>rentalResult({...base,...values},now));
});
