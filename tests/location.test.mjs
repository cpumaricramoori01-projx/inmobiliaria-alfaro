import test from 'node:test';
import assert from 'node:assert/strict';
import { locationPoint, parseGoogleMapsLocation, allowedGoogleMapsUrl, googleMapsUrl } from '../lib/location.mjs';
import { propertyInput } from '../lib/property-input.mjs';

test('coordinates allow zero and signed decimals, reject incomplete or invalid locations', () => {
  assert.deepEqual(locationPoint('0', 0), { lat: 0, lng: 0 });
  assert.deepEqual(locationPoint('-90', '180'), { lat: -90, lng: 180 });
  for (const pair of [[null, 0], ['', 0], [true, 0], [[], 0], ['NaN', 0], [Infinity, 0], [91, 0], [0, -181]]) assert.equal(locationPoint(...pair), null);
  assert.deepEqual(propertyInput({ latitud: '-9.105', longitud: '-78.558' }), { latitud: '-9.1050000', longitud: '-78.5580000' });
  assert.deepEqual(propertyInput({ latitud: '', longitud: null }), { latitud: null, longitud: null });
  assert.deepEqual(propertyInput({ direccion: 'Calle 1' }), { direccion: 'Calle 1' });
  for (const body of [{ latitud: 0 }, { longitud: 0 }, { latitud: null, longitud: 0 }, { latitud: 100, longitud: 0 }]) assert.throws(() => propertyInput(body));
});
test('Google links prefer the selected place over the camera and label camera-only links approximate', () => {
  assert.deepEqual(parseGoogleMapsLocation('https://www.google.com/maps/place/Casa/@-9.1,-78.5,17z/data=!3d-9.074!4d-78.589'), { lat: -9.074, lng: -78.589, approximate: false });
  assert.deepEqual(parseGoogleMapsLocation('https://www.google.com/maps/@-9.1,-78.5,17z'), { lat: -9.1, lng: -78.5, approximate: true });
  assert.deepEqual(parseGoogleMapsLocation('https://maps.google.com/?q=-9.074,-78.589'), { lat: -9.074, lng: -78.589, approximate: false });
  assert.equal(parseGoogleMapsLocation('https://maps.app.goo.gl/example'), null);
  assert.equal(parseGoogleMapsLocation('https://www.google.com/maps?q=100,200'), null);
});
test('only trusted HTTPS map hosts can be resolved; navigation uses explicit destination', () => {
  for (const url of ['http://maps.google.com/?q=0,0', 'https://google.com.evil.test/maps?q=0,0', 'https://127.0.0.1/maps', 'https://maps.app.goo.gl:8080/a', 'https://user:password@maps.app.goo.gl/a', 'https://www.google.com/search?q=test']) assert.equal(allowedGoogleMapsUrl(url), false);
  assert.ok(allowedGoogleMapsUrl('https://maps.app.goo.gl/abcdef'));
  const url = new URL(googleMapsUrl({ lat: -9, lng: -78 }, true));
  assert.equal(url.searchParams.get('destination'), '-9,-78');
  assert.equal(url.searchParams.get('api'), '1');
});
