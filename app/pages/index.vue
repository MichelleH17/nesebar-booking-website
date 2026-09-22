<script setup lang="ts">
import type { PublicApartment } from '~~/shared/types/apartment'
import type { Photo } from '~~/shared/types/photo'
import type { Weather } from '~~/shared/types/weather'

const { data: apartments } = await useFetch<PublicApartment[]>('/api/apartments', {
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
