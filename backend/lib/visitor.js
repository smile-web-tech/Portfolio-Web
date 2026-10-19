import net from 'node:net';
import Bowser from 'bowser';
import { isbot } from 'isbot';
import { config } from '../config.js';

// "::ffff:203.0.113.7" -> "203.0.113.7"; anything that isn't an IP is rejected.
export function normalizeIp(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const ip = raw.trim().replace(/^::ffff:/i, '');
  return net.isIP(ip) ? ip : null;
}

const MOBILE_OS = /Android|iOS/;

// Device, browser and OS from the User-Agent. Bots are detected first: they are the bulk of
// "visitors" on a personal site and would drown the real numbers.
export function parseUserAgent(ua) {
  if (!ua) return { deviceType: 'unknown', browser: null, os: null, isBot: false };
  const bot = isbot(ua);
  const { browser, os, platform } = Bowser.parse(ua);
  let deviceType = platform?.type ?? null; // mobile | tablet | desktop | tv
  if (!deviceType || deviceType === 'tv') deviceType = os?.name && !MOBILE_OS.test(os.name) ? 'desktop' : 'unknown';
  return {
    deviceType: bot ? 'bot' : deviceType,
    browser: browser?.name ? browser.name.slice(0, 40) : null,
    os: os?.name ? os.name.slice(0, 40) : null,
    isBot: bot,
  };
}

const decode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// Country/region/city come from the hosting platform's edge (Vercel, Cloudflare). They are only
// believed when a trusted proxy is configured: otherwise any client could claim any country.
export function geoFromHeaders(req) {
  if (!config.trustProxy) return { country: null, region: null, city: null };
  const country = (req.get('x-vercel-ip-country') || req.get('cf-ipcountry') || '').toUpperCase();
  const valid = /^[A-Z]{2}$/.test(country) && country !== 'XX' && country !== 'T1';
  const region = req.get('x-vercel-ip-country-region');
  const city = req.get('x-vercel-ip-city');
  return {
    country: valid ? country : null,
    region: valid && region ? decode(region).slice(0, 80) : null,
    city: valid && city ? decode(city).replace(/[\u0000-\u001f]/g, '').slice(0, 80) : null,
  };
}
