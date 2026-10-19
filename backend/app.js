import express from 'express';
import cookieParser from 'cookie-parser';
import { config, assertProductionReady } from './config.js';
import { usesLocalStorage } from './lib/storage.js';
import { securityHeaders, adminCors, publicCors, noStore, sameOriginOnly } from './middleware/security.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin/index.js';
import publicRoutes from './routes/public.js';

export function createApp() {
  assertProductionReady();
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(securityHeaders);
  app.use(globalLimiter);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Local-dev uploads only. In production files live in Vercel Blob, on a different origin.
  // Inert by construction: `sandbox` + nosniff mean a hostile file would still not execute.
  if (usesLocalStorage()) {
    app.use(
      '/uploads',
      (req, res, next) => {
        res.set({
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'none'; sandbox",
          'Cross-Origin-Resource-Policy': 'cross-origin',
        });
        next();
      },
      express.static(config.storage.localDir, { index: false, dotfiles: 'deny', redirect: false }),
    );
  }

  app.use('/api/public', publicCors, publicRoutes);

  const admin = [adminCors, noStore, sameOriginOnly, express.json({ limit: '200kb' }), cookieParser()];
  app.use('/api/auth', ...admin, authRoutes);
  app.use('/api/admin', ...admin, adminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
