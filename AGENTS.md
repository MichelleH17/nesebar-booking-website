# AGENTS.md

Private family reservation site for two apartments (15B, 16B) in Nessebar, Bulgaria. Nuxt 4, Tailwind CSS 4, GSAP + ScrollTrigger, nuxt-auth-utils, SQLite via libSQL (Turso in prod) + Drizzle, Nodemailer. Czech-only UI. Free/open-source only — no paid services.

Confirm with the user before pushing.

Project skills (invoke before working in their area):
- `project-setup` — dependencies, config, DB init/migrations/seed, env vars
- `development` — conventions, roles/security rules, double-booking, email, structure, verification
- `animations-design` — palette, typography, GSAP patterns, motion vocabulary
- `deploy-database` — production deploy (Vercel + Turso), DB migration/backups, prod env vars

## Commands
- `npm run dev` — dev server at http://localhost:3000
- `npm run build` / `npm run generate` / `npm run preview`
- `npx drizzle-kit push` — apply schema to `.data/nessebar.db`
