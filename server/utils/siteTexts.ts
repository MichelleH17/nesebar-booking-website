// Default page texts (hero headings/ledes). The site_texts table stores admin overrides;
// anything not overridden falls back to these. Keep keys in sync with the admin editor
// (app/components/admin/GuideManager.vue) and the pages that read them.
export interface SiteText {
  cs: string
  en: string
}

export const SITE_TEXT_DEFAULTS: Record<string, SiteText> = {
  'home.eyebrow': { cs: 'Nesebar · Bulharsko', en: 'Nesebar · Bulgaria' },
  'home.line1': { cs: 'Náš kousek', en: 'Our corner' },
  'home.line2': { cs: 'Bulharska', en: 'of Bulgaria' },
  'home.lede': {
    cs: 'Dva byty v Nesebaru, kousek od moře, kde se scházíme jako rodina. Vyberte si termín a přijeďte.',
    en: 'Two apartments in Nesebar, a short walk from the sea, where we gather as a family. Pick your dates and come.',
  },
  'home.apartmentsHeading': { cs: 'Naše dva byty', en: 'Our two apartments' },
  'home.galleryHeading': { cs: 'Nesebar v obrazech', en: 'Nesebar in pictures' },
  'home.ctaHeading': { cs: 'Těšíme se na vás v Nesebaru', en: 'We look forward to seeing you in Nesebar' },
  'home.ctaLedeGuest': {
    cs: 'Podívejte se, co dělat v okolí, nebo se rovnou přihlaste a naplánujte svůj pobyt.',
    en: 'See what to do nearby, or log in and plan your stay right away.',
  },
  'home.ctaLedeLoggedIn': {
    cs: 'Podívejte se, co dělat v okolí, nebo rovnou naplánujte svůj pobyt.',
    en: 'See what to do nearby, or plan your stay right away.',
  },
  'okoli.line1': { cs: 'Nesebar a jeho', en: 'Nesebar and its' },
  'okoli.line2': { cs: 'okolí', en: 'surroundings' },
  'okoli.lede': {
    cs: 'Naše staré město leží na malém poloostrově a je zapsané v seznamu UNESCO — kamenné uličky, dřevěné domy a kostely staré stovky let. Kolem dokola písečné pláže, výlety podél pobřeží a všechno, co potřebujete vědět pro klidný pobyt.',
    en: 'Our old town sits on a small peninsula and is a UNESCO World Heritage site — stone lanes, wooden houses and churches hundreds of years old. All around: sandy beaches, trips along the coast and everything you need for a calm stay.',
  },
}

export const SITE_TEXT_KEYS = Object.keys(SITE_TEXT_DEFAULTS)
