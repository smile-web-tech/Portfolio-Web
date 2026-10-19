import express from 'express';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { sha256 } from '../lib/crypto.js';
import { cleanupExpired } from '../lib/maintenance.js';
import { normalizeIp, parseUserAgent, geoFromHeaders } from '../lib/visitor.js';

const router = express.Router();

const order = [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
const published = { where: { isPublished: true }, orderBy: order };
const omit = { isPublished: true, sortOrder: true, createdAt: true, updatedAt: true };

// One read-only payload for the portfolio site. Drafts never leave the server.
router.get('/portfolio', async (req, res) => {
  const [settings, projects, experience, education, skills] = await Promise.all([
    prisma.generalSettings.findUnique({ where: { id: 1 } }),
    prisma.project.findMany({ ...published, omit }),
    prisma.experience.findMany({ ...published, omit }),
    prisma.education.findMany({ ...published, omit }),
    prisma.skill.findMany({ ...published, omit }),
  ]);
  // s-maxage: cached at Vercel's edge, so visitors don't hit the database. Edits show within ~1 minute.
  res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.json({ settings, projects, experience, education, skills });
});

const VisitSchema = z.strictObject({
  path: z.string().regex(/^\/[^\s]{0,199}$/).optional(),
  referrer: z.string().max(500).optional(),
  language: z.string().max(35).optional(),
});

// Hostname only: the full referrer URL can carry search terms or tokens.
function referrerHost(referrer, ownHost) {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, '').slice(0, 120);
    return host === ownHost.replace(/^www\./, '').split(':')[0] ? null : host;
  } catch {
    return null;
  }
}

const sameSite = (req) => {
  const origin = req.get('origin');
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.host === req.host || config.publicOrigins.includes(url.origin) || config.adminOrigins.includes(url.origin);
  } catch {
    return false;
  }
};

// First-party visit log, fired once per browser tab session by the site. Always answers 204 so it
// can't be used to probe, and never blocks the page. The client only supplies path/referrer/language;
// IP, location and device are derived server-side from the request itself.
router.post('/visit', express.json({ limit: '2kb' }), cookieParser(), async (req, res) => {
  const done = () => res.status(204).end();
  const body = VisitSchema.parse(req.body ?? {});

  // Honour browser privacy signals, ignore other sites' scripts, and never count the owner.
  if (req.get('dnt') === '1' || req.get('sec-gpc') === '1') return done();
  if (!sameSite(req)) return done();
  const sid = req.cookies?.[config.cookie.name];
  if (typeof sid === 'string' && sid.length < 200) {
    const session = await prisma.session.findUnique({ where: { tokenHash: sha256(sid) }, select: { expiresAt: true } });
    if (session && session.expiresAt > new Date()) return done();
  }

  const ip = normalizeIp(req.ip);
  if (!ip) return done();
  const userAgent = (req.get('user-agent') || '').slice(0, 400) || null;
  const now = new Date();

  const existing = await prisma.visit.findFirst({
    where: { ip, userAgent, lastSeenAt: { gt: new Date(now.getTime() - config.visits.sessionWindowMs) } },
    orderBy: { lastSeenAt: 'desc' },
    select: { id: true },
  });
  if (existing) {
    await prisma.visit.update({ where: { id: existing.id }, data: { pageViews: { increment: 1 }, lastSeenAt: now } });
    return done();
  }

  const recent = await prisma.visit.count({ where: { ip, createdAt: { gt: new Date(now.getTime() - 3_600_000) } } });
  if (recent >= config.visits.maxPerIpPerHour) return done();

  await prisma.visit.create({
    data: {
      ip,
      ...geoFromHeaders(req),
      ...parseUserAgent(userAgent),
      userAgent,
      referrerHost: referrerHost(body.referrer, req.hostname),
      path: body.path ?? null,
      language: body.language ? body.language.split(',')[0].slice(0, 35) : null,
      createdAt: now,
      lastSeenAt: now,
    },
  });
  done();
  void cleanupExpired(); // enforces visit retention even if the admin never signs in
});

export default router;
