import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config.js';

export const securityHeaders = helmet({
  // Pure JSON API: nothing it returns should ever be rendered or framed.
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: config.isProd ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
});

const allowlist = (origins) => (origin, cb) => {
  // No Origin header: same-origin or non-browser request, CORS doesn't apply.
  if (!origin || origins.includes(origin)) return cb(null, true);
  cb(null, false);
};

// Admin API: credentialed, only the admin dashboard origin(s).
export const adminCors = cors({
  origin: allowlist(config.adminOrigins),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  maxAge: 600,
});

// Public API: read-only plus the visit beacon, never credentialed.
export const publicCors = cors({
  origin: allowlist([...config.publicOrigins, ...config.adminOrigins]),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600,
});

export const noStore = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Defense in depth on top of SameSite=Strict + CSRF token: refuse state-changing requests that a
// browser reports as coming from another origin. Same-origin always passes (the admin dashboard is
// served from the same host as the API on Vercel, preview deployments included).
export function sameOriginOnly(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin) {
    let allowed = false;
    try {
      const url = new URL(origin);
      allowed = url.host === req.host || config.adminOrigins.includes(url.origin);
    } catch {
      allowed = false;
    }
    if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (req.get('sec-fetch-site') === 'cross-site' && !origin) {
    return res.status(403).json({ error: 'Cross-site request blocked' });
  }
  next();
}
