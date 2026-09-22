<script setup lang="ts">
const { t } = useI18n()

const root = useTemplateRef<HTMLElement>('root')

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})

const roles = [
  { title: 'roles.adminTitle', text: 'roles.adminText' },
  { title: 'roles.familyTitle', text: 'roles.familyText' },
  { title: 'roles.readonlyTitle', text: 'roles.readonlyText' },
]
</script>

<template>
  <section ref="root" class="bg-cloud px-4 py-10 sm:px-6 md:py-16 lg:py-20">
    <div class="mx-auto max-w-6xl">
      <h2 class="gs-hidden font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">
        {{ t('roles.heading') }}
      </h2>
      <p class="gs-hidden mt-3 max-w-xl font-sans text-stone">
        {{ t('roles.text') }}
      </p>
      <div class="mt-10 grid gap-6 sm:grid-cols-3">
        <div
          v-for="role in roles"
          :key="role.title"
          class="gs-hidden rounded-2xl bg-white p-6"
        >
          <h3 class="font-heading text-2xl font-medium tracking-tight text-night">
            {{ t(role.title) }}
          </h3>
          <p class="mt-3 font-sans text-stone">
            {{ t(role.text) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
