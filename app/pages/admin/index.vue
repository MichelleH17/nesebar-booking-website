<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const TABS = [
  { key: 'domu', label: 'Domů' },
  { key: 'byty', label: 'Byty' },
  { key: 'fotky', label: 'Fotky' },
  { key: 'okoli', label: 'Okolí' },
  { key: 'lide', label: 'Lidé' },
  { key: 'emaily', label: 'E-maily' },
  { key: 'rezervace', label: 'Rezervace' },
] as const

type TabKey = (typeof TABS)[number]['key']
const isTabKey = (value: unknown): value is TabKey => TABS.some((tab) => tab.key === value)

const route = useRoute()
const router = useRouter()
const active = ref<TabKey>(isTabKey(route.query.tab) ? route.query.tab : 'domu')

onMounted(() => {
  // Bez ?tab v URL obnovíme naposledy otevřenou záložku
  if (!route.query.tab) {
    const saved = sessionStorage.getItem('admin-tab')
    if (isTabKey(saved)) active.value = saved
  }
})

watch(active, (tab) => {
  sessionStorage.setItem('admin-tab', tab)
  router.replace({ query: { ...route.query, tab } })
})
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-cloud px-4 py-10 sm:px-6 sm:py-14">
    <div class="mx-auto max-w-4xl">
    <h1 class="mb-8 font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">Správa</h1>

    <div class="mb-6 -mx-4 overflow-x-auto px-4">
      <div class="flex w-max gap-2">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          type="button"
          class="cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition"
          :class="active === tab.key ? 'border-night bg-night text-white' : 'border-cloud bg-white text-stone hover:border-stone/40 hover:text-night hover:shadow-md'"
          @click="active = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <ClientOnly>
      <AdminHomepageManager v-if="active === 'domu'" />
      <AdminApartmentEditor v-else-if="active === 'byty'" />
      <AdminPhotoManager v-else-if="active === 'fotky'" />
      <AdminGuideManager v-else-if="active === 'okoli'" />
      <AdminUserManager v-else-if="active === 'lide'" />
      <AdminMailRecipientManager v-else-if="active === 'emaily'" />
      <AdminReservationTable v-else-if="active === 'rezervace'" />
    </ClientOnly>
    </div>
  </div>
</template>
