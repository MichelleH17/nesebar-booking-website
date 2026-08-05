# CLAUDE.md

Private family reservation site for two apartments (15B, 16B) in Nessebar, Bulgaria. Nuxt 4, Tailwind CSS 4, GSAP + ScrollTrigger, nuxt-auth-utils, SQLite via libSQL (Turso in prod) + Drizzle, Nodemailer. Czech-only UI. Free/open-source only — no paid services.

Git commits/pushes use the personal `MichelleH17` GitHub account (remote: `github.com/MichelleH17/nesebar-booking-website`, private), not the company identity. Confirm with the user before pushing.

Project skills (invoke before working in their area):
- `project-setup` — dependencies, config, DB init/migrations/seed, env vars
- `development` — conventions, roles/security rules, double-booking, email, structure, verification
- `animations-design` — palette, typography, GSAP patterns, motion vocabulary
- `deploy-database` — production deploy (Vercel + Turso), DB migration/backups, prod env vars

## Commands
- `pnpm dev` — dev server at http://localhost:3000. **Port 3000 belongs to the user — Claude must never start, kill, or browse it.** Claude uses 3001 only, started detached (background Bash shells die with the session):
  `nohup env PORT=3001 pnpm dev > /tmp/nessebar-dev-3001.log 2>&1 & disown`
  Check `lsof -ti:3001` first and reuse it if already up.
- `pnpm build` / `pnpm generate` / `pnpm preview`
- `pnpm drizzle-kit push` — apply schema to `.data/nessebar.db`
