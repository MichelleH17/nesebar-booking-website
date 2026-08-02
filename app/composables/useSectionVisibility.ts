/**
 * Whole-section visibility served from /api/sections ({ key: hidden }).
 * `isVisible(key)` defaults to true for unknown keys. Shared via the 'sections' fetch key.
 */
export function useSectionVisibility() {
  const { data, refresh } = useFetch<Record<string, boolean>>('/api/sections', {
    key: 'sections',
    default: () => ({}),
  })

  const isVisible = (key: string) => data.value?.[key] !== true
  const isHidden = (key: string) => data.value?.[key] === true

  return { sections: data, isVisible, isHidden, refresh }
}
