import 'dotenv/config';
import { fileURLToPath } from 'node:url';

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const isVercel = Boolean(env.VERCEL);

const list = (value) => (value || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);

function int(value, fallback) {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Throws (not process.exit) so a misconfigured serverless function returns a 500
// instead of killing the runtime, and CLI scripts still surface the message.
function invalid(message) {
  throw new Error(`Config error: ${message}`);
}

if (!env.DATABASE_URL) invalid('DATABASE_URL is required');

let encryptionKey = null;
if (env.APP_ENCRYPTION_KEY) {
  encryptionKey = Buffer.from(env.APP_ENCRYPTION_KEY, 'base64');
  if (encryptionKey.length !== 32) invalid('APP_ENCRYPTION_KEY must be 32 bytes, base64 encoded (openssl rand -base64 32)');
}

// Extra origins allowed to call the admin API with credentials. Not needed when the admin
// dashboard and API share one origin (the Vercel layout): same-origin is always allowed.
const adminOrigins = list(env.ADMIN_ORIGINS);
const cookieSecure = env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd;

if (isProd) {
  if (!cookieSecure) invalid('COOKIE_SECURE must be true in production');
  if (adminOrigins.some((o) => !o.startsWith('https://'))) invalid('ADMIN_ORIGINS must be https in production');
}

function trustProxy() {
  if (env.TRUST_PROXY) return Number.isNaN(Number(env.TRUST_PROXY)) ? env.TRUST_PROXY : Number(env.TRUST_PROXY);
  return isVercel ? 1 : false; // Vercel sets X-Forwarded-For itself, one hop
}

export const config = {
  isProd,
  isVercel,
  host: env.HOST || '127.0.0.1',
  port: int(env.PORT, 5000),
  databaseUrl: env.DATABASE_URL,
  // Serverless: one connection per instance; use the pooled connection string.
  dbPoolMax: int(env.DB_POOL_MAX, isVercel ? 1 : 10),
  encryptionKey,
  adminOrigins,
  publicOrigins: list(env.PUBLIC_ORIGINS),
  trustProxy: trustProxy(),
  cookie: {
    secure: cookieSecure,
    // __Host- prefix pins the cookie to this exact host over HTTPS (no Domain, Path=/).
    name: cookieSecure ? '__Host-sid' : 'sid',
  },
  session: {
    idleMs: int(env.SESSION_IDLE_MINUTES, 120) * 60_000,
    absoluteMs: int(env.SESSION_ABSOLUTE_HOURS, 12) * 3_600_000,
  },
  lockout: { threshold: 5, baseMinutes: 15, maxMinutes: 24 * 60 },
  // Failed logins allowed per IP per window, counted from the audit log (shared across serverless instances).
  loginThrottle: { windowMs: 15 * 60_000, max: 10 },
  visits: {
    retentionDays: int(env.VISIT_RETENTION_DAYS, 90),
    sessionWindowMs: 30 * 60_000, // repeat loads inside this window count as one visit
    maxPerIpPerHour: 30, // caps junk from one address
  },
  storage: {
    blobToken: env.BLOB_READ_WRITE_TOKEN || null,
    localDir: fileURLToPath(new URL('./uploads/', import.meta.url)),
    // Vercel functions reject request bodies over 4.5 MB.
    maxUploadBytes: 4 * 1024 * 1024,
  },
};

export function requireEncryptionKey() {
  if (!config.encryptionKey) invalid('APP_ENCRYPTION_KEY is required (openssl rand -base64 32)');
  return config.encryptionKey;
}

// Missing upload/2FA settings must not take the public site down: the read-only API doesn't need
// them. Uploads answer 503 and 2FA errors until they are configured; this logs it loudly.
export function assertProductionReady() {
  if (!config.encryptionKey) console.error('WARNING: APP_ENCRYPTION_KEY is not set; two-factor authentication is unavailable.');
  if (isProd && !config.storage.blobToken) console.error('WARNING: BLOB_READ_WRITE_TOKEN is not set; file uploads are unavailable.');
}
