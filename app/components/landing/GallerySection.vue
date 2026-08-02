<script setup lang="ts">
interface Photo {
  id: number
  url: string
  alt: string
  altEn: string
}

defineProps<{
  photos: Photo[]
}>()

const { st } = useSiteTexts()
const loc = useLocalizedContent()

const root = ref<HTMLElement | null>(null)

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section v-if="photos.length" ref="root" class="bg-white px-6 py-10 md:py-16 lg:py-20 sm:px-10">
    <div class="mx-auto max-w-6xl">
      <h2 class="gs-hidden font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">
        {{ st('home.galleryHeading') }}
      </h2>
      <div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="gs-hidden gallery-item overflow-hidden rounded-2xl bg-cloud"
        >
          <img
            :src="photo.url"
            :alt="loc(photo, 'alt')"
            class="aspect-square h-full w-full object-cover transition duration-200 hover:scale-[1.03]"
          >
        </div>
      </div>
    </div>
  </section>
</template>
