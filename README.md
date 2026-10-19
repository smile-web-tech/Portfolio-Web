# Ysmayyl | Portfolio + Admin CMS

React/Vite portfolio whose content (profile, projects, experience, education, skills, images, links) is managed from a password-protected admin panel. Deploys to **Vercel** as one project:

| Path | What | Code |
| --- | --- | --- |
| `/` | Public portfolio (React + GSAP) | `src/` |
| `/admin/` | Admin dashboard (React + Tailwind) | `admin-dashboard/` |
| `/api/*` | Express API as one serverless function | `api/index.js` → `backend/` |

Everything is same-origin, so the session cookie is `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict` and no CORS is needed.

## What the admin can edit

Everything the site shows: name, job title, bio, email/phone, GitHub/LinkedIn/X links, hero/about images, CV (PDF); **projects** (description, tech tags, thumbnail, any number of links); **work experience** (logo, dates, titled blocks of `**highlighted**` bullets, progress bar); **education**; **skills** (grouped, with icons). Every list supports add / edit / delete, manual ordering, and a *Published* switch to keep drafts hidden. A **Media** library handles uploads.

## Visitor analytics

The site logs each visit to your own database (no third-party tracker; the old `iospo.org` counter is gone). **Admin → Visitors** shows visits, unique visitors (distinct IPs), page views, a per-day/hour chart, countries, devices, browsers, operating systems, referrers, and a searchable list of recent visits with IP, city/country and device. Filter by 24 h / 7 / 30 / 90 days and show or hide bots; click an IP or country to drill in.

- **Location** comes from Vercel's edge headers (`x-vercel-ip-country`, `-city`), so it appears once deployed. On localhost, location is "Unknown" unless you run the API with `TRUST_PROXY=1` and send those headers yourself. Headers are ignored when no trusted proxy is configured, so a client can't fake its country.
- **One visit = one browser session.** The page sends a single beacon per tab session; reloads within 30 minutes from the same IP and browser add to *page views*. Crawlers are detected from their User-Agent and kept out of the default numbers.
- **Not counted:** you while signed in to the admin, and anyone sending *Do Not Track* or *Global Privacy Control*.
- **Privacy:** IP addresses are personal data. Visits are deleted after 90 days (`VISIT_RETENTION_DAYS`) and can be wiped at any time from the Visitors page. If you have visitors in the EU, mention analytics in a privacy notice.
- Only the path, referrer *hostname* and language are taken from the page; everything else is derived server-side. Each IP is capped at 30 new visits per hour.

## Deploy on Vercel

1. **Database**: Vercel dashboard → Storage → add **Neon Postgres** and connect it to the project. This sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (used for migrations).
2. **File storage**: Storage → add a **Blob** store and connect it. This sets `BLOB_READ_WRITE_TOKEN`.
3. **Encryption key**: add env var `APP_ENCRYPTION_KEY` = output of `openssl rand -base64 32` (encrypts 2FA secrets at rest).
4. Import the repo with the project root at the repo root. `vercel.json` sets the install/build commands. Production deploys run `prisma migrate deploy`; preview deploys only generate the client, so scope the database env vars to Production (or use a Neon branch) so previews never share production data.
5. **Seed the current content and create your admin** (once, from your machine, with the production values from Vercel → Settings → Environment Variables):

   ```bash
   cd backend && npm ci
   export DATABASE_URL='<DATABASE_URL_UNPOOLED value>'  APP_ENCRYPTION_KEY='<same value>'
   npm run db:seed                                   # imports today's site content (skips if content exists)
   ADMIN_EMAIL=you@example.com npm run create-admin  # prompts for the password (min 12 chars)
   ```
6. Open `https://<your-domain>/admin/`, sign in, then **Security → turn on two-factor authentication** and save the recovery codes.

Forgot the password or locked out? Re-run `create-admin` with the same email: it resets the password, clears the lockout and signs out every session. There is intentionally no signup or reset endpoint.

### Vercel limits to know about
- Uploads go through the function, which Vercel caps at 4.5 MB, so the limit is **4 MB per file** (the admin shrinks large photos in the browser first). For a bigger CV, host it elsewhere and paste the link.
- Rate limits held in memory are per instance, so login throttling is stored in Postgres instead. For extra protection add a Vercel Firewall rate-limit rule on `/api/auth/login`.
- Public content is cached at the edge for 60 s, so edits appear within about a minute.

## Local development

```bash
cp .env.example .env                       # Postgres password for docker compose
docker compose up -d db                    # Postgres on 127.0.0.1:5432
cp backend/.env.example backend/.env       # set DATABASE_URL (same password) and APP_ENCRYPTION_KEY
cd backend && npm ci && npx prisma migrate deploy && npm run db:seed
ADMIN_EMAIL=you@example.com npm run create-admin
cd ..

# three terminals, from the repo root
npm run dev:api                            # API on :5000 (local uploads go to backend/uploads)
npm run dev:admin                          # http://localhost:5175/admin/
npm run dev                                # public site on http://localhost:5173
```

Tests (real database, throwaway rows): `cd backend && npm test`.

## Security model

- **No public write access.** Every `/api/admin/*` route needs a server-side session; the only unauthenticated routes are `GET /api/public/portfolio`, `/api/health` and `POST /api/auth/login`. There is no registration endpoint.
- **Passwords**: scrypt (OWASP parameters), 12+ chars, constant-time login (unknown emails cost the same as wrong passwords), generic error messages.
- **Brute force**: per-account lockout with exponential backoff (5 failures → 15 min, doubling) and per-IP throttling backed by the database.
- **2FA**: TOTP with replay protection and one-time recovery codes; secrets encrypted with AES-256-GCM.
- **Sessions**: random 256-bit tokens stored only as SHA-256 hashes; idle timeout 2 h, absolute 12 h; fresh token on every login; revoke any device from the Security page; changing the password signs out all other sessions.
- **CSRF**: `SameSite=Strict` cookie + per-session CSRF token header + same-origin check on every state-changing request.
- **Input**: every body is validated with strict zod schemas (unknown fields rejected); links must be http(s), images must be uploaded files, `/pictures/...` paths or https; nothing from the database is rendered as HTML.
- **Uploads**: type decided by file content, not name; images are re-encoded (metadata stripped, polyglots neutralised), SVGs rasterised after a denylist check, PDFs stored as-is; random filenames; files live on a separate origin (Vercel Blob).
- **Visitor beacon** is the only public write: strict schema, same-origin only, per-IP cap, no cookies, answers 204 to everything.
- **Audit log** of sign-ins (including failures) and every change, kept 180 days. Errors never expose stack traces or SQL.
- **Headers**: CSP, `X-Frame-Options: DENY`, no-referrer and `noindex` on `/admin/`; HSTS site-wide; strict API headers via helmet.

Not covered: a CSP on the public site (it uses inline styles and third-party scripts that I could not verify end to end), and Vercel account security itself. Protect the Vercel account with 2FA too.
