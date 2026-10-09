export function visitPhotoIds(value, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && value.length < 1) || value.length > 20 || value.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(value).size !== value.length) {
    throw new Error('Adjunta entre 1 y 20 fotos para registrar la visita.');
  }
  return value;
}
