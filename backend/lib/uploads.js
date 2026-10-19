import crypto from 'node:crypto';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { HttpError } from '../middleware/errors.js';
import { saveFile } from './storage.js';

const MAX_SVG_BYTES = 1024 * 1024;
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

const SVG_START = /^(?:﻿)?\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i;
// Scripts, entity tricks, embedded HTML, and any non-fragment href (external/file fetches).
const SVG_FORBIDDEN = /<!ENTITY|<script|<foreignObject|<iframe|\son[a-z]+\s*=|(?:xlink:)?href\s*=\s*["'](?!#)/i;

function looksLikeSvg(buffer) {
  return SVG_START.test(buffer.subarray(0, 4096).toString('utf8'));
}

const safeName = (name) =>
  path
    .basename(String(name || 'file'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, 120) || 'file';

// Validates by content (magic bytes), never by the client-supplied name or MIME type.
// Raster images and SVGs are re-encoded, which strips metadata (EXIF/GPS), neutralises
// polyglot files, and removes any active content. Only PDFs are stored as-is.
export async function processUpload(buffer, originalName) {
  // Loaded on demand: keeps cold starts fast for the (far more common) non-upload requests.
  const { default: sharp } = await import('sharp');
  const detected = await fileTypeFromBuffer(buffer);
  const id = crypto.randomBytes(16).toString('hex');
  let out;
  let mime;
  let ext;
  let width = null;
  let height = null;

  if (detected?.mime === 'application/pdf') {
    out = buffer;
    mime = 'application/pdf';
    ext = 'pdf';
  } else if (detected && IMAGE_MIMES.has(detected.mime)) {
    ({ out, width, height } = await reencode(sharp(buffer, { limitInputPixels: 40e6, failOn: 'error' }), 'webp'));
    mime = 'image/webp';
    ext = 'webp';
  } else if (!detected && looksLikeSvg(buffer)) {
    if (buffer.length > MAX_SVG_BYTES) throw new HttpError(413, 'SVG is too large (max 1 MB)');
    if (SVG_FORBIDDEN.test(buffer.toString('utf8'))) throw new HttpError(400, 'SVG contains forbidden content');
    const pipeline = sharp(buffer, { density: 300, limitInputPixels: 25e6, failOn: 'error' });
    ({ out, width, height } = await reencode(pipeline, 'png', 512));
    mime = 'image/png';
    ext = 'png';
  } else {
    throw new HttpError(415, 'Unsupported file type. Use JPG, PNG, WebP, GIF, AVIF, SVG, or PDF.');
  }

  const url = await saveFile(`${id}.${ext}`, out, mime);
  return { url, originalName: safeName(originalName), mime, size: out.length, width, height };
}

async function reencode(pipeline, format, maxSide = 2400) {
  try {
    const resized = pipeline.rotate().resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: format !== 'png' });
    const encoded = format === 'png' ? resized.png() : resized.webp({ quality: 85 });
    const { data, info } = await encoded.toBuffer({ resolveWithObject: true });
    return { out: data, width: info.width, height: info.height };
  } catch {
    throw new HttpError(400, 'Could not read this image. It may be corrupt.');
  }
}
