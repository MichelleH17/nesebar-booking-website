# CLAUDE.md

Private family reservation site for two apartments (15B, 16B) in Nessebar, Bulgaria. Nuxt 4, Tailwind CSS 4, GSAP + ScrollTrigger, nuxt-auth-utils, SQLite (better-sqlite3 + Drizzle), Nodemailer. Czech-only UI. Free/open-source only — no paid services.

Git commits/pushes use the personal `MichelleH17` GitHub account (remote: `github.com/MichelleH17/nesebar-booking-website`, private), not the company identity. Confirm with the user before pushing.

Project skills (invoke before working in their area):
- `project-setup` — dependencies, config, DB init/migrations/seed, env vars
- `development` — conventions, roles/security rules, double-booking, email, structure, verification
- `animations-design` — palette, typography, GSAP patterns, motion vocabulary
- `deploy-database` — production deploy (Netlify + Turso), DB migration/backups, prod env vars

## Commands
- `npm run dev` — dev server at http://localhost:3000. **Port 3000 belongs to the user — Claude must never start, kill, or browse it.** Claude uses 3001 only, started detached (background Bash shells die with the session):
  `nohup env PORT=3001 npm run dev > /tmp/nessebar-dev-3001.log 2>&1 & disown`
  Check `lsof -ti:3001` first and reuse it if already up.
- `npm run build` / `npm run generate` / `npm run preview`
- `npx drizzle-kit push` — apply schema to `.data/nessebar.db`
