---
name: deploy-database
description: Use when deploying the nessebar app to production (Netlify/Vercel), preparing the database for hosting, migrating from local SQLite to Turso, handling photo uploads in production, backups, or applying schema changes to a live DB.
---

# Nessebar Deploy & Production Database

## Overview
Chosen direction (2026-07-23): **Netlify free tier + Turso (free libSQL cloud DB) + Netlify Blobs for photos**. Vercel is near-identical (swap Netlify Blobs → Vercel Blob). Everything must stay free — no paid services.

**Why a swap is needed at all:** Netlify/Vercel are serverless — no persistent disk. The current dev setup (better-sqlite3 file at `.data/nessebar.db`, photos in `public/uploads/`) would be wiped on every deploy/cold start. On any persistent-disk host (VPS, Docker, Fly.io) the app deploys unchanged — keep that in mind if the target ever changes.

## Migration to Turso (do once, before first deploy)
Local dev keeps a plain SQLite file — the libSQL client reads `file:` URLs, so one driver serves both.

1. `npm i @libsql/client` (drop `better-sqlite3` + its types when done).
2. `server/db/index.ts`: `drizzle-orm/libsql` + `createClient({ url, authToken })`; url from env `TURSO_DATABASE_URL` (fallback `file:.data/nessebar.db`), token `TURSO_AUTH_TOKEN` (unset locally).
3. **The libSQL driver is async.** better-sqlite3 was sync. Every `.all()`/`.get()`/`.run()` call in `server/api/**` and `server/db/seed.ts` must gain `await` (method names stay the same). Transactions become `await db.transaction(async (tx) => …)` — the double-booking overlap check MUST stay inside one transaction.
4. `drizzle.config.ts`: `dialect: 'turso'`, `dbCredentials: { url, authToken }` from env — keep local push working by defaulting url to `file:.data/nessebar.db`.
5. Verify locally (`npm run dev`, `npm test`, seed run) before touching prod.

Turso setup: `turso db create nessebar` → `turso db show nessebar --url` + `turso db tokens create nessebar` → set both env vars, then `npx drizzle-kit push` and run the seed against prod once.

## Photos in production
`server/api/photos/index.post.ts` and `[id].delete.ts` write to `public/uploads/` — serverless-hostile. Swap to **Netlify Blobs** (`@netlify/blobs`, free tier): store on upload, delete on delete, and add a server route (e.g. `server/routes/uploads/[...path].get.ts`) that streams from the blob store so existing `/uploads/…` URLs in the DB keep working. Locally, keep the filesystem path (branch on whether Netlify Blobs is available).

## Netlify config
- Nitro auto-detects Netlify — no preset config needed. Build command `npm run build`, publish dir handled by the adapter.
- Env vars to set in the Netlify UI: `NUXT_SESSION_PASSWORD` (fresh 32+ chars — NOT the dev one), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NUXT_SMTP_HOST/PORT/USER/PASS`, `NUXT_MAIL_TO`.
- SMTP from functions works (Nodemailer); missing SMTP vars → emails log to console, same as dev.

## Before going live (repo becomes public too)
- **Remove real credentials from `server/db/seed.ts`** — Michaela's real password is currently hardcoded there. Move to env (e.g. `SEED_ADMIN_PASSWORD`) or change the password via admin UI after seeding prod. No real passwords/PII in committed files.
- Seed prod with real users/rates/texts, not the dummy set.

## Schema changes on a live DB
1. Back up first: `turso db shell nessebar .dump > backup-$(date +%F).sql`
2. Test the change locally against the file DB (`npx drizzle-kit push`), run the app + tests.
3. Push to prod with Turso env vars set. SQLite can't drop/alter columns freely — destructive changes may need a manual copy-table migration; drizzle-kit will warn.

## Backups
`turso db shell nessebar .dump > backup.sql` — run before every schema change and periodically (photos live in Blobs, not the DB; export those separately if they matter).

## Common mistakes
- Forgetting an `await` after the async swap → route "works" but returns a Promise/empty data; grep all `.all()`, `.get()`, `.run()`, `.transaction(` sites.
- Running `drizzle-kit push` against prod credentials thinking it's local — check which env vars are set first.
- Reusing the dev `NUXT_SESSION_PASSWORD` in prod.
- Deploying with the filesystem photo routes → uploads silently vanish on next deploy.
- Testing only `npm run dev` — run `npm run build && node .output/server/index.mjs` at least once before deploying; dev mode hides serverless issues.
