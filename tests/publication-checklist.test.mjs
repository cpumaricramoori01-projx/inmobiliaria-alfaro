import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationChecklist } from '../lib/publication-checklist.mjs';
const ready = { dni: '12345678', documentoDni: true, archivoTasacion: true, fotosVisita: true, texto: 'Anuncio' };
test('publication requires all five minimum requirements', () => {
  assert.equal(publicationChecklist(ready).complete, true);
  for (const [key, value] of [['dni', '123'], ['documentoDni', false], ['archivoTasacion', false], ['fotosVisita', false], ['texto', '  ']]) {
    const result = publicationChecklist({ ...ready, [key]: value });
    assert.equal(result.complete, false, key);
    assert.equal(result.missing.length, 1, key);
  }
});
