import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { prepareImage } from '../lib/image-files.mjs';
import { visitPhotoIds } from '../lib/visit-photos.mjs';

test('JPEG, PNG and WebP are decoded, resized and stored as static WebP', async () => {
  for (const [extension, format] of [['jpg', 'jpeg'], ['png', 'png'], ['webp', 'webp']]) {
    const input = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#c80000' } }).toFormat(format).toBuffer();
    const output = await prepareImage(`foto.${extension}`, input);
    const metadata = await sharp(output.bytes).metadata();
    assert.equal(output.contentType, 'image/webp');
    assert.equal(output.name, 'foto.webp');
    assert.equal(metadata.width, 1920);
    assert.equal(metadata.height, 960);
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.exif, undefined);
  }
});
test('renamed files, SVG, corrupt images and oversized input are rejected', async () => {
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#fff' } }).png().toBuffer();
  await assert.rejects(prepareImage('fake.jpg', png));
  await assert.rejects(prepareImage('fake.png', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>')));
  await assert.rejects(prepareImage('fake.png', Buffer.from('MZ')));
  await assert.rejects(prepareImage('empty.png', Buffer.alloc(0)));
  await assert.rejects(prepareImage('large.png', Buffer.alloc(4 * 1024 * 1024 + 1)));
});
test('visits require distinct positive photo IDs and allow at most twenty', () => {
  assert.deepEqual(visitPhotoIds([1, 2]), [1, 2]);
  for (const invalid of [undefined, [], ['1'], [0], [-1], [1, 1], [1.5], Array.from({ length: 21 }, (_, index) => index + 1)]) assert.throws(() => visitPhotoIds(invalid));
});
