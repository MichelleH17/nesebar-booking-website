<script setup lang="ts">
interface Apartment {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  capacity: number
  nightlyRate: number
  perPersonPricing: boolean
  hidden: boolean
}

interface Photo {
  id: number
  apartmentId: string | null
  url: string
  alt: string
  altEn: string
  sortOrder: number
  onHomepage: boolean
}

interface Weather {
  current: { temp: number } | null
  daily: Array<{ date: string; min: number; max: number }>
  sea: number | null
}

const { data: apartments } = await useFetch<Apartment[]>('/api/apartments', {
  default: () => [],
})
const { data: photos } = await useFetch<Photo[]>('/api/photos', {
  default: () => [],
})
const { data: weather } = await useFetch<Weather>('/api/weather', {
  default: () => ({ current: null, daily: [], sea: null }),
})

const heroImage = computed(() => {
  const general = photos.value?.find(p => !p.apartmentId)
  return general?.url ?? photos.value?.[0]?.url ?? '/uploads/placeholder-hero.svg'
})

// Admin-picked gallery photos; none picked = section hidden (GallerySection renders only when non-empty).
const galleryPhotos = computed(() =>
  (photos.value ?? []).filter(p => p.onHomepage).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
)

const { isVisible } = useSectionVisibility()
</script>

<template>
  <div class="bg-white">
    <LandingHeroSection v-if="isVisible('home.hero')" :image-url="heroImage" />
    <LandingApartmentsIntro v-if="isVisible('home.apartments')" :apartments="(apartments ?? []).filter(a => !a.hidden)" />
    <GuideWeatherWidget :weather="weather" home />
    <LandingGallerySection v-if="isVisible('home.gallery')" :photos="galleryPhotos" />
    <LandingCtaSection v-if="isVisible('home.cta')" />
  </div>
</template>
