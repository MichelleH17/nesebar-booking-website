// Toggleable page sections. Keys are stable ids; the section_visibility table stores
// overrides (a row with hidden=true). Anything absent is visible. Keep in sync with the
// admin toggles and the v-if guards on the pages.
export const SECTION_KEYS = [
  'home.hero',
  'home.apartments',
  'home.gallery',
  'home.cta',
  'okoli.hero',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]
