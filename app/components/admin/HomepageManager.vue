<script setup lang="ts">
const HERO_FIELDS = [
  { key: 'home.eyebrow', label: 'Nadpis', multiline: false },
  { key: 'home.line1', label: 'Nadpis – 1. řádek', multiline: false },
  { key: 'home.line2', label: 'Nadpis – 2. řádek', multiline: false },
  { key: 'home.intro', label: 'Úvodní text', multiline: true },
]

const APARTMENTS_FIELDS = [
  { key: 'home.apartmentsHeading', label: 'Nadpis sekce', multiline: false },
]

const GALLERY_FIELDS = [
  { key: 'home.galleryHeading', label: 'Nadpis sekce', multiline: false },
]

const CTA_FIELDS = [
  { key: 'home.ctaHeading', label: 'Nadpis', multiline: false },
  { key: 'home.ctaIntroGuest', label: 'Text (nepřihlášený host)', multiline: true },
  { key: 'home.ctaIntroLoggedIn', label: 'Text (přihlášený)', multiline: true },
]
</script>

<template>
  <div class="space-y-8">
    <AdminSiteTextEditor title="Hero sekce" :fields="HERO_FIELDS" section-key="home.hero" />
    <AdminSiteTextEditor title="Byty" :fields="APARTMENTS_FIELDS" section-key="home.apartments" />
    <AdminSiteTextEditor title="Galerie" :fields="GALLERY_FIELDS" section-key="home.gallery" />
    <AdminSiteTextEditor title="CTA" :fields="CTA_FIELDS" section-key="home.cta" />
  </div>
</template>
