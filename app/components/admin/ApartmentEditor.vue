<script setup lang="ts">
interface Apartment {
  id: string
  label: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  capacity: number
  nightlyRate: number
  perPersonPricing: boolean
  priceHidden: boolean
  hidden: boolean
}

const { data: apartments, refresh } = useFetch<Apartment[]>('/api/apartments', { default: () => [] })

// Inside <ClientOnly> the initial useFetch can be skipped during hydration — fetch explicitly.
onMounted(() => {
  if (!apartments.value.length) refresh()
})

const drafts = ref<Record<string, Apartment>>({})
watchEffect(() => {
  const map: Record<string, Apartment> = {}
  for (const a of apartments.value) map[a.id] = { ...a }
  drafts.value = map
})

// Pair each apartment with its draft so the template gets a narrowed, non-undefined draft.
const rows = computed(() => apartments.value.map(a => ({ a, draft: drafts.value[a.id] })))

async function toggleHidden(id: string) {
  const hidden = !apartments.value.find(a => a.id === id)?.hidden
  await $fetch(`/api/apartments/${id}`, { method: 'PATCH', body: { hidden } })
  await refresh()
}

const savingId = ref<string | null>(null)
const message = ref<{ id: string; text: string; ok: boolean } | null>(null)

async function save(id: string) {
  const draft = drafts.value[id]
  if (!draft) return
  savingId.value = id
  message.value = null
  try {
    await $fetch(`/api/apartments/${id}`, {
      method: 'PATCH',
      body: {
        label: draft.label,
        name: draft.name,
        nameEn: draft.nameEn,
        description: draft.description,
        descriptionEn: draft.descriptionEn,
        capacity: Number(draft.capacity),
        nightlyRate: Number(draft.nightlyRate),
        perPersonPricing: draft.perPersonPricing,
        priceHidden: draft.priceHidden,
      },
    })
    await refresh()
    message.value = { id, text: 'Uloženo 💛', ok: true }
  } catch (e: any) {
    message.value = { id, text: e?.data?.message ?? 'Uložení selhalo.', ok: false }
  } finally {
    savingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-for="{ a, draft } in rows" :key="a.id" class="rounded-2xl bg-surface p-5 shadow-sm" :class="a.hidden ? 'opacity-60' : ''">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <h3 class="font-heading text-xl font-medium text-night">{{ draft?.label || a.id }}</h3>
        <button type="button" class="rounded-lg border border-cloud px-3 py-1 text-sm text-night hover:bg-cloud" @click="toggleHidden(a.id)">
          {{ a.hidden ? 'Zobrazit' : 'Skrýt' }}
        </button>
        <span v-if="a.hidden" class="text-xs font-medium uppercase tracking-wide text-stone">Skryto</span>
      </div>
      <div v-if="draft" class="space-y-4">
        <div>
          <label class="mb-1 block font-sans text-sm text-stone">Označení bytu</label>
          <input v-model="draft.label" type="text" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block font-sans text-sm text-stone">Název</label>
            <input v-model="draft.name" type="text" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          </div>
          <div>
            <label class="mb-1 block font-sans text-sm text-stone">Název (EN)</label>
            <input v-model="draft.nameEn" type="text" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block font-sans text-sm text-stone">Popis</label>
            <textarea v-model="draft.description" rows="3" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none" />
          </div>
          <div>
            <label class="mb-1 block font-sans text-sm text-stone">Popis (EN)</label>
            <textarea v-model="draft.descriptionEn" rows="3" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block font-sans text-sm text-stone">Kapacita</label>
            <input v-model.number="draft.capacity" type="number" min="1" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          </div>
          <div>
            <label class="mb-1 block font-sans text-sm text-stone">Cena / noc (Kč)</label>
            <input v-model.number="draft.nightlyRate" type="number" min="0" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          </div>
        </div>
        <label class="flex items-center gap-2 font-sans text-sm text-night">
          <input v-model="draft.perPersonPricing" type="checkbox" class="h-4 w-4 rounded accent-sea-deep">
          Cena za osobu
        </label>
        <label class="flex items-center gap-2 font-sans text-sm text-night">
          <input v-model="draft.priceHidden" type="checkbox" class="h-4 w-4 rounded accent-sea-deep">
          Skrýt cenu <span class="text-stone">(cena zůstane uložená, ale ve formuláři rezervace se nezobrazí)</span>
        </label>
        <div class="flex items-center gap-3">
          <UiBaseButton variant="ocean" :disabled="savingId === a.id" @click="save(a.id)">Uložit</UiBaseButton>
          <span v-if="message && message.id === a.id" :class="message.ok ? 'text-sea-deep' : 'text-red-700'" class="text-sm">{{ message.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
