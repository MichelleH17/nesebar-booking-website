---
name: deploy-database
description: Use when deploying the nessebar app to production (Netlify/Vercel), preparing the database for hosting, migrating from local SQLite to Turso, handling photo uploads in production, backups, or applying schema changes to a live DB.
---

# Nessebar Deploy & Production Database

## Overview
Chosen direction (2026-07-23): **Netlify free tier + Turso (free libSQL cloud DB) + Netlify Blobs for photos**. Vercel is near-identical (swap Netlify Blobs → Vercel Blob). Everything must stay free — no paid services.

**Why a swap is needed at all:** Netlify/Vercel are serverless — no persistent disk. The current dev setup (better-sqlite3 file at `.data/nessebar.db`, photos in `public/uploads/`) would be wiped on every deploy/cold start. On any persistent-disk host (VPS, Docker, Fly.io) the app deploys unchanged — keep that in mind if the target ever changes.

**Turso vs. Supabase (revisit only if requirements change):** considered 2026-07-30. Turso is just remote SQLite — same schema, same Drizzle queries, no ORM/dialect rewrite, stays free. Supabase is hosted Postgres — would need a schema rewrite (SQLite → Postgres types), a new Drizzle dialect, and paid tiers past free-tier limits, conflicting with the free/open-source-only rule. Turso stays the pick unless a Supabase-specific feature (auth/storage/realtime) becomes a real requirement.

**Day-to-day with Turso:** locally nothing changes — still a plain SQLite file, same `drizzle-kit push`, same query syntax, no dashboard to live in. The only code delta is the async driver (see step 3 below). In prod it's the same Drizzle client pointed at a URL + auth token instead of a file path; the `turso` CLI is used once during setup (create db, grab url/token), not touched routinely afterward.

## Migration to Turso (do once, before first deploy)
Local dev keeps a plain SQLite file — the libSQL client reads `file:` URLs, so one driver serves both.

1. `npm i @libsql/client` (drop `better-sqlite3` + its types when done).
2. `server/db/index.ts`: `drizzle-orm/libsql` + `createClient({ url, authToken })`; url from env `TURSO_DATABASE_URL` (fallback `file:.data/nessebar.db`), token `TURSO_AUTH_TOKEN` (unset locally).
3. **The libSQL driver is async.** better-sqlite3 was sync. Every `.all()`/`.get()`/`.run()` call in `server/api/**` and `server/db/seed.ts` must gain `await` (method names stay the same). Transactions become `await db.transaction(async (tx) => …)` — the double-booking overlap check MUST stay inside one transaction.
4. `drizzle.config.ts`: `dialect: 'turso'`, `dbCredentials: { url, authToken }` from env — keep local push working by defaulting url to `file:.data/nessebar.db`.
5. Verify locally (`npm run dev`, `npm test`, seed run) before touching prod.

Turso setup: `turso db create nessebar` → `turso db show nessebar --url` + `turso db tokens create nessebar` → set both env vars, then `npx drizzle-kit push` and run the seed against prod once.

## Photos in production
`server/api/photos/index.post.ts` and `[id].delete.ts` write to `public/uploads/` — serverless-hostile. Swap to a blob store: store on upload, delete on delete, and add a server route (e.g. `server/routes/uploads/[...path].get.ts`) that streams from the blob store so existing `/uploads/…` URLs in the DB keep working. Locally, keep the filesystem path (branch on whether the blob store is available).
- **Netlify**: `@netlify/blobs` (free tier).
- **Vercel**: `@vercel/blob` (free tier) — same store/delete/stream pattern, different client. Uploads via `put()`, deletes via `del()`; `put()` returns a public URL, so the streaming route only needs to redirect/proxy to it rather than reading raw bytes back out.

## Netlify config
- Nitro auto-detects Netlify — no preset config needed. Build command `npm run build`, publish dir handled by the adapter.
- Env vars to set in the Netlify UI: `NUXT_SESSION_PASSWORD` (fresh 32+ chars — NOT the dev one), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NUXT_SMTP_HOST/PORT/USER/PASS`, `NUXT_MAIL_TO`.
- SMTP from functions works (Nodemailer); missing SMTP vars → emails log to console, same as dev.

## Vercel config (equivalent path, if chosen instead of Netlify)
- Nitro auto-detects Vercel too — no preset config needed. Build command `npm run build`.
- `@vercel/blob` needs a store created in the Vercel dashboard (or `vercel blob store add`); this mints `BLOB_READ_WRITE_TOKEN` automatically when linked to the project — no manual token generation like Turso's.
- Env vars to set in the Vercel UI (Project Settings → Environment Variables): `NUXT_SESSION_PASSWORD` (fresh 32+ chars — NOT the dev one), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `NUXT_SMTP_HOST/PORT/USER/PASS`, `NUXT_MAIL_TO`.
- SMTP from functions works the same as Netlify (Nodemailer); missing SMTP vars → emails log to console.
- Everything else (Turso migration, schema changes, backups, seed/credentials cleanup) is identical regardless of which host is picked.

## Before going live (repo becomes public too)
- `server/db/seed.ts` is gitignored (real family names/emails and login passwords) and reads passwords from `SEED_ADMIN_PASSWORD`/`SEED_FAMILY_PASSWORD`/`SEED_DEMO_PASSWORD` env vars — nothing to scrub here anymore.
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
- On Vercel, forgetting to link the Blob store to the project → `BLOB_READ_WRITE_TOKEN` missing at build/runtime and uploads fail.
- Testing only `npm run dev` — run `npm run build && node .output/server/index.mjs` at least once before deploying; dev mode hides serverless issues.
