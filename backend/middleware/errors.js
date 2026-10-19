import { z } from 'zod';
import multer from 'multer';

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// Never leaks stack traces, SQL, or Prisma internals to clients.
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : 'Invalid upload';
    return res.status(400).json({ error: message });
  }
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err?.code === 'P2025') return res.status(404).json({ error: 'Not found' });
  if (err?.code === 'P2002') return res.status(409).json({ error: 'Already exists' });

  console.error(`[${req.method} ${req.path}]`, err);
  res.status(500).json({ error: 'Internal server error' });
}
