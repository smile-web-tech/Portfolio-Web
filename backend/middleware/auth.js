import { prisma } from '../db.js';
import { config } from '../config.js';
import { sha256, safeEqual } from '../lib/crypto.js';

const TOUCH_INTERVAL_MS = 60_000;

export function cookieOptions(extra = {}) {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'strict',
    path: '/',
    ...extra,
  };
}

export function clearSessionCookie(res) {
  res.clearCookie(config.cookie.name, cookieOptions());
}

const unauthorized = (res) => {
  clearSessionCookie(res);
  return res.status(401).json({ error: 'Not authenticated' });
};

export async function requireAuth(req, res, next) {
  const raw = req.cookies?.[config.cookie.name];
  if (typeof raw !== 'string' || raw.length < 20 || raw.length > 200) return unauthorized(res);

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(raw) },
    include: { user: true },
  });
  if (!session) return unauthorized(res);

  const now = Date.now();
  const expired =
    session.expiresAt.getTime() <= now || now - session.lastSeenAt.getTime() > config.session.idleMs;
  if (expired) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return unauthorized(res);
  }

  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } }).catch(() => {});
  }

  req.session = session;
  req.user = session.user;
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Synchronizer token: the SPA reads it from /auth/me and echoes it in a header.
// A cross-site page can neither read it nor set the custom header.
export function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const sent = req.get('x-csrf-token');
  if (!sent || !safeEqual(sent, req.session.csrfToken)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}
