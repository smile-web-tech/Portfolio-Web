import { prisma } from '../db.js';

export function clientInfo(req) {
  return { ip: req.ip ?? null, userAgent: (req.get('user-agent') || '').slice(0, 300) || null };
}

// Best-effort: a failed audit write must never break the request it describes.
export async function audit(req, action, { entity, entityId, detail, userId } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity: entity ?? null,
        entityId: entityId ?? null,
        detail: detail ? String(detail).slice(0, 200) : null,
        userId: userId ?? req.user?.id ?? null,
        ...clientInfo(req),
      },
    });
  } catch (err) {
    console.error('audit write failed:', err.message);
  }
}
