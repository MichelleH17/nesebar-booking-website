---
name: project-setup
description: Use when scaffolding, installing dependencies, configuring modules, initializing the SQLite database, seeding dummy data, or setting env vars in the nessebar repo — or when the dev server fails from missing config/DB.
---

# Nessebar Project Setup

## Overview
How to take this repo from the bare Nuxt 4 scaffold to a runnable app. Spec: `docs/superpowers/specs/2026-07-06-nessebar-family-reservations-design.md`. **Never git commit or push in this repo** — private project on a company GitHub identity.

## Dependencies (all free/open-source)
```bash
npm i @tailwindcss/vite tailwindcss gsap nuxt-auth-utils drizzle-orm better-sqlite3 nodemailer
npm i -D drizzle-kit @types/better-sqlite3 @types/nodemailer
npx nuxi module add fonts
```
No paid services, ever. No EmailJS/Formspree/cloud DBs.

## Configuration
- `nuxt.config.ts`: add `@tailwindcss/vite` to `vite.plugins`, modules `['nuxt-auth-utils', '@nuxt/fonts']`, `css: ['~/assets/css/main.css']`.
- `runtimeConfig`: `sessionPassword` (nuxt-auth-utils needs `NUXT_SESSION_PASSWORD`, 32+ chars), `smtpHost/Port/User/Pass`, `mailTo` (default `''`, supplied at runtime) — env names `NUXT_SMTP_HOST`, `NUXT_SMTP_PORT`, `NUXT_SMTP_USER`, `NUXT_SMTP_PASS`, `NUXT_MAIL_TO`.
- Create `app/assets/css/main.css` (with `@import "tailwindcss"` + `@theme` tokens) and `drizzle.config.ts` (dialect sqlite, schema `server/db/schema.ts`, url `.data/nessebar.db`) as part of setup; `mkdir -p .data` before `drizzle-kit push`.
- `.env` (gitignored): `NUXT_SESSION_PASSWORD` required for login to work; SMTP vars optional (missing → emails log to console).

## Database
- Schema: `server/db/schema.ts` (Drizzle). Tables: users, apartments, photos, reservations, guide_items — field list in the spec.
- Connection: `server/db/index.ts`, better-sqlite3 file at `.data/nessebar.db`. Ensure `.data/` exists and is gitignored.
- Migrations: `npx drizzle-kit push` (config in `drizzle.config.ts`).
- Seed: `server/db/seed.ts`, run with `npx tsx server/db/seed.ts` (idempotent — skip if users exist). Seeds 2 apartments (15B, 16B), admin Michaela + 3 family users (Vojta, Břeťa, Rodiče — shared parents account) with distinct hex colors, 4 mail recipients (Michaela real + 3 dummy), 8–10 placeholder photos, ~6 reservations (incl. one same-day changeover), guide items (3 beaches, 5 trips, practical info). Dummy passwords: document them in seed.ts and print them at the end of the seed run (dummy phase only).

## Verify setup
`npm run dev` → http://localhost:3000 renders landing; login with seeded admin works; `/api/reservations` returns seed data when logged in.

## Common mistakes
- Forgetting `NUXT_SESSION_PASSWORD` → nuxt-auth-utils session errors.
- Committing `.data/` or `.env` — both must be in `.gitignore` (and no commits anyway).
- Tailwind 4 needs the Vite plugin + `@import "tailwindcss"` in main.css — there is no `tailwind.config.js` by default; tokens go in `@theme`.
