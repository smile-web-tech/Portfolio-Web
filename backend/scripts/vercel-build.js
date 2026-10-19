// Runs during `vercel build`: generate the Prisma client, and apply pending migrations on
// production deploys only (preview deploys must never alter the production database).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const prisma = fileURLToPath(new URL('../node_modules/.bin/prisma', import.meta.url));
const run = (...args) => execFileSync(prisma, args, { stdio: 'inherit', cwd: fileURLToPath(new URL('..', import.meta.url)) });

run('generate');

if (process.env.VERCEL_ENV === 'production') {
  run('migrate', 'deploy');
} else {
  console.log(`Skipping migrations (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}).`);
}
