<script setup lang="ts">
interface GuideItem {
  id: number
  type: 'beach' | 'trip' | 'info'
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  imageUrl: string | null
  meta: string | null
  metaEn: string | null
  sortOrder: number
}

interface Photo {
  id: number
  apartmentId: string | null
  url: string
  alt: string
  altEn: string
  sortOrder: number
}

interface Weather {
  current: { temp: number } | null
  daily: Array<{ date: string; min: number; max: number }>
  sea: number | null
}

const { data: guideItems } = await useFetch<GuideItem[]>('/api/guide-items', {
  default: () => [],
})
const { data: photos } = await useFetch<Photo[]>('/api/photos', {
  default: () => [],
})
const { data: weather } = await useFetch<Weather>('/api/weather', {
  default: () => ({ current: null, daily: [], sea: null }),
})

const cityImage = computed(() => {
  const general = photos.value?.find(p => !p.apartmentId)
  return general?.url ?? photos.value?.[0]?.url ?? '/uploads/placeholder-city.svg'
})

const bySortOrder = (a: GuideItem, b: GuideItem) => a.sortOrder - b.sortOrder
const beaches = computed(() => (guideItems.value ?? []).filter(i => i.type === 'beach').sort(bySortOrder))
const trips = computed(() => (guideItems.value ?? []).filter(i => i.type === 'trip').sort(bySortOrder))
const info = computed(() => (guideItems.value ?? []).filter(i => i.type === 'info').sort(bySortOrder))

const { isVisible } = useSectionVisibility()
</script>

<template>
  <div>
    <GuideCitySection v-if="isVisible('okoli.hero')" :image-url="cityImage" />
    <GuideWeatherWidget :weather="weather" />
    <GuideBeachCards :beaches="beaches" />
    <GuideTripCards :trips="trips" />
    <!-- Praktické info hidden for now -->
    <!-- <GuidePracticalInfo :items="info" /> -->
  </div>
</template>
