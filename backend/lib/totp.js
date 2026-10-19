import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import { sha256 } from './crypto.js';

const ISSUER = 'Portfolio Admin';
const PERIOD = 30;

function totp(secretBase32, label) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function newSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export async function provisioning(secretBase32, email) {
  const uri = totp(secretBase32, email).toString();
  return { uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 240 }) };
}

// Returns the accepted time step, or null. `lastStep` blocks replaying a code.
export function verifyCode(secretBase32, code, lastStep) {
  if (!/^\d{6}$/.test(String(code))) return null;
  const delta = totp(secretBase32, 'x').validate({ token: String(code), window: 1 });
  if (delta === null) return null;
  const step = Math.floor(Date.now() / 1000 / PERIOD) + delta;
  if (lastStep != null && step <= lastStep) return null;
  return step;
}

export function newRecoveryCodes(count = 8) {
  const plain = Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString('hex');
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  return { plain, hashed: plain.map((c) => sha256(c)) };
}

export const hashRecoveryCode = (code) => sha256(String(code).trim().toLowerCase());
