---
name: deploy-database
description: Use when deploying the nessebar app to production (Vercel/Netlify), preparing the database for hosting, migrating from local SQLite to Turso, handling photo uploads in production, backups, or applying schema changes to a live DB.
---

# Nessebar Deploy & Production Database

## Overview
Chosen direction (2026-08-05, supersedes the 2026-07-23 Netlify pick): **Vercel free tier + Turso (free libSQL cloud DB) + Vercel Blob for photos**. Everything must stay free — no paid services.

**Status: the code migration is done and merged.** The app already runs on the libSQL driver, `drizzle-kit` already targets `turso`, and uploads already branch to Vercel Blob. What remains is account setup (see "First deploy" below). The migration section is kept as a record of what changed and why.

**Why a swap is needed at all:** Netlify/Vercel are serverless — no persistent disk. The current dev setup (better-sqlite3 file at `.data/nessebar.db`, photos in `public/uploads/`) would be wiped on every deploy/cold start. On any persistent-disk host (VPS, Docker, Fly.io) the app deploys unchanged — keep that in mind if the target ever changes.

**Turso vs. Supabase (revisit only if requirements change):** considered 2026-07-30. Turso is just remote SQLite — same schema, same Drizzle queries, no ORM/dialect rewrite, stays free. Supabase is hosted Postgres — would need a schema rewrite (SQLite → Postgres types), a new Drizzle dialect, and paid tiers past free-tier limits, conflicting with the free/open-source-only rule. Turso stays the pick unless a Supabase-specific feature (auth/storage/realtime) becomes a real requirement.

**Day-to-day with Turso:** locally nothing changes — still a plain SQLite file, same `drizzle-kit push`, same query syntax, no dashboard to live in. The only code delta is the async driver (see step 3 below). In prod it's the same Drizzle client pointed at a URL + auth token instead of a file path; the `turso` CLI is used once during setup (create db, grab url/token), not touched routinely afterward.

## How the DB wiring works now
One driver serves both environments; the switch is purely env-var driven.

- `server/db/index.ts` builds a libSQL client from `TURSO_DATABASE_URL` (falling back to `file:.data/nessebar.db`) and `TURSO_AUTH_TOKEN` (unset locally). `useDb()` is still sync — only the queries became async.
- **The libSQL driver is async** (better-sqlite3 was sync). Every `.all()`/`.get()`/`.run()` is awaited; method names are unchanged. `saveUploadedImage`, `listOrphanUploads`, `assertNoConflict` and `resolveRecipients` became async as a result — new callers must await them.
- `drizzle.config.ts` uses `dialect: 'turso'` with the same env fallback, and `mkdirSync('.data')` up top because the libSQL client opens but never creates the directory for a local file DB.
- The double-booking check (`assertNoConflict` then the write, in `server/api/reservations/index.post.ts` and `[id].patch.ts`) runs inside `bookingTransaction(db, async (tx) => …)` and must stay there. Under better-sqlite3 the two statements were sync with no yield point between them, so the event loop made them effectively atomic; async libSQL removed that guarantee and turned it into a real TOCTOU race. The transaction restores it: libSQL opens it with BEGIN IMMEDIATE, so the losing writer gets SQLITE_BUSY — `bookingTransaction` maps that to the same 409 the overlap check returns, rather than letting a raw 500 escape.

### The bundler gotcha (do not undo this)
`nuxt.config.ts` carries a production-only Nitro alias:

```ts
nitro: {
  alias: process.env.NODE_ENV === 'production' ? {
    '@libsql/client/node': '@libsql/client/http',
    'drizzle-orm/libsql/node': 'drizzle-orm/libsql/http',
  } : {},
}
```

`server/db/index.ts` therefore imports the explicit `/node` subpaths, never the bare `@libsql/client` / `drizzle-orm/libsql` entries. Why all of this:
- The default entries require the native `libsql` binary, which Nitro cannot trace into a serverless bundle — the deployed function crashes at startup with `Cannot find module '@libsql/darwin-arm64'` (or `@libsql/linux-x64-gnu` on Vercel).
- Aliasing the *bare* specifier (`'@libsql/client': '@libsql/client/web'`) recurses — the resolver rewrites the prefix repeatedly and the build dies on `@libsql/client/web/web/web/web`. Aliasing the `/node` subpath to a different subpath avoids that.
- `/http` rather than `/web`: the `/web` entry pulls in a `ws.js` import that Nitro traces to a broken path under pnpm (`ERR_MODULE_NOT_FOUND ... lib-esm/ws.js`). `/http` has no WebSocket dependency and is all Turso needs.
- Consequence: **use the `https://` Turso URL, not `libsql://`** — the HTTP-only client rejects the `libsql:` protocol.
- Consequence: `node .output/server/index.mjs` locally now needs real Turso credentials; a production build can no longer open the local file DB. Dev (`pnpm dev`) is unaffected.

## Photos in production
`server/utils/uploads.ts` owns both paths and branches on `BLOB_READ_WRITE_TOKEN`:
- Set (Vercel) → `put()` to Vercel Blob, and the **absolute** blob URL is stored in the DB.
- Unset (local) → written to `public/uploads/`, stored as `/uploads/…`.

`deleteUploadedImage(url)` mirrors it, branching on `url.startsWith('http')`, and never throws. Both photo routes and the guide-item delete route call it. No streaming/proxy route is needed — `put()` returns a public URL that goes straight into the DB, so old `/uploads/…` rows and new blob rows coexist.

`listOrphanUploads()` covers both backends — it lists the blob store when `BLOB_READ_WRITE_TOKEN` is set, otherwise the local directory — and returns **URLs in the form the DB stores**, not bare filenames. Deletes still call `deleteUploadedImage` immediately for blob URLs (unique per upload, so nothing else can reference them) rather than waiting for the manual sweep.

Both `saveUploadedImage` and `useDb()` throw a clear error when their production env var is missing on Vercel/Netlify, instead of falling back to the local path and dying on the read-only FS.

## First deploy (account setup — the remaining work)
1. **Turso**: `turso db create nessebar` → `turso db show nessebar --url` (take the `https://` form) + `turso db tokens create nessebar`.
2. Point the local shell at prod and initialise the schema: `TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… npx drizzle-kit push`, then run the seed the same way — once, with real users/rates/texts.
3. **Vercel**: import the GitHub repo. Nitro auto-detects the platform, so no preset config is needed; leave the build command at the default.
4. Create a Blob store (dashboard → Storage → Blob, or `vercel blob store add`) and link it to the project — that mints `BLOB_READ_WRITE_TOKEN` automatically.
5. Set the rest in Project Settings → Environment Variables: `NUXT_SESSION_PASSWORD` (fresh 32+ chars — NOT the dev one), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NUXT_SMTP_HOST/PORT/USER/PASS`, `NUXT_MAIL_TO`.
6. SMTP from functions works (Nodemailer); missing SMTP vars → emails log to console, same as dev.

Netlify remains a viable fallback (swap `@vercel/blob` → `@netlify/blobs`); everything else — Turso, schema changes, backups — is host-independent.

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
- Forgetting an `await` on a new query → route "works" but returns a Promise/empty data; grep all `.all()`, `.get()`, `.run()`, `.transaction(` sites.
- Awaiting a chain before a sync method: `await db.select()….all().find(…)` calls `.find` on the query builder, not the rows. Write `(await db.select()….all()).find(…)`.
- Using the `libsql://` Turso URL instead of `https://` → the HTTP-only production client rejects the protocol.
- "Fixing" the Nitro alias by pointing the bare `@libsql/client` specifier somewhere → infinite prefix recursion at build time. See the bundler gotcha above.
- Running `drizzle-kit push` against prod credentials thinking it's local — check which env vars are set first.
- Reusing the dev `NUXT_SESSION_PASSWORD` in prod.
- Deploying with the filesystem photo routes → uploads silently vanish on next deploy.
- On Vercel, forgetting to link the Blob store to the project → `BLOB_READ_WRITE_TOKEN` missing at build/runtime and uploads fail.
- Testing only `pnpm dev` — run `pnpm build` and boot `.output/server/index.mjs` with Turso env vars at least once before deploying; dev mode hides serverless issues.
- Assuming port 3001 is free when smoke-testing a production build — a stale `pnpm dev` there will happily answer your curls with local-file data and make a broken bundle look fine. Check `lsof -ti:3001`, or use another port.
