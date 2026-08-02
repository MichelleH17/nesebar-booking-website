---
name: animations-design
description: Use when adding or changing any animation, GSAP/ScrollTrigger code, hover/motion effects, colors, typography, spacing, or visual styling in the nessebar repo — or when a section looks flat/janky or motion feels off-brand.
---

# Nessebar Animation & Design Language

## Overview
Luxury-minimal, calm, photography-led — the Marina design system (established 2026-07-22, homepage is the reference implementation). Clean white/grey sections, near-black navy type, uppercase tracked micro-labels, rounded cards, gentle motion. Never flashy, no dark full sections (client prefers lighter colors).

**Reference pages:** `app/pages/index.vue` + `app/components/landing/*` — when styling any other page or component, match these.

## Palette (tokens in `@theme`, `app/assets/css/main.css`)
These 9 are the only color tokens (audited 2026-08-02, every one in active use). The pre-Marina legacy palette (`paper`, `sage`, `teal`, `leaf`, …) and the `mist` duplicate were deleted; never reintroduce them — `mist` roles now use `cloud`.
- `--color-night #0D0F19` — near-black navy: headings, solid buttons, dark text on light
- `--color-cloud #F0F0F0` — the single light grey: section bands, cards on white, hairline borders (`border-cloud`), hover fills
- `--color-stone #59504F` — warm grey: body text on white
- `--color-sea #4A90A4` / `--color-sea-deep #2F6577` — brand blue: hero/CTA gradients; `sea-deep` also for links, focus rings, `ocean` button, eyebrow/accent labels (`font-medium`), demo-mode banner, `night` button hover; `bg-sea/10 text-sea-deep` = info hint (the former `indigo` token was removed 2026-07-23 — `sea-deep` took all its roles)
- `--color-off-white #FAF6EF` — warm off-white: hero/CTA gradient end (`from-sea to-off-white`) — never hardcode this hex, always use the token
- `--color-silver #9AA0A6` — neutral gray: anonymized/guest reservation bars (`bg-silver`) — matches the server's `GUEST_COLOR` constant, never hardcode this hex
- `--color-surface #FFFFFF` (white surfaces), `--color-ink #23261F` (header/footer text, ghost button text)

Contrast rules (WCAG AA): `night`/`stone` on white ✓, white on `night` ✓; never bright `sea` as text on light backgrounds.

## Typography
- Single typeface **Montserrat** (OFL, via @nuxt/fonts) for `--font-display`, `--font-sans`, `--font-heading` — weight/size differentiation only. Tailwind 4 has no `font-500` utility — use `font-medium`/`font-semibold`/`font-bold`.
- Section headings: `font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl`
- Hero h1: `text-5xl font-medium tracking-tight leading-[1.05] text-white sm:text-6xl`
- Micro-labels/eyebrows: `text-xs font-semibold uppercase tracking-[0.15em]` (eyebrow on photo: `tracking-[0.3em] text-white/80`)
- Body: `text-stone` on white, `text-white/85` on photo/gradient

## Component recipes (copy from these, don't invent)
- **Section rhythm**: full-width bands, alternate `bg-white` / `bg-cloud`, `px-6 py-10 sm:px-10 md:py-16 lg:py-20`, inner `mx-auto max-w-6xl`. A "card section" = `bg-white` section with one big `rounded-2xl bg-cloud p-8 sm:p-12` container (see WeatherWidget home mode).
- **Cards**: two forms. (1) Filled `rounded-2xl bg-cloud p-8 sm:p-10` on white sections (homepage apartments) — may lift on hover (`hover:-translate-y-1 hover:shadow-md`) *only if the card is a link*. (2) Bordered `rounded-2xl border border-cloud bg-white` (okolí guide cards) — static, no hover movement/shadow (non-clickable content must not look clickable). Heading `text-night`, body `text-stone`, meta uppercase `text-sea-deep font-medium`.
- **Buttons**: `UiBaseButton` Marina variants — `night`, `night-outline` (on light), `light`, `light-outline` (on photo/dark), `ocean` (brand-teal `sea-deep` solid, e.g. navbar Přihlásit, primary form submits), `ghost` (tertiary — back/cancel actions) — all `rounded-full` pills; Marina variants use uppercase tracked labels. Order convention: outline (secondary) first, solid (primary) second. These six are the only variants.
- **Tab / segmented pills** (admin Správa, reservation toggles): active = solid `bg-night text-white` (or `bg-white` on a grey track); inactive = `border border-cloud bg-white text-stone`. Use a **border**, never `shadow-sm`, for the resting state — a rounded pill's shadow reads unevenly (sides only).
- **Forms**: inputs/textareas/selects `rounded-xl border border-cloud bg-cloud/60 text-night`, focus `focus:border-sea-deep focus:bg-white focus:ring-2 focus:ring-sea-deep`; native file button `file:bg-cloud`; checkboxes `accent-sea-deep`; error text `text-red-700`.
- **Hero / photo CTA**: section `relative isolate overflow-hidden` (the `isolate` is required — the `-z-10` image layer paints behind page backgrounds without it); image or `bg-gradient-to-br from-sea to-off-white` base + overlay `bg-gradient-to-t from-night/85 via-night/35 to-night/10`; white text, content `justify-end` bottom-left. CTA above footer = same look via pure CSS gradient (no photo, no baked-in text).
- **Header/footer**: white, `border-cloud` hairline, minimal. Navbar: logo left; right group = language, Kalendář, Rezervovat, user, Odhlásit pill, hamburger (secondary links live in a right-aligned `rounded-2xl` panel, max ~half width, roomy `gap-5`). Footer mirrors navbar (brand left, tagline right).
- **Gallery tiles**: `rounded-2xl` overflow-hidden, `aspect-square object-cover`, image `hover:scale-[1.03]`.

## GSAP setup
- `app/plugins/gsap.client.ts` registers ScrollTrigger, provides `$gsap`/`$ScrollTrigger`, and debounces `ScrollTrigger.refresh()` on resize (prevents jank).
- Animate via the `useScrollAnimations` composable: scope tweens with `gsap.context` (auto-cleanup on unmount). With `prefers-reduced-motion`, **skip entirely** — set final state instantly, no tweens.
- ScrollTrigger defaults: `start: 'top 85%'`, play once (`toggleActions: 'play none none none'`); never scrub, never pin.
- Pre-reveal elements get class `.gs-hidden` — opacity 0 **only when JS is active** (e.g. gated by a class on `<html>`), so content never disappears without JS.

## Motion vocabulary (pick from these; don't invent per-section styles)
| Pattern | Use | Feel |
|---|---|---|
| Fade + rise reveal (`y: 24→0`, ~0.7s, `power2.out`, stagger 0.08) | Default for sections, cards, headings on scroll | Gentle |
| Layered depth (background image slower than foreground content, subtle) | Hero, big imagery sections | Calm parallax, max ~10% offset |
| Hero entrance (staggered heading lines + soft image scale 1.05→1) | Landing + guide page heroes, once on load | Welcoming |
| Hover micro-interaction (card lift 2–4px + shadow, image scale ≤1.03, 0.2s) | Linked cards, gallery images — **never buttons** (buttons change color/shadow only, no movement) | Light |
| Progressive disclosure (accordion/bottom-sheet with height+fade) | Practical info, calendar detail sheet | Unhurried |

Durations 0.5–0.9s, ease `power2.out`/`power3.out`. No neon, no cursor-followers, no 3D, no scroll-jacking, no pinned sections.

## Common mistakes
- Missing `isolate` on sections with a `-z-10` background layer → image invisibly paints behind the page background (white-on-white "missing" content).
- Tweening without `gsap.context` scope → leaks and double-binds on route changes.
- Forgetting reduced-motion guard → accessibility fail (spec requires it).
- Animating layout properties (height/top) on scroll → jank; use transform/opacity.
- Not testing resize: rotate the phone viewport in DevTools; ScrollTrigger positions must refresh without stutter.
