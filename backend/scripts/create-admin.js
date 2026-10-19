// Creates the admin account, or resets its password. There is deliberately no HTTP
// endpoint for this: the only way to become admin is shell access to the server.
//
//   ADMIN_EMAIL=me@example.com npm run create-admin          (prompts for the password)
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin  (non-interactive)
import readline from 'node:readline';
import { prisma } from '../db.js';
import { hashPassword, passwordProblem } from '../lib/password.js';

async function promptHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => {
    if (s.includes(question)) rl.output.write(s);
    else if (s === '\r\n' || s === '\n') rl.output.write(s);
  };
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
if (!email.includes('@')) {
  console.error('Set ADMIN_EMAIL to the admin email address.');
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD || (await promptHidden('Password (min 12 chars): '));
const problem = passwordProblem(password, email);
if (problem) {
  console.error(problem);
  process.exit(1);
}

const hash = await hashPassword(password);
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  await prisma.user.update({ where: { id: existing.id }, data: { password: hash, failedLogins: 0, lockedUntil: null } });
  await prisma.session.deleteMany({ where: { userId: existing.id } });
  console.log(`Password reset for ${email}. All sessions revoked, lockout cleared.`);
} else {
  await prisma.user.create({ data: { email, password: hash } });
  console.log(`Admin created: ${email}`);
}
await prisma.$disconnect();
