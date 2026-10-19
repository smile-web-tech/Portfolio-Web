import { z } from 'zod';

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

// Plain text: trimmed, no control characters (newlines allowed when multiline).
export const text = (max, { min = 1, multiline = false } = {}) =>
  z
    .string()
    .trim()
    .min(min, min > 0 ? 'Required' : undefined)
    .max(max, `Max ${max} characters`)
    .refine((v) => (multiline ? !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v) : !CONTROL_CHARS.test(v)), 'Invalid characters');

export const optionalText = (max, opts) =>
  z
    .union([text(max, { ...opts, min: 0 }), z.null()])
    .optional()
    .transform((v) => (v ? v : null));

function parseUrl(value, protocols) {
  if (CONTROL_CHARS.test(value) || /\s/.test(value)) return false;
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// External links: http(s) only. Blocks javascript:, data:, file: and friends.
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => parseUrl(v, ['http:', 'https:']), 'Must be a valid http(s) URL');

export const optionalHttpUrl = z
  .union([httpUrl, z.literal(''), z.null()])
  .optional()
  .transform((v) => v || null);

// Local static asset paths served by the portfolio site or the uploads dir.
const LOCAL_ASSET = /^\/(uploads|pictures|icons|files|app)\/[A-Za-z0-9_\-. ()%]+(\/[A-Za-z0-9_\-. ()%]+)*$/;

// Image/file reference: uploaded/static path or https URL.
export const assetRef = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => (LOCAL_ASSET.test(v) && !v.includes('..')) || parseUrl(v, ['https:']),
    'Must be an uploaded file, a /pictures path, or an https URL',
  );

export const optionalAssetRef = z
  .union([assetRef, z.literal(''), z.null()])
  .optional()
  .transform((v) => v || null);

export const optionalEmail = z
  .union([z.string().trim().max(254).pipe(z.email()), z.literal(''), z.null()])
  .optional()
  .transform((v) => v || null);

export const optionalPhone = z
  .union([z.string().trim().regex(/^\+?[0-9 ()\-.]{5,25}$/, 'Invalid phone number'), z.literal(''), z.null()])
  .optional()
  .transform((v) => v || null);

// Calendar dates arrive as YYYY-MM-DD and are stored at UTC midnight.
export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .transform((v, ctx) => {
    const d = new Date(`${v}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
      ctx.addIssue({ code: 'custom', message: 'Invalid date' });
      return z.NEVER;
    }
    return d;
  });

export const optionalDate = z
  .union([dateOnly, z.literal(''), z.null()])
  .optional()
  .transform((v) => v || null);

export const uuid = z.uuid();

export const sortOrder = z.number().int().min(0).max(100000).optional();
