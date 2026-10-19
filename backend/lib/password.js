import crypto from 'node:crypto';
import { promisify } from 'node:util';

// scrypt from Node's standard library: memory-hard, no native addon to break in serverless
// bundling. Parameters follow the OWASP minimum (N=2^17, r=8, p=1 = 128 MiB).
const scrypt = promisify(crypto.scrypt);
const PARAMS = { N: 2 ** 17, r: 8, p: 1 };
const KEYLEN = 64;
const maxmem = 256 * 1024 * 1024;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { ...PARAMS, maxmem });
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(stored, password) {
  try {
    const [scheme, N, r, p, saltB64, keyB64] = stored.split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(keyB64, 'base64');
    const actual = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(N), r: Number(r), p: Number(p), maxmem,
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Verified against when the account does not exist, so response time doesn't reveal valid emails.
// Computed lazily to keep serverless cold starts cheap for requests that never log in.
let dummy;
export const getDummyHash = () => (dummy ??= hashPassword('not-a-real-password'));

const COMMON = new Set(['password', 'passw0rd', '123456789012', 'qwertyuiop12', 'administrator', 'letmein12345']);

export function passwordProblem(password, email = '') {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < 12) return 'Password must be at least 12 characters';
  if (password.length > 256) return 'Password is too long';
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return 'Password is too common';
  const name = email.split('@')[0].toLowerCase();
  if (name.length > 3 && lower.includes(name)) return 'Password must not contain your email name';
  if (new Set(password).size < 6) return 'Password needs more variety';
  return null;
}
