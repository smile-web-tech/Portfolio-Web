// Visit logging and the admin analytics API. Runs against the real database with
// TEST-NET addresses (203.0.113.0/24, 198.51.100.0/24) so cleanup can't touch real visits.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { createApp } from '../app.js';
import { hashPassword } from '../lib/password.js';

const PASSWORD = 'correct horse battery staple';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const WIN_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

let server;
let base;
let userId;
let email;

const TEST_NET = { OR: [{ ip: { startsWith: '203.0.113.' } }, { ip: { startsWith: '198.51.100.' } }] };

before(async () => {
  await prisma.visit.deleteMany({ where: TEST_NET }); // start from a clean slate in our reserved ranges
  config.trustProxy = 1; // behave like Vercel: X-Forwarded-For and edge geo headers are trusted
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  email = `test-analytics-${Date.now()}@example.test`;
  userId = (await prisma.user.create({ data: { email, password: await hashPassword(PASSWORD) } })).id;
});

after(async () => {
  await prisma.visit.deleteMany({ where: TEST_NET });
  await prisma.auditLog.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await new Promise((r) => server.close(r));
  await prisma.$disconnect();
});

const track = (ip, { ua = WIN_CHROME, geo = {}, body = { path: '/', language: 'en-US,en;q=0.9' }, headers = {}, origin = base } = {}) =>
  fetch(`${base}/api/public/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': ua, 'X-Forwarded-For': ip, ...(origin ? { Origin: origin } : {}), ...geo, ...headers },
    body: JSON.stringify(body),
  });

const rowsFor = (ip) => prisma.visit.findMany({ where: { ip }, orderBy: { createdAt: 'asc' } });

async function adminSession() {
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base, 'X-Forwarded-For': '203.0.113.250' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.getSetCookie()[0].split(';')[0];
  const { csrfToken } = await login.json();
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'X-CSRF-Token': csrfToken, 'X-Forwarded-For': '203.0.113.250', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  };
  return { cookie, call };
}

test('records IP, edge location and parsed device for a mobile visitor', async () => {
  const res = await track('203.0.113.10', {
    ua: IPHONE,
    geo: { 'x-vercel-ip-country': 'HU', 'x-vercel-ip-country-region': 'BU', 'x-vercel-ip-city': 'Budapest' },
    body: { path: '/', referrer: 'https://www.linkedin.com/feed/?token=secret', language: 'hu-HU,hu;q=0.9' },
  });
  assert.equal(res.status, 204);
  const [row] = await rowsFor('203.0.113.10');
  assert.equal(row.country, 'HU');
  assert.equal(row.city, 'Budapest');
  assert.equal(row.deviceType, 'mobile');
  assert.equal(row.browser, 'Safari');
  assert.equal(row.os, 'iOS');
  assert.equal(row.isBot, false);
  assert.equal(row.referrerHost, 'linkedin.com', 'only the hostname is kept, never the path or query');
  assert.equal(row.language, 'hu-HU');
});

test('desktop browsers and URL-encoded city names are handled', async () => {
  await track('203.0.113.11', { geo: { 'x-vercel-ip-country': 'DE', 'x-vercel-ip-city': 'M%C3%BCnchen' } });
  const [row] = await rowsFor('203.0.113.11');
  assert.equal(row.deviceType, 'desktop');
  assert.equal(row.browser, 'Chrome');
  assert.equal(row.os, 'Windows');
  assert.equal(row.city, 'München');
});

test('repeat loads in one session bump pageViews instead of adding visits', async () => {
  for (let i = 0; i < 3; i++) await track('203.0.113.12');
  const rows = await rowsFor('203.0.113.12');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].pageViews, 3);
  // A different browser on the same IP is a separate visit.
  await track('203.0.113.12', { ua: IPHONE });
  assert.equal((await rowsFor('203.0.113.12')).length, 2);
});

test('bots are flagged, and kept out of the default numbers', async () => {
  await track('203.0.113.13', { ua: GOOGLEBOT });
  const [row] = await rowsFor('203.0.113.13');
  assert.equal(row.isBot, true);
  assert.equal(row.deviceType, 'bot');
});

test('IPv4-mapped IPv6 is normalised; junk and missing Origin are ignored', async () => {
  await track('::ffff:203.0.113.14');
  assert.equal((await rowsFor('203.0.113.14')).length, 1);
  await track('not-an-ip');
  assert.equal((await prisma.visit.count({ where: { ip: 'not-an-ip' } })), 0);
  await track('203.0.113.15', { origin: 'https://evil.example' });
  await track('203.0.113.15', { origin: null });
  assert.equal((await rowsFor('203.0.113.15')).length, 0, 'other origins and non-browser clients are not counted');
});

test('Do Not Track and Global Privacy Control are respected', async () => {
  await track('203.0.113.16', { headers: { DNT: '1' } });
  await track('203.0.113.16', { headers: { 'Sec-GPC': '1' } });
  assert.equal((await rowsFor('203.0.113.16')).length, 0);
});

test('client-supplied fields are validated and cannot set server-derived ones', async () => {
  assert.equal((await track('203.0.113.17', { body: { path: 'no-leading-slash' } })).status, 400);
  assert.equal((await track('203.0.113.17', { body: { path: '/' + 'x'.repeat(400) } })).status, 400);
  assert.equal((await track('203.0.113.17', { body: { path: '/', ip: '1.2.3.4', country: 'US' } })).status, 400);
  assert.equal((await rowsFor('203.0.113.17')).length, 0);
});

test('edge location headers are ignored when no trusted proxy is configured', async () => {
  config.trustProxy = false;
  try {
    const app = createApp().listen(0, '127.0.0.1');
    await new Promise((r) => app.once('listening', r));
    const url = `http://127.0.0.1:${app.address().port}`;
    await fetch(`${url}/api/public/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: url, 'x-vercel-ip-country': 'US', 'User-Agent': WIN_CHROME },
      body: '{}',
    });
    await new Promise((r) => app.close(r));
    const row = await prisma.visit.findFirst({ where: { ip: '127.0.0.1', createdAt: { gte: new Date(Date.now() - 60_000) } }, orderBy: { createdAt: 'desc' } });
    assert.ok(row, 'the visit itself is recorded');
    assert.equal(row.country, null, 'a spoofed country header must not be recorded');
  } finally {
    config.trustProxy = 1;
    await prisma.visit.deleteMany({ where: { ip: '127.0.0.1', createdAt: { gte: new Date(Date.now() - 60_000) } } });
  }
});

test('a single IP cannot flood the log', async () => {
  const cap = config.visits.maxPerIpPerHour;
  for (let i = 0; i < cap + 5; i++) await track('203.0.113.20', { ua: `Mozilla/5.0 flood-${i}` });
  assert.equal((await rowsFor('203.0.113.20')).length, cap);
});

test('analytics API requires a session', async () => {
  for (const path of ['/api/admin/analytics', '/api/admin/analytics/visits']) {
    assert.equal((await fetch(base + path, { headers: { 'X-Forwarded-For': '203.0.113.251' } })).status, 401);
  }
  assert.equal((await fetch(`${base}/api/admin/analytics`, { method: 'DELETE', headers: { Origin: base } })).status, 401);
});

test('the signed-in owner is not counted as a visitor', async () => {
  const { cookie } = await adminSession();
  await fetch(`${base}/api/public/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookie, 'X-Forwarded-For': '203.0.113.30', 'User-Agent': WIN_CHROME },
    body: '{}',
  });
  assert.equal((await rowsFor('203.0.113.30')).length, 0);
});

test('analytics aggregates: totals, uniques, series, countries and devices', async () => {
  const { call } = await adminSession();
  const r = await call('GET', '/api/admin/analytics?range=24h');
  assert.equal(r.status, 200);
  const a = r.json;
  assert.equal(a.range, '24h');
  assert.equal(a.series.length, 24);
  assert.equal(a.retentionDays, config.visits.retentionDays);

  // Series totals reconcile with the headline totals.
  assert.equal(a.series.reduce((n, p) => n + p.visits, 0), a.totals.visits);
  assert.ok(a.totals.visitors <= a.totals.visits);
  assert.ok(a.totals.pageViews >= a.totals.visits);
  assert.ok(a.totals.bots >= 1);

  const country = (list, name) => list.find((c) => c.name === name);
  assert.ok(country(a.countries, 'HU')?.visits >= 1);
  assert.ok(country(a.countries, 'DE')?.visits >= 1);
  assert.ok(a.devices.some((d) => d.name === 'mobile'));
  assert.ok(a.devices.some((d) => d.name === 'desktop'));
  assert.ok(!a.devices.some((d) => d.name === 'bot'), 'bots excluded by default');
  assert.ok(a.referrers.some((d) => d.name === 'linkedin.com'));

  const withBots = (await call('GET', '/api/admin/analytics?range=24h&bots=1')).json;
  assert.ok(withBots.devices.some((d) => d.name === 'bot'));
  assert.ok(withBots.totals.visits > a.totals.visits);

  // Each range returns the right bucket count; bad input is rejected.
  for (const [range, n] of [['7d', 7], ['30d', 30], ['90d', 90]]) {
    assert.equal((await call('GET', `/api/admin/analytics?range=${range}`)).json.series.length, n);
  }
  assert.equal((await call('GET', '/api/admin/analytics?range=1y')).status, 400);
  assert.equal((await call('GET', '/api/admin/analytics?bots=maybe')).status, 400);
});

test('visits list: newest first, filters, pagination, no bots by default', async () => {
  const { call } = await adminSession();
  const all = await call('GET', '/api/admin/analytics/visits?limit=100');
  assert.equal(all.status, 200);
  assert.ok(all.json.items.every((v) => !v.isBot));
  const times = all.json.items.map((v) => v.createdAt);
  assert.deepEqual(times, [...times].sort().reverse());

  const hu = await call('GET', '/api/admin/analytics/visits?country=HU');
  assert.ok(hu.json.items.length >= 1 && hu.json.items.every((v) => v.country === 'HU'));
  const byIp = await call('GET', '/api/admin/analytics/visits?ip=203.0.113.10');
  assert.equal(byIp.json.items.length, 1);
  assert.equal(byIp.json.items[0].ip, '203.0.113.10');

  const page1 = await call('GET', '/api/admin/analytics/visits?limit=2&ip=203.0.113.');
  assert.equal(page1.json.items.length, 2);
  assert.ok(page1.json.nextBefore);
  const page2 = await call('GET', `/api/admin/analytics/visits?limit=2&ip=203.0.113.&before=${encodeURIComponent(page1.json.nextBefore)}`);
  const ids = new Set([...page1.json.items, ...page2.json.items].map((v) => v.id));
  assert.equal(ids.size, page1.json.items.length + page2.json.items.length, 'pages do not overlap');

  const future = encodeURIComponent(new Date(Date.now() + 3_600_000).toISOString());
  assert.equal((await call('GET', `/api/admin/analytics/visits?from=${future}`)).json.items.length, 0, 'from= scopes the list to the selected range');
  assert.equal((await call('GET', '/api/admin/analytics/visits?ip=1%27%3BDROP')).status, 400);
  assert.equal((await call('GET', '/api/admin/analytics/visits?country=hungary')).status, 400);
  assert.equal((await call('GET', '/api/admin/analytics/visits?limit=9999')).status, 400);
});

test('retention: visits older than the limit are deleted', async () => {
  const { cleanupExpired } = await import('../lib/maintenance.js');
  const old = new Date(Date.now() - (config.visits.retentionDays + 1) * 86_400_000);
  await prisma.visit.create({ data: { ip: '203.0.113.40', deviceType: 'desktop', createdAt: old, lastSeenAt: old } });
  await prisma.visit.create({ data: { ip: '203.0.113.41', deviceType: 'desktop' } });
  await cleanupExpired({ force: true });
  assert.equal((await rowsFor('203.0.113.40')).length, 0);
  assert.equal((await rowsFor('203.0.113.41')).length, 1);
});

test('owner can clear all analytics data, and it is audited', async (t) => {
  // Clearing is destructive, so only exercise it when the database holds nothing but this file's rows.
  const real = await prisma.visit.count({ where: { NOT: { OR: [{ ip: { startsWith: '203.0.113.' } }, { ip: { startsWith: '198.51.100.' } }] } } });
  if (real > 0) return t.skip(`database has ${real} real visits; not clearing them`);
  const { call } = await adminSession();
  const before = await prisma.visit.count();
  assert.ok(before > 0);
  const r = await call('DELETE', '/api/admin/analytics');
  assert.equal(r.status, 200);
  assert.equal(r.json.deleted, before);
  assert.equal(await prisma.visit.count(), 0);
  assert.ok(await prisma.auditLog.findFirst({ where: { action: 'analytics.clear', userId } }));
});
