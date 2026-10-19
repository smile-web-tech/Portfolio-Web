import { rateLimit } from 'express-rate-limit';
import { prisma } from '../db.js';
import { config } from '../config.js';

// In-memory limiters are per serverless instance, so they are best-effort burst control only.
// Anything security-critical (login) is enforced from the database instead; see loginThrottle.
const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
  });

export const globalLimiter = make(60_000, 300, 'Too many requests, slow down');
export const sensitiveLimiter = make(15 * 60_000, 20, 'Too many attempts, try again later');
export const writeLimiter = make(60_000, 120, 'Too many changes, slow down');
export const uploadLimiter = make(10 * 60_000, 40, 'Too many uploads, try again later');

// Counts recent failed logins for this IP in the audit log, which every serverless instance shares.
export async function loginThrottle(req, res, next) {
  if (!req.ip) return next();
  const { windowMs, max } = config.loginThrottle;
  const failures = await prisma.auditLog.count({
    where: {
      action: { in: ['login.failure', 'login.locked'] },
      ip: req.ip,
      createdAt: { gt: new Date(Date.now() - windowMs) },
    },
  });
  if (failures >= max) {
    res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
    return res.status(429).json({ error: 'Too many login attempts, try again later' });
  }
  next();
}
