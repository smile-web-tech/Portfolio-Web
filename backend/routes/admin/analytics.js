import express from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db.js';
import { config } from '../../config.js';
import { audit } from '../../lib/audit.js';

const router = express.Router();

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const RANGES = {
  '24h': { unit: 'hour', step: HOUR, buckets: 24 },
  '7d': { unit: 'day', step: DAY, buckets: 7 },
  '30d': { unit: 'day', step: DAY, buckets: 30 },
  '90d': { unit: 'day', step: DAY, buckets: 90 },
};

const Query = z.object({
  range: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
  bots: z.enum(['0', '1']).default('0'),
});

// Buckets are UTC and end with the current (partial) hour/day.
function window(range, now = new Date()) {
  const { step, buckets } = RANGES[range];
  const end = Math.floor(now.getTime() / step) * step + step;
  const since = end - buckets * step;
  return { since: new Date(since), end: new Date(end), prevSince: new Date(since - buckets * step) };
}

const ts = (date) => Prisma.sql`CAST(${date.toISOString()} AS timestamp)`;
const scope = (from, to, bots) =>
  Prisma.sql`"createdAt" >= ${ts(from)} AND "createdAt" < ${ts(to)}${bots ? Prisma.empty : Prisma.sql` AND NOT "isBot"`}`;

// Column names are whitelisted constants, never user input.
const COLUMNS = { country: '"country"', deviceType: '"deviceType"', browser: '"browser"', os: '"os"', referrerHost: '"referrerHost"' };

async function breakdown(column, where, limit) {
  const col = Prisma.raw(COLUMNS[column]);
  return prisma.$queryRaw`
    SELECT ${col} AS name, COUNT(*)::int AS visits, COUNT(DISTINCT ip)::int AS visitors
    FROM "Visit" WHERE ${where}
    GROUP BY ${col} ORDER BY visits DESC, name ASC NULLS LAST LIMIT ${limit}`;
}

async function totals(where) {
  const [row] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS visits, COUNT(DISTINCT ip)::int AS visitors, COALESCE(SUM("pageViews"), 0)::int AS "pageViews"
    FROM "Visit" WHERE ${where}`;
  return row;
}

router.get('/', async (req, res) => {
  const { range, bots } = Query.parse(req.query);
  const includeBots = bots === '1';
  const { unit, step, buckets } = RANGES[range];
  const { since, end, prevSince } = window(range);
  const where = scope(since, end, includeBots);

  const [current, previous, botRow, seriesRows, countries, devices, browsers, systems, referrers] = await Promise.all([
    totals(where),
    totals(scope(prevSince, since, includeBots)),
    prisma.$queryRaw`SELECT COUNT(*)::int AS bots FROM "Visit" WHERE ${scope(since, end, true)} AND "isBot"`,
    prisma.$queryRaw`
      SELECT to_char(date_trunc(${unit}, "createdAt"), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS bucket,
             COUNT(*)::int AS visits, COUNT(DISTINCT ip)::int AS visitors, COALESCE(SUM("pageViews"), 0)::int AS "pageViews"
      FROM "Visit" WHERE ${where} GROUP BY 1`,
    breakdown('country', where, 15),
    breakdown('deviceType', where, 6),
    breakdown('browser', where, 8),
    breakdown('os', where, 8),
    breakdown('referrerHost', where, 8),
  ]);

  const byBucket = new Map(seriesRows.map((r) => [r.bucket, r]));
  const series = Array.from({ length: buckets }, (_, i) => {
    const start = new Date(since.getTime() + i * step);
    const key = start.toISOString().slice(0, 19) + 'Z';
    const row = byBucket.get(key);
    return { start: start.toISOString(), visits: row?.visits ?? 0, visitors: row?.visitors ?? 0, pageViews: row?.pageViews ?? 0 };
  });

  res.json({
    range,
    unit,
    includeBots,
    since: since.toISOString(),
    until: end.toISOString(),
    retentionDays: config.visits.retentionDays,
    totals: { ...current, bots: botRow[0].bots },
    previous,
    series,
    countries,
    devices,
    browsers,
    systems,
    referrers,
  });
});

const VisitsQuery = z.object({
  bots: z.enum(['0', '1']).default('0'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  before: z.iso.datetime().optional(),
  from: z.iso.datetime().optional(),
  country: z.string().regex(/^[A-Z]{2}$/).optional(),
  ip: z.string().max(45).regex(/^[0-9a-fA-F.:]*$/).optional(),
});

router.get('/visits', async (req, res) => {
  const q = VisitsQuery.parse(req.query);
  const where = {
    ...(q.bots === '1' ? {} : { isBot: false }),
    ...(q.before || q.from
      ? { createdAt: { ...(q.before ? { lt: new Date(q.before) } : {}), ...(q.from ? { gte: new Date(q.from) } : {}) } }
      : {}),
    ...(q.country ? { country: q.country } : {}),
    ...(q.ip ? { ip: { startsWith: q.ip } } : {}),
  };
  const rows = await prisma.visit.findMany({ where, orderBy: { createdAt: 'desc' }, take: q.limit + 1 });
  const items = rows.slice(0, q.limit);
  res.json({
    items,
    nextBefore: rows.length > q.limit ? items[items.length - 1].createdAt.toISOString() : null,
  });
});

router.delete('/', async (req, res) => {
  const { count } = await prisma.visit.deleteMany();
  await audit(req, 'analytics.clear', { entity: 'analytics', detail: `${count} visits` });
  res.json({ deleted: count });
});

export default router;
