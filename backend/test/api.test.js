// Integration tests against the real app and database (DATABASE_URL from .env).
// They create a throwaway admin and content rows, and remove everything they created.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as OTPAuth from 'otpauth';
import sharp from 'sharp';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { createApp } from '../app.js';
import { hashPassword } from '../lib/password.js';

const PASSWORD = 'correct horse battery staple';
const startedAt = new Date();
let server;
let base;
const createdUsers = [];
const createdProjects = [];
const createdMedia = [];

before(async () => {
  config.loginThrottle.max = 1000; // exercised explicitly in one test
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await prisma.project.deleteMany({ where: { id: { in: createdProjects } } });
  for (const m of createdMedia) await prisma.media.deleteMany({ where: { id: m } });
  // Only our own noise: other test files run concurrently against the same database.
  await prisma.auditLog.deleteMany({ where: { createdAt: { gte: startedAt }, NOT: { ip: { startsWith: '203.0.113.' } } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUsers } } });
  await new Promise((r) => server.close(r));
  await prisma.$disconnect();
});

async function makeUser(label) {
  const email = `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
  const user = await prisma.user.create({ data: { email, password: await hashPassword(PASSWORD) } });
  createdUsers.push(user.id);
  return { id: user.id, email };
}

// Minimal cookie-aware client.
function client() {
  let cookie = '';
  let csrf = '';
  const api = {
    get csrf() { return csrf; },
    async req(method, path, { body, headers = {}, raw, csrfToken = csrf } = {}) {
      const h = { Origin: base, ...headers };
      if (cookie) h.Cookie = cookie;
      if (csrfToken && method !== 'GET') h['X-CSRF-Token'] = csrfToken;
      let payload = raw;
      if (body !== undefined) {
        h['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
      }
      const res = await fetch(base + path, { method, headers: h, body: payload });
      const set = res.headers.getSetCookie?.() ?? [];
      for (const c of set) {
        const [pair] = c.split(';');
        cookie = pair.endsWith('=') ? '' : pair;
      }
      let json = null;
      try { json = await res.json(); } catch { /* no body */ }
      return { status: res.status, json, headers: res.headers, setCookie: set };
    },
    async login(email, password = PASSWORD, code) {
      const r = await api.req('POST', '/api/auth/login', { body: { email, password, ...(code ? { code } : {}) } });
      if (r.status === 200) csrf = r.json.csrfToken;
      return r;
    },
  };
  return api;
}

async function loggedIn(label) {
  const user = await makeUser(label);
  const c = client();
  const r = await c.login(user.email);
  assert.equal(r.status, 200);
  return { c, user };
}

test('health and public portfolio are readable without auth, with no internal fields', async () => {
  const c = client();
  assert.equal((await c.req('GET', '/api/health')).status, 200);
  const r = await c.req('GET', '/api/public/portfolio');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.projects));
  assert.ok(r.json.projects.length > 0);
  for (const p of r.json.projects) {
    assert.equal('isPublished' in p, false);
    assert.equal('createdAt' in p, false);
  }
  assert.match(r.headers.get('cache-control'), /s-maxage=60/);
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});

test('admin API rejects unauthenticated access, including old unprotected routes', async () => {
  const c = client();
  for (const path of ['/api/admin/projects', '/api/admin/settings', '/api/admin/media', '/api/admin/audit', '/api/auth/me']) {
    assert.equal((await c.req('GET', path)).status, 401, path);
  }
  assert.equal((await c.req('POST', '/api/admin/projects', { body: { title: 'x' } })).status, 401);
  assert.equal((await c.req('GET', '/api/projects')).status, 404);
});

test('login: wrong password and unknown email are indistinguishable', async () => {
  const user = await makeUser('generic');
  const c = client();
  const bad = await c.login(user.email, 'wrong password here');
  const unknown = await c.login('nobody@example.test', 'wrong password here');
  assert.equal(bad.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(bad.json, unknown.json);
  assert.equal(bad.setCookie.length, 0);
});

test('login sets a hardened session cookie and returns a CSRF token', async () => {
  const user = await makeUser('cookie');
  const c = client();
  const r = await c.login(user.email);
  assert.equal(r.status, 200);
  const cookie = r.setCookie[0];
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  assert.match(cookie, /Path=\//i);
  assert.equal(r.json.user.email, user.email);
  assert.equal('password' in r.json.user, false);
  assert.ok(r.json.csrfToken.length >= 32);
  const me = await c.req('GET', '/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.json.csrfToken, r.json.csrfToken);
});

test('state-changing requests need the CSRF token and a same-origin Origin', async () => {
  const { c } = await loggedIn('csrf');
  const body = { title: 'T', description: 'D', techStack: [], links: [] };
  assert.equal((await c.req('POST', '/api/admin/projects', { body, csrfToken: '' })).status, 403);
  assert.equal((await c.req('POST', '/api/admin/projects', { body, csrfToken: 'x'.repeat(43) })).status, 403);
  const evil = await c.req('POST', '/api/admin/projects', { body, headers: { Origin: 'https://evil.example' } });
  assert.equal(evil.status, 403);
  assert.equal((await c.req('POST', '/api/admin/projects', { body, headers: { 'Sec-Fetch-Site': 'cross-site', Origin: '' } })).status, 403);
  const ok = await c.req('POST', '/api/admin/projects', { body });
  assert.equal(ok.status, 201);
  createdProjects.push(ok.json.id);
});

test('projects: validation rejects dangerous or unknown input', async () => {
  const { c } = await loggedIn('validate');
  const valid = { title: 'T', description: 'D', techStack: ['a'], links: [], thumbnailUrl: null };
  const post = (over) => c.req('POST', '/api/admin/projects', { body: { ...valid, ...over } });

  for (const bad of [
    { links: [{ label: 'x', url: 'javascript:alert(1)', kind: 'button' }] },
    { links: [{ label: 'x', url: 'data:text/html,<script>', kind: 'button' }] },
    { links: [{ label: 'x', url: 'https://ok.example', kind: 'bogus' }] },
    { thumbnailUrl: 'javascript:alert(1)' },
    { thumbnailUrl: '/pictures/../../etc/passwd' },
    { thumbnailUrl: 'http://insecure.example/x.png' },
    { title: '' },
    { title: 'x'.repeat(500) },
    { isAdmin: true },
    { id: '00000000-0000-0000-0000-000000000000' },
  ]) {
    const r = await post(bad);
    assert.equal(r.status, 400, JSON.stringify(bad));
    assert.equal(r.json.error, 'Validation failed');
  }
});

test('projects: create, update, reorder, draft hiding, delete', async () => {
  const { c } = await loggedIn('crud');
  const mk = async (title, extra = {}) => {
    const r = await c.req('POST', '/api/admin/projects', {
      body: { title, description: 'desc', techStack: ['x'], links: [{ label: 'Demo', url: 'https://example.com', kind: 'button' }], thumbnailUrl: '/pictures/aero.jpeg', ...extra },
    });
    assert.equal(r.status, 201);
    createdProjects.push(r.json.id);
    return r.json;
  };
  const a = await mk('CRUD A');
  const b = await mk('CRUD B');

  // New items go to the start of the list.
  const list = (await c.req('GET', '/api/admin/projects')).json.map((p) => p.id);
  assert.ok(list.indexOf(b.id) < list.indexOf(a.id));

  const upd = await c.req('PUT', `/api/admin/projects/${a.id}`, {
    body: { title: 'CRUD A2', description: 'new', techStack: [], links: [], thumbnailUrl: null, isPublished: false },
  });
  assert.equal(upd.status, 200);
  assert.equal(upd.json.title, 'CRUD A2');

  const pub = (await c.req('GET', '/api/public/portfolio')).json.projects.map((p) => p.title);
  assert.ok(!pub.includes('CRUD A2'), 'draft must not be public');
  assert.ok(pub.includes('CRUD B'));

  // Reorder only the rows this test created; never touch real content.
  const positions = async () => (await c.req('GET', '/api/admin/projects')).json.map((p) => p.id).filter((id) => id === a.id || id === b.id);
  const before = await positions();
  const flipped = [...before].reverse();
  assert.equal((await c.req('PUT', '/api/admin/projects/reorder', { body: { ids: flipped } })).status, 200);
  assert.deepEqual(await positions(), flipped);
  assert.equal((await c.req('PUT', '/api/admin/projects/reorder', { body: { ids: [a.id, a.id] } })).status, 400);

  assert.equal((await c.req('GET', '/api/admin/projects/not-a-uuid')).status, 400);
  assert.equal((await c.req('DELETE', `/api/admin/projects/${a.id}`)).status, 200);
  assert.equal((await c.req('GET', `/api/admin/projects/${a.id}`)).status, 404);
  assert.equal((await c.req('DELETE', `/api/admin/projects/${a.id}`)).status, 404);
});

test('experience and education validate dates and nested details', async () => {
  const { c } = await loggedIn('dates');
  const exp = { company: 'C', role: 'R', startDate: '2024-05-01', endDate: '2024-01-01', details: [] };
  const r = await c.req('POST', '/api/admin/experience', { body: exp });
  assert.equal(r.status, 400);
  assert.ok(r.json.issues.some((i) => i.path === 'endDate'));
  assert.equal((await c.req('POST', '/api/admin/experience', { body: { ...exp, startDate: '2024-02-31', endDate: null } })).status, 400);
  assert.equal((await c.req('POST', '/api/admin/experience', { body: { ...exp, endDate: null, details: [{ url: 'javascript:1', bullets: [] }] } })).status, 400);

  const ok = await c.req('POST', '/api/admin/experience', {
    body: { ...exp, endDate: null, details: [{ title: 'P', url: 'https://example.com', bullets: ['**bold** text'] }] },
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.json.endDate, null);
  assert.equal((await c.req('DELETE', `/api/admin/experience/${ok.json.id}`)).status, 200);

  const edu = await c.req('POST', '/api/admin/education', { body: { institution: 'Uni', startDate: '2020-09-01', bullets: ['a'] } });
  assert.equal(edu.status, 201);
  assert.equal(edu.json.degree, null);
  assert.equal((await c.req('DELETE', `/api/admin/education/${edu.json.id}`)).status, 200);
});

test('settings: rejects bad email/urls, upserts good data', async () => {
  const { c } = await loggedIn('settings');
  const before = (await c.req('GET', '/api/admin/settings')).json;
  const good = { ...before, id: undefined };
  delete good.id;
  assert.equal((await c.req('PUT', '/api/admin/settings', { body: { ...good, email: 'not-an-email' } })).status, 400);
  assert.equal((await c.req('PUT', '/api/admin/settings', { body: { ...good, githubUrl: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await c.req('PUT', '/api/admin/settings', { body: { ...good, name: 'Changed' } })).status, 200);
  assert.equal((await c.req('GET', '/api/admin/settings')).json.name, 'Changed');
  assert.equal((await c.req('PUT', '/api/admin/settings', { body: good })).status, 200); // restore
});

async function upload(c, buffer, filename, type) {
  const fd = new FormData();
  fd.append('file', new Blob([buffer], { type }), filename);
  return c.req('POST', '/api/admin/media', { raw: fd });
}

test('uploads: validated by content, re-encoded, and safe to serve', async () => {
  const { c } = await loggedIn('upload');
  const png = await sharp({ create: { width: 64, height: 32, channels: 3, background: '#f00' } }).png().toBuffer();

  const ok = await upload(c, png, 'my photo.png', 'image/png');
  assert.equal(ok.status, 201);
  createdMedia.push(ok.json.id);
  assert.equal(ok.json.mime, 'image/webp');
  assert.equal(ok.json.width, 64);
  assert.match(ok.json.url, /^\/uploads\/[0-9a-f]{32}\.webp$/);
  const served = await fetch(base + ok.json.url);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('content-type'), 'image/webp');
  assert.equal(served.headers.get('x-content-type-options'), 'nosniff');
  assert.match(served.headers.get('content-security-policy'), /sandbox/);

  // Wrong extension / MIME claims don't matter; content decides.
  assert.equal((await upload(c, Buffer.from('#!/bin/sh\necho pwned'), 'x.png', 'image/png')).status, 415);
  assert.equal((await upload(c, Buffer.from('<html><script>alert(1)</script></html>'), 'x.png', 'image/png')).status, 415);
  assert.equal((await upload(c, Buffer.from('MZ\x90\x00 fake exe'), 'x.png', 'image/png')).status, 415);
  // Truncated image
  assert.equal((await upload(c, png.subarray(0, 40), 'x.png', 'image/png')).status, 400);

  const evilSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
  assert.equal((await upload(c, Buffer.from(evilSvg), 'x.svg', 'image/svg+xml')).status, 400);
  const externalSvg = '<svg xmlns="http://www.w3.org/2000/svg"><image href="file:///etc/passwd"/></svg>';
  assert.equal((await upload(c, Buffer.from(externalSvg), 'x.svg', 'image/svg+xml')).status, 400);
  const goodSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="blue"/></svg>';
  const svg = await upload(c, Buffer.from(goodSvg), 'icon.svg', 'image/svg+xml');
  assert.equal(svg.status, 201);
  createdMedia.push(svg.json.id);
  assert.equal(svg.json.mime, 'image/png');

  const big = Buffer.alloc(config.storage.maxUploadBytes + 1024, 1);
  assert.equal((await upload(c, big, 'big.png', 'image/png')).status, 400);

  // Deleting an in-use file is refused unless forced.
  const proj = await c.req('POST', '/api/admin/projects', {
    body: { title: 'uses image', description: 'd', techStack: [], links: [], thumbnailUrl: ok.json.url },
  });
  createdProjects.push(proj.json.id);
  const del = await c.req('DELETE', `/api/admin/media/${ok.json.id}`);
  assert.equal(del.status, 409);
  assert.deepEqual(del.json.usages, ['Project: uses image']);
  assert.equal((await c.req('DELETE', `/api/admin/media/${svg.json.id}`)).status, 200);
  assert.equal((await c.req('DELETE', `/api/admin/media/${ok.json.id}?force=true`)).status, 200);
  assert.equal((await fetch(base + ok.json.url)).status, 404);
});

test('account locks after repeated failures, and a correct password no longer works while locked', async () => {
  const user = await makeUser('lock');
  const c = client();
  for (let i = 0; i < config.lockout.threshold; i++) {
    assert.equal((await c.login(user.email, 'wrong password here')).status, 401);
  }
  const locked = await c.login(user.email);
  assert.equal(locked.status, 429);
  assert.equal(locked.setCookie.length, 0);
  // Admin recovery path (create-admin script) clears it.
  await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: null, failedLogins: 0 } });
  assert.equal((await c.login(user.email)).status, 200);
});

test('login is throttled per IP from the audit log', async () => {
  const user = await makeUser('throttle');
  const c = client();
  config.loginThrottle.max = 3;
  try {
    await prisma.auditLog.deleteMany({ where: { action: 'login.failure', createdAt: { gte: startedAt }, NOT: { ip: { startsWith: '203.0.113.' } } } });
    for (let i = 0; i < 3; i++) await c.login('nobody@example.test', 'wrong password here');
    const r = await c.login(user.email);
    assert.equal(r.status, 429);
    assert.ok(r.headers.get('retry-after'));
  } finally {
    config.loginThrottle.max = 1000;
    await prisma.auditLog.deleteMany({ where: { action: 'login.failure', createdAt: { gte: startedAt }, NOT: { ip: { startsWith: '203.0.113.' } } } });
  }
});

test('logout destroys the session server-side', async () => {
  const { c } = await loggedIn('logout');
  const cookieBefore = (await c.req('GET', '/api/auth/me')).status;
  assert.equal(cookieBefore, 200);
  const res = await c.req('POST', '/api/auth/logout');
  assert.equal(res.status, 200);
  assert.equal((await c.req('GET', '/api/auth/me')).status, 401);
});

test('a stolen session token stops working after logout (replayed by another client)', async () => {
  const user = await makeUser('replay');
  const a = client();
  const login = await a.login(user.email);
  const stolen = login.setCookie[0].split(';')[0];
  const thief = { Cookie: stolen };
  assert.equal((await fetch(`${base}/api/auth/me`, { headers: thief })).status, 200);
  await a.req('POST', '/api/auth/logout');
  assert.equal((await fetch(`${base}/api/auth/me`, { headers: thief })).status, 401);
});

test('sessions expire when idle or past the absolute limit', async () => {
  const { c, user } = await loggedIn('expiry');
  const session = await prisma.session.findFirst({ where: { userId: user.id } });
  await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date(Date.now() - config.session.idleMs - 1000) } });
  assert.equal((await c.req('GET', '/api/auth/me')).status, 401);

  const c2 = client();
  await c2.login(user.email);
  const s2 = await prisma.session.findFirst({ where: { userId: user.id } });
  await prisma.session.update({ where: { id: s2.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await c2.req('GET', '/api/auth/me')).status, 401);
});

test('change password: verifies current, enforces strength, revokes other sessions', async () => {
  const user = await makeUser('pw');
  const a = client();
  const b = client();
  await a.login(user.email);
  await b.login(user.email);

  assert.equal((await a.req('POST', '/api/auth/change-password', { body: { currentPassword: 'nope nope nope', newPassword: 'a brand new passphrase' } })).status, 403);
  assert.equal((await a.req('POST', '/api/auth/change-password', { body: { currentPassword: PASSWORD, newPassword: 'short' } })).status, 400);
  assert.equal((await a.req('POST', '/api/auth/change-password', { body: { currentPassword: PASSWORD, newPassword: 'aaaaaaaaaaaaaaaa' } })).status, 400);
  const ok = await a.req('POST', '/api/auth/change-password', { body: { currentPassword: PASSWORD, newPassword: 'a brand new passphrase' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.revokedSessions, 1);
  assert.equal((await a.req('GET', '/api/auth/me')).status, 200);
  assert.equal((await b.req('GET', '/api/auth/me')).status, 401);
  assert.equal((await client().login(user.email, PASSWORD)).status, 401);
  assert.equal((await client().login(user.email, 'a brand new passphrase')).status, 200);
});

test('two-factor auth: setup, enforce, replay protection, recovery codes, disable', async () => {
  const { c, user } = await loggedIn('2fa');

  assert.equal((await c.req('POST', '/api/auth/2fa/setup', { body: { password: 'wrong password!!' } })).status, 403);
  const setup = await c.req('POST', '/api/auth/2fa/setup', { body: { password: PASSWORD } });
  assert.equal(setup.status, 200);
  assert.match(setup.json.qr, /^data:image\/png;base64,/);
  const stored = await prisma.user.findUnique({ where: { id: user.id } });
  assert.notEqual(stored.totpSecretEnc, setup.json.secret, 'secret must be encrypted at rest');
  assert.ok(!stored.totpSecretEnc.includes(setup.json.secret));

  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(setup.json.secret), digits: 6, period: 30 });
  assert.equal((await c.req('POST', '/api/auth/2fa/enable', { body: { code: '000000' } })).status, 400);
  const enable = await c.req('POST', '/api/auth/2fa/enable', { body: { code: totp.generate() } });
  assert.equal(enable.status, 200);
  assert.equal(enable.json.recoveryCodes.length, 8);
  const afterEnable = await prisma.user.findUnique({ where: { id: user.id } });
  assert.ok(afterEnable.recoveryCodes.every((h) => !enable.json.recoveryCodes.includes(h)), 'recovery codes are stored hashed');

  // Password alone is no longer enough.
  const noCode = await client().login(user.email);
  assert.equal(noCode.status, 401);
  assert.equal(noCode.json.code, 'totp_required');
  assert.equal(noCode.setCookie.length, 0);
  assert.equal((await client().login(user.email, PASSWORD, '123456')).status, 401);

  // The code used to enable is burned; the next time step works once and only once.
  assert.equal((await client().login(user.email, PASSWORD, totp.generate())).status, 401);
  const next = totp.generate({ timestamp: Date.now() + 30_000 });
  assert.equal((await client().login(user.email, PASSWORD, next)).status, 200);
  assert.equal((await client().login(user.email, PASSWORD, next)).status, 401, 'replayed code must be rejected');

  // Recovery code: works once.
  const rc = enable.json.recoveryCodes[0];
  assert.equal((await client().login(user.email, PASSWORD, rc)).status, 200);
  assert.equal((await client().login(user.email, PASSWORD, rc)).status, 401);

  // Disable needs password + a valid second factor.
  const dis = client();
  const rc2 = enable.json.recoveryCodes[1];
  const l = await dis.login(user.email, PASSWORD, rc2);
  assert.equal(l.status, 200);
  assert.equal((await dis.req('POST', '/api/auth/2fa/disable', { body: { password: PASSWORD, code: '999999' } })).status, 403);
  assert.equal((await dis.req('POST', '/api/auth/2fa/disable', { body: { password: PASSWORD, code: enable.json.recoveryCodes[2] } })).status, 200);
  assert.equal((await client().login(user.email)).status, 200);
});

test('sessions can be listed and revoked individually', async () => {
  const user = await makeUser('sessions');
  const a = client();
  const b = client();
  await a.login(user.email);
  await b.login(user.email);
  const list = (await a.req('GET', '/api/auth/sessions')).json;
  assert.equal(list.length, 2);
  const other = list.find((s) => !s.current);
  assert.equal((await a.req('DELETE', `/api/auth/sessions/${other.id}`)).status, 200);
  assert.equal((await b.req('GET', '/api/auth/me')).status, 401);
  const self = list.find((s) => s.current);
  assert.equal((await a.req('DELETE', `/api/auth/sessions/${self.id}`)).status, 400);
});

test('errors never leak internals', async () => {
  const { c } = await loggedIn('errors');
  const bad = await c.req('POST', '/api/admin/projects', { raw: '{not json', headers: { 'Content-Type': 'application/json' } });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.error, 'Invalid JSON');
  const huge = await c.req('POST', '/api/admin/projects', { body: { title: 'x'.repeat(300_000) } });
  assert.equal(huge.status, 413);
  const missing = await c.req('GET', '/api/nope');
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.json, { error: 'Not found' });
});

test('audit log records security-relevant actions without secrets', async () => {
  const { c, user } = await loggedIn('audit');
  const r = await c.req('GET', '/api/admin/audit?limit=200');
  assert.equal(r.status, 200);
  const mine = r.json.filter((e) => e.userId === user.id);
  assert.ok(mine.some((e) => e.action === 'login.success'));
  const text = JSON.stringify(r.json);
  assert.ok(!text.includes(PASSWORD));
});
