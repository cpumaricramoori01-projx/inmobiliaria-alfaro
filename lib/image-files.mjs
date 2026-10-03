import sharp from 'sharp';

export const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
export async function prepareImage(name, bytes) {
  const extension = String(name).split('.').pop().toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) throw new Error('Selecciona una imagen JPG, PNG o WebP.');
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new Error('La imagen debe pesar como máximo 4 MB.');
  try {
    const image = sharp(bytes, { limitInputPixels: 40000000, failOn: 'error' });
    const metadata = await image.metadata();
    const expected = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' };
    if (metadata.format !== expected[extension] || !metadata.width || !metadata.height || (metadata.pages || 1) > 1) throw new Error('Formato inválido.');
    const output = await image.rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    if (output.length > 4 * 1024 * 1024) throw new Error('Imagen demasiado grande.');
    return { bytes: output, contentType: 'image/webp', name: String(name).replace(/\.[^.]+$/, '') + '.webp' };
  } catch { throw new Error('La imagen está dañada, tiene un formato incorrecto o supera las dimensiones permitidas.'); }
}
