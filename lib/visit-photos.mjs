export function visitPhotoIds(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20 || value.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(value).size !== value.length) {
    throw new Error('Adjunta entre 1 y 20 fotos para registrar la visita.');
  }
  return value;
}
