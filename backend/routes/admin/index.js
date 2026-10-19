import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireCsrf } from '../../middleware/auth.js';
import { writeLimiter } from '../../middleware/rateLimit.js';
import content from './content.js';
import settings from './settings.js';
import media from './media.js';
import analytics from './analytics.js';

const router = express.Router();

router.use(requireAuth, requireCsrf, writeLimiter);

router.use('/settings', settings);
router.use('/media', media);
router.use('/analytics', analytics);
router.use(content);

router.get('/overview', async (req, res) => {
  const count = (model) => prisma[model].count();
  const day = new Date(Date.now() - 24 * 3_600_000);
  const week = new Date(Date.now() - 7 * 24 * 3_600_000);
  const [projects, experience, education, skills, media, drafts, recent, visits24h, visits7d] = await Promise.all([
    count('project'),
    count('experience'),
    count('education'),
    count('skill'),
    count('media'),
    Promise.all(['project', 'experience', 'education', 'skill'].map((m) => prisma[m].count({ where: { isPublished: false } }))),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.visit.count({ where: { isBot: false, createdAt: { gte: day } } }),
    prisma.visit.count({ where: { isBot: false, createdAt: { gte: week } } }),
  ]);
  res.json({
    counts: { projects, experience, education, skills, media },
    drafts: drafts.reduce((a, b) => a + b, 0),
    visits: { last24h: visits24h, last7d: visits7d },
    recent,
  });
});

router.get('/audit', async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
  res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit }));
});

export default router;
