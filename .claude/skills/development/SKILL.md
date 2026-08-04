---
name: development
description: Use when writing or changing any feature code in the nessebar repo — pages, components, API routes, auth, reservations, calendar, admin, email — or when unsure about conventions, roles, validation, or how to verify work.
---

# Nessebar Development Conventions

## Overview
Private family reservation site for apartments 15B/16B in Nessebar. Design spec (single source of truth for behavior): `docs/superpowers/specs/2026-07-06-nessebar-family-reservations-design.md`. **Never git commit or push in this repo.**

## Non-negotiable rules
- **Security is server-side.** Roles: `guest` (logged-in friend), `family`, `admin`. Every API route uses `requireAuth` / `requireFamily` (403 for guests) / `requireAdmin` from `server/utils/session.ts`; non-admins may only modify reservations where `userId` matches their session. Guests get anonymized reservation reads (others' rows = apartment + dates only — no names, colors, notes, prices) and no stats/occupancy. Page middleware is UX, not security.
- **Double-booking check** lives in the reservation create/update handler only (never client-only): same apartment, `status = 'active'`, `arrival < existing.departure AND departure > existing.arrival`, excluding the edited id. Conflict → 409 with Czech message. Same-day changeover allowed.
- **Email never blocks.** `sendReservationMail()` is try/caught; failures are logged and reported in the response, the reservation still succeeds. Missing SMTP env → log rendered email to console.
- **All user-facing copy is Czech.** Warm, familial tone (this is for family, not customers). **Code comments are English** — even when they describe Czech UI (quoting a Czech label or route inside an English sentence is fine).
- **Public pages leak nothing** — no reservation data reachable without a session.

## Structure
- Pages: `app/pages/` — `index.vue`, `okoli.vue`, `prihlaseni.vue`, `kalendar.vue`, `rezervace/nova.vue`, `rezervace/[id].vue`, `admin/*`.
- Components: `app/components/`, grouped by domain (`calendar/`, `reservation/`, `admin/`, `landing/`, `guide/`).
- API: `server/api/`, thin handlers; shared logic in `server/utils/` (e.g. `mail.ts`, `ical.ts`, overlap check).
- DB access only from server code via Drizzle (`server/db/`). Never import db in app code.
- Validate API input with zod-style checks (or manual guards) before touching the DB; dates as `YYYY-MM-DD` strings, compare lexically. Require `arrival < departure` (min 1 night, 400 on violation). On create, `userId` is always taken from the session — never from the request body (admin overrides happen via edit).
- Emails are sent on **create, edit and cancel**. Recipients come from the reservation's `notifyEmails` (chosen in the form from active `mail_recipients`; validated server-side, fallback to first active recipient when empty).
- Same-day changeover is allowed, but people arrive/depart at different times — the form and calendar detail must show the Czech coordination hint pointing to the notes field when dates touch another reservation.

## TypeScript (strict + `noUncheckedIndexedAccess` — Nuxt defaults)
Indexed access (`arr[i]`, `record[key]`) is `T | undefined`; the IDE's Project Errors tab and `npx nuxi typecheck` both enforce it. Patterns used in this repo:
- **Admin drafts editors** (`drafts = ref<Record<id, T>>`): `v-if="drafts[x.id]"` does NOT narrow later template accesses. Pair rows in a computed — `rows = computed(() => items.value.map(x => ({ x, draft: drafts.value[x.id] })))` — then `v-for="{ x, draft } in rows"` + `v-if="draft"` (identifier narrowing works). Save handlers guard with `if (!draft) return`.
- **Date parsing**: destructure with defaults — `const [y = 0, m = 1, d = 1] = date.split('-').map(Number)`.
- **Lookup tables**: key `Record`s by the exact union (e.g. `Record<Variant, string>`), never `Record<string, string>`.
- **`useLocalizedContent`'s `loc()`** accepts any `object` — don't add index signatures to interfaces to satisfy it.
- **First-element access**: assign to a const and guard (`const first = list[0]; if (first) …`), not `list.length` checks.

## UI conventions
- Mobile-first: build the phone layout first, enhance with `md:`/`lg:`. Calendar detail opens as bottom sheet on mobile.
- Design tokens from `@theme` in `app/assets/css/main.css` only — no ad-hoc hex in components. See the `animations-design` skill for palette, type, and motion.
- Per-user calendar colors come from `users.color`.
- Price calculator: only shown when the "non-family guest" toggle is on; nights × nightlyRate (× people if `perPersonPricing`); family default = free (priceApplied null).

## Verification (before claiming anything works)
Run `npx nuxi typecheck` — must report 0 errors (this is what the IDE's Project Errors tab shows). Then run `npm run dev` and exercise the real flow in the browser (Chrome DevTools MCP): the role zones, the feature you changed, and — if you touched reservations — a double-booking attempt and the console email output. Spec §Verification has the full checklist. Evidence before assertions.
