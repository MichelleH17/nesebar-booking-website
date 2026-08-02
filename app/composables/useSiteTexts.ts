interface SiteText {
  cs: string
  en: string
}

/**
 * Editable page texts (hero headings/ledes) served from /api/site-texts.
 * `st(key)` returns the value for the active locale, falling back to CS.
 * Fetched once and shared across components via the 'site-texts' key.
 */
export function useSiteTexts() {
  const { locale } = useI18n()
  const { data, refresh } = useFetch<Record<string, SiteText>>('/api/site-texts', {
    key: 'site-texts',
    default: () => ({}),
  })

  function st(key: string): string {
    const entry = data.value?.[key]
    if (!entry) return ''
    return locale.value === 'en' ? (entry.en || entry.cs) : entry.cs
  }

  return { siteTexts: data, st, refresh }
}
