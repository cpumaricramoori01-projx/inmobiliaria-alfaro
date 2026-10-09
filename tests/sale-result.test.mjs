import test from 'node:test';
import assert from 'node:assert/strict';
import { saleResult } from '../lib/sale-result.mjs';
const now = new Date('2026-10-04T18:00:00Z');
const sale = { fechaVenta: '2026-10-03', precioFinal: '300000', comision: '9000' };
test('sale records final price and commission independently of listing price', () => {
  assert.equal(saleResult(sale, now).precioFinal, '300000.00');
  assert.equal(saleResult(sale, now).comision, '9000.00');
  for (const comision of ['0', '0.0', '0.00']) assert.equal(saleResult({ ...sale, comision }, now).comision, '0.00');
  assert.throws(() => saleResult({ ...sale, precioFinal: '9999999999999.98', comision: '9999999999999.99' }, now));
});
test('sale rejects missing fields, impossible and future dates and invalid amounts', () => {
  for (const patch of [{ comision: '' }, { precioFinal: '0' }, { comision: '-1' }, { comision: '300001' }, { fechaVenta: '2026-02-30' }, { fechaVenta: '2026-10-05' }]) assert.throws(() => saleResult({ ...sale, ...patch }, now));
});
