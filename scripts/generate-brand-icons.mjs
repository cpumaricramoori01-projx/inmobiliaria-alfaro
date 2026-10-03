// The browser icon keeps the two red roof silhouettes from the company logo.
// Run after editing app/icon.svg to regenerate the mobile and ICO variants.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const source = await readFile(new URL('../app/icon.svg', import.meta.url));
await sharp(source).resize(180, 180).png().toFile(new URL('../app/apple-icon.png', import.meta.url).pathname);

const sizes = [16, 32, 48, 256];
const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()));
const directory = Buffer.alloc(6 + 16 * images.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(images.length, 4);
let offset = directory.length;
images.forEach((image, index) => {
  const start = 6 + index * 16;
  directory[start] = sizes[index] === 256 ? 0 : sizes[index];
  directory[start + 1] = directory[start];
  directory.writeUInt16LE(1, start + 4);
  directory.writeUInt16LE(32, start + 6);
  directory.writeUInt32LE(image.length, start + 8);
  directory.writeUInt32LE(offset, start + 12);
  offset += image.length;
});
await writeFile(new URL('../app/favicon.ico', import.meta.url), Buffer.concat([directory, ...images]));
console.log('Generated favicon.ico (16, 32, 48, 256 px) and apple-icon.png (180 px).');
