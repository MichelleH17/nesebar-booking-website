interface ApartmentLite {
  id: string
  label?: string
  hidden?: boolean
}

/**
 * Maps an apartment id ('15B'/'16B') to its editable display label, falling back to the id.
 * Shares the '/api/apartments' fetch via the 'apartments' key.
 */
export function useApartmentLabels() {
  const { data } = useFetch<ApartmentLite[]>('/api/apartments', { key: 'apartments', default: () => [] })

  const labelMap = computed(() =>
    Object.fromEntries((data.value ?? []).map(a => [a.id, a.label?.trim() || a.id])),
  )

  const apartmentLabel = (id: string) => labelMap.value[id] ?? id

  // Ids of apartments not hidden by the admin; falls back to both while data loads.
  const visibleApartmentIds = computed<string[]>(() => {
    const all = data.value ?? []
    return all.length ? all.filter(a => !a.hidden).map(a => a.id) : ['15B', '16B']
  })

  return { apartmentLabel, visibleApartmentIds }
}
