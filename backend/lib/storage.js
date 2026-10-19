import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';

// Production: Vercel Blob (functions have no persistent disk).
// Local dev without a Blob token: ./uploads, served at /uploads. Refused in production.
const useBlob = () => Boolean(config.storage.blobToken);

export const usesLocalStorage = () => !useBlob() && !config.isProd;

export async function saveFile(filename, buffer, contentType) {
  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`portfolio/${filename}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 31_536_000,
      token: config.storage.blobToken,
    });
    return blob.url;
  }
  if (config.isProd) throw new HttpError(503, 'File uploads are not configured on the server yet');
  await fs.mkdir(config.storage.localDir, { recursive: true });
  await fs.writeFile(path.join(config.storage.localDir, filename), buffer, { flag: 'wx', mode: 0o644 });
  return `/uploads/${filename}`;
}

export async function deleteFile(url) {
  if (url.startsWith('/uploads/')) {
    const filename = path.basename(url);
    await fs.rm(path.join(config.storage.localDir, filename), { force: true });
    return;
  }
  // Only ever delete blobs that we created.
  if (useBlob() && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
    const { del } = await import('@vercel/blob');
    await del(url, { token: config.storage.blobToken });
  }
}
