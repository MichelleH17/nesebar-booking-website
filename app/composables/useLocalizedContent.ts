/**
 * Picks the English variant of a DB content field when the active locale is
 * English, falling back to the Czech value whenever the `_en` field is empty.
 * Keeps the base (Czech) columns as the source of truth, so partially-authored
 * English content never renders blank.
 *
 * Usage: const loc = useLocalizedContent(); loc(apartment, 'description')
 * — reads `descriptionEn` in EN mode, else `description`.
 */
export function useLocalizedContent() {
  const { locale } = useI18n()

  return function loc(row: object | null | undefined, field: string): string {
    if (!row) return ''
    const record = row as Record<string, unknown>
    if (locale.value === 'en') {
      const en = record[`${field}En`]
      if (typeof en === 'string' && en.trim() !== '') return en
    }
    const base = record[field]
    return typeof base === 'string' ? base : ''
  }
}
