// Default page texts (hero headings/intros). The site_texts table stores admin overrides;
// anything not overridden falls back to these. Keep keys in sync with the admin editor
// (app/components/admin/GuideManager.vue) and the pages that read them.
import type { SiteText } from '~~/shared/types/siteText'

export const SITE_TEXT_DEFAULTS: Record<string, SiteText> = {
  'home.eyebrow': { cs: 'Nesebar · Bulharsko', en: 'Nessebar · Bulgaria' },
  'home.line1': { cs: 'Místo, kam se', en: 'A place we' },
  'home.line2': { cs: 'rádi vracíme', en: 'love coming back to' },
  'home.intro': {
    cs: 'Dva apartmány v Nesebaru. Jeden společný prostor pro rodinu.',
    en: 'Two apartments in Nessebar. One shared space for the family.',
  },
  'home.apartmentsHeading': { cs: 'Naše apartmány', en: 'Our apartments' },
  'home.galleryHeading': { cs: 'Nesebar v obrazech', en: 'Nessebar in pictures' },
  'home.ctaHeading': { cs: 'Těšíme se na vás v Nesebaru', en: 'We look forward to seeing you in Nessebar' },
  'home.ctaIntroGuest': {
    cs: 'Podívejte se, co dělat v okolí, nebo se rovnou přihlaste a naplánujte svůj pobyt.',
    en: 'See what to do nearby, or log in and plan your stay right away.',
  },
  'home.ctaIntroLoggedIn': {
    cs: 'Podívejte se, co dělat v okolí, nebo rovnou naplánujte svůj pobyt.',
    en: 'See what to do nearby, or plan your stay right away.',
  },
  'area.line1': { cs: 'Nesebar a jeho', en: 'Nessebar and its' },
  'area.line2': { cs: 'okolí', en: 'surroundings' },
  'area.intro': {
    cs: 'Naše apartmány leží v novější části Nesebaru, v komplexu Odysey, jen kousek od moře. Kolem nás najdete písečné pláže, restaurace, obchody i místa pro výlety podél pobřeží. A když se vydáte do starého města, čekají vás kamenné uličky, dřevěné domy a kostely staré stovky let.',
    en: "Our apartments are in the newer part of Nessebar, in the Odysey complex, just a short walk from the sea. Around us you'll find sandy beaches, restaurants, shops and spots for trips along the coast. And if you head to the old town, cobbled lanes, wooden houses and churches hundreds of years old await.",
  },
}

export const SITE_TEXT_KEYS = Object.keys(SITE_TEXT_DEFAULTS)
