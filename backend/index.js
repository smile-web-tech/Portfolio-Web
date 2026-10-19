import { config } from './config.js';
import { prisma } from './db.js';
import { createApp } from './app.js';
import { cleanupExpired } from './lib/maintenance.js';

const app = createApp();
const server = app.listen(config.port, config.host, () => {
  console.log(`API listening on http://${config.host}:${config.port} (${config.isProd ? 'production' : 'development'})`);
});

cleanupExpired({ force: true });
const timer = setInterval(() => cleanupExpired({ force: true }), 3_600_000);
timer.unref();

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
