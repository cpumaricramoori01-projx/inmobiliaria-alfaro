import { parseBusinessDate } from './calendar.mjs';
import { parsePrice } from './prices.mjs';
export function saleResult(body, now) {
  const fechaVenta = parseBusinessDate(body.fechaVenta, now);
  const precioFinal = parsePrice(body.precioFinal);
  const comision = /^0{1,13}(\.0{1,2})?$/.test(String(body.comision ?? '').trim()) ? '0.00' : parsePrice(body.comision);
  const cents = value => BigInt(value.replace('.', ''));
  if (!fechaVenta || !precioFinal || !comision || cents(comision) > cents(precioFinal)) {
    throw new Error('Indica una fecha de venta válida no futura, precio final mayor que cero y comisión entre cero y el precio final.');
  }
  return { fechaVenta, precioFinal, comision };
}
