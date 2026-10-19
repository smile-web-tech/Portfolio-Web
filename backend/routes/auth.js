import express from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { audit, clientInfo } from '../lib/audit.js';
import { randomToken, sha256, encrypt, decrypt } from '../lib/crypto.js';
import { hashPassword, verifyPassword, getDummyHash, passwordProblem } from '../lib/password.js';
import { newSecret, provisioning, verifyCode, newRecoveryCodes, hashRecoveryCode } from '../lib/totp.js';
import { requireAuth, requireCsrf, cookieOptions, clearSessionCookie } from '../middleware/auth.js';
import { loginThrottle, sensitiveLimiter } from '../middleware/rateLimit.js';
import { cleanupExpired } from '../lib/maintenance.js';
import { HttpError } from '../middleware/errors.js';
import { uuid } from '../lib/validators.js';

const router = express.Router();

const LoginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(256),
  code: z.string().trim().max(20).optional(),
});

const publicUser = (u) => ({ id: u.id, email: u.email, totpEnabled: u.totpEnabled, lastLoginAt: u.lastLoginAt });

function lockMinutes(failed) {
  const { threshold, baseMinutes, maxMinutes } = config.lockout;
  const tier = Math.floor(failed / threshold) - 1;
  return Math.min(baseMinutes * 2 ** tier, maxMinutes);
}

async function registerFailure(user) {
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: { increment: 1 } },
  });
  if (updated.failedLogins >= config.lockout.threshold && updated.failedLogins % config.lockout.threshold === 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lockedUntil: new Date(Date.now() + lockMinutes(updated.failedLogins) * 60_000) },
    });
  }
}

// Accepts a TOTP code or a one-time recovery code. Returns true when the second factor is valid
// and consumes whatever was used so it can't be replayed.
async function checkSecondFactor(user, code) {
  if (!code) return false;
  const secret = decrypt(user.totpSecretEnc);

  const step = verifyCode(secret, code, user.totpLastStep);
  if (step !== null) {
    const claimed = await prisma.user.updateMany({
      where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
      data: { totpLastStep: step },
    });
    return claimed.count === 1;
  }

  const hashed = hashRecoveryCode(code);
  if (user.recoveryCodes.includes(hashed)) {
    const claimed = await prisma.user.updateMany({
      where: { id: user.id, recoveryCodes: { has: hashed } },
      data: { recoveryCodes: user.recoveryCodes.filter((c) => c !== hashed) },
    });
    return claimed.count === 1;
  }
  return false;
}

async function startSession(req, res, user) {
  // Fresh token on every login (no session fixation); drop the one presented, if any.
  const previous = req.cookies?.[config.cookie.name];
  if (typeof previous === 'string') {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(previous) } });
  }

  const token = randomToken(32);
  const csrfToken = randomToken(32);
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      csrfToken,
      expiresAt: new Date(Date.now() + config.session.absoluteMs),
      ...clientInfo(req),
    },
  });
  res.cookie(config.cookie.name, token, cookieOptions());
  return csrfToken;
}

router.post('/login', loginThrottle, async (req, res) => {
  const { email, password, code } = LoginSchema.parse(req.body);
  const genericFail = () => res.status(401).json({ error: 'Invalid email or password' });

  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    await audit(req, 'login.locked', { userId: user.id });
    return res.status(429).json({ error: 'Account temporarily locked. Try again later.' });
  }

  // Always burn one hash verification so unknown emails cost the same as wrong passwords.
  const passwordOk = await verifyPassword(user?.password ?? (await getDummyHash()), password);
  if (!user || !passwordOk) {
    if (user) await registerFailure(user);
    await audit(req, 'login.failure', { userId: user?.id, detail: user ? 'bad password' : 'unknown email' });
    return genericFail();
  }

  if (user.totpEnabled) {
    if (!code) return res.status(401).json({ error: 'Two-factor code required', code: 'totp_required' });
    if (!(await checkSecondFactor(user, code))) {
      await registerFailure(user);
      await audit(req, 'login.failure', { userId: user.id, detail: 'bad second factor' });
      return res.status(401).json({ error: 'Invalid two-factor code', code: 'totp_required' });
    }
  }

  const fresh = await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await cleanupExpired();
  const csrfToken = await startSession(req, res, fresh);
  await audit(req, 'login.success', { userId: user.id });
  res.json({ user: publicUser(fresh), csrfToken });
});

// Everything below needs a valid session; unsafe methods also need the CSRF token.
router.use(requireAuth, requireCsrf);

router.get('/me', (req, res) => {
  res.json({ user: publicUser(req.user), csrfToken: req.session.csrfToken });
});

router.post('/logout', async (req, res) => {
  await prisma.session.delete({ where: { id: req.session.id } });
  clearSessionCookie(res);
  await audit(req, 'logout');
  res.json({ success: true });
});

const PasswordChangeSchema = z.strictObject({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().max(256),
});

router.post('/change-password', sensitiveLimiter, async (req, res) => {
  const { currentPassword, newPassword } = PasswordChangeSchema.parse(req.body);
  if (!(await verifyPassword(req.user.password, currentPassword))) {
    await audit(req, 'password.change.failure');
    throw new HttpError(403, 'Current password is incorrect');
  }
  const problem = passwordProblem(newPassword, req.user.email);
  if (problem) throw new HttpError(400, problem);
  if (newPassword === currentPassword) throw new HttpError(400, 'New password must differ from the current one');

  await prisma.user.update({ where: { id: req.user.id }, data: { password: await hashPassword(newPassword) } });
  // Every other device is signed out.
  const { count } = await prisma.session.deleteMany({ where: { userId: req.user.id, id: { not: req.session.id } } });
  await audit(req, 'password.change', { detail: `${count} other sessions revoked` });
  res.json({ success: true, revokedSessions: count });
});

const PasswordOnly = z.strictObject({ password: z.string().min(1).max(256) });
const CodeOnly = z.strictObject({ code: z.string().trim().min(1).max(20) });
const DisableSchema = z.strictObject({ password: z.string().min(1).max(256), code: z.string().trim().min(1).max(20) });

router.post('/2fa/setup', sensitiveLimiter, async (req, res) => {
  const { password } = PasswordOnly.parse(req.body);
  if (!(await verifyPassword(req.user.password, password))) throw new HttpError(403, 'Password is incorrect');
  if (req.user.totpEnabled) throw new HttpError(409, 'Two-factor authentication is already enabled');

  const secret = newSecret();
  await prisma.user.update({ where: { id: req.user.id }, data: { totpSecretEnc: encrypt(secret) } });
  const { uri, qr } = await provisioning(secret, req.user.email);
  res.json({ secret, uri, qr });
});

router.post('/2fa/enable', sensitiveLimiter, async (req, res) => {
  const { code } = CodeOnly.parse(req.body);
  if (req.user.totpEnabled) throw new HttpError(409, 'Two-factor authentication is already enabled');
  if (!req.user.totpSecretEnc) throw new HttpError(400, 'Start setup first');

  const step = verifyCode(decrypt(req.user.totpSecretEnc), code, null);
  if (step === null) throw new HttpError(400, 'Invalid code');

  const { plain, hashed } = newRecoveryCodes();
  await prisma.user.update({
    where: { id: req.user.id },
    data: { totpEnabled: true, totpLastStep: step, recoveryCodes: hashed },
  });
  await audit(req, '2fa.enable');
  res.json({ recoveryCodes: plain });
});

router.post('/2fa/disable', sensitiveLimiter, async (req, res) => {
  const { password, code } = DisableSchema.parse(req.body);
  if (!req.user.totpEnabled) throw new HttpError(400, 'Two-factor authentication is not enabled');
  if (!(await verifyPassword(req.user.password, password))) throw new HttpError(403, 'Password is incorrect');
  if (!(await checkSecondFactor(req.user, code))) throw new HttpError(403, 'Invalid two-factor code');

  await prisma.user.update({
    where: { id: req.user.id },
    data: { totpEnabled: false, totpSecretEnc: null, totpLastStep: null, recoveryCodes: [] },
  });
  await audit(req, '2fa.disable');
  res.json({ success: true });
});

router.get('/sessions', async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.user.id, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: 'desc' },
    select: { id: true, ip: true, userAgent: true, createdAt: true, lastSeenAt: true },
  });
  res.json(sessions.map((s) => ({ ...s, current: s.id === req.session.id })));
});

router.post('/sessions/revoke-others', async (req, res) => {
  const { count } = await prisma.session.deleteMany({ where: { userId: req.user.id, id: { not: req.session.id } } });
  await audit(req, 'session.revoke-others', { detail: `${count} sessions` });
  res.json({ revoked: count });
});

router.delete('/sessions/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  if (id === req.session.id) throw new HttpError(400, 'Use sign out for the current session');
  const { count } = await prisma.session.deleteMany({ where: { id, userId: req.user.id } });
  if (count === 0) throw new HttpError(404, 'Not found');
  await audit(req, 'session.revoke', { entityId: id });
  res.json({ success: true });
});

export default router;
