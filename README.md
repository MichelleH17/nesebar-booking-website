# Nesebar Booking Website

Private family reservation site for two apartments (15B, 16B) in Nesebar, Bulgaria. Built with Nuxt 4, Tailwind CSS 4, GSAP + ScrollTrigger, SQLite via libSQL (Turso in production) with Drizzle ORM, and Nodemailer for email notifications. Czech-only UI.

## Features

- Shared reservation calendar for both apartments with occupancy overview
- Role-based access: admin, family members, and a read-only demo account
- Reservation booking form with price calculation
- Area guide (beaches, trips, practical info) with weather widget
- Admin panel for managing apartments, photos, users, and site text
- Email notifications on reservation create/update/cancel

## Setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the values (session password, SMTP credentials, mail recipient, seed passwords).

Apply the database schema and seed local dev data:

```bash
npx drizzle-kit push
npm run db:seed
```

## Development

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Other commands

```bash
npm run build     # production build
npm run generate  # static generation
npm run preview   # preview production build
npm run test      # run tests
```
