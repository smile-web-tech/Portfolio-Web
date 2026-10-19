import { prisma } from '../db.js';
import { config } from '../config.js';

const HOUR = 3_600_000;
const AUDIT_RETENTION_MS = 180 * 24 * HOUR;
let lastRun = 0;

// Serverless has no background timers, so this runs opportunistically (on login) and from
// the long-running dev server's interval. At most once per 10 minutes per instance.
// Visits are personal data (IP addresses), so they expire after VISIT_RETENTION_DAYS.
export async function cleanupExpired({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastRun < 10 * 60_000) return;
  lastRun = now;
  try {
    await prisma.session.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date(now) } }, { lastSeenAt: { lt: new Date(now - config.session.idleMs) } }] },
    });
    await prisma.auditLog.deleteMany({ where: { createdAt: { lt: new Date(now - AUDIT_RETENTION_MS) } } });
    await prisma.visit.deleteMany({ where: { createdAt: { lt: new Date(now - config.visits.retentionDays * 24 * HOUR) } } });
  } catch (err) {
    console.error('cleanup failed:', err.message);
  }
}
