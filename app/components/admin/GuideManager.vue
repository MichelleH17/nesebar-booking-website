<script setup lang="ts">
import type { GuideItem } from '~~/shared/types/guideItem'

const OKOLI_HERO_FIELDS = [
  { key: 'area.line1', label: 'Nadpis – 1. řádek', multiline: false },
  { key: 'area.line2', label: 'Nadpis – 2. řádek', multiline: false },
  { key: 'area.intro', label: 'Úvodní text', multiline: true },
]

const TYPE_LABELS: Record<GuideItem['type'], string> = {
  beach: 'Pláže',
  trip: 'Výlety',
  info: 'Praktické info',
}
const TYPES: GuideItem['type'][] = ['beach', 'trip', 'info']

// ?all=true so hidden items are visible to admin here.
const { data: items, refresh } = useFetch<GuideItem[]>('/api/guide-items', { query: { all: 'true' }, default: () => [] })

const drafts = ref<Record<number, GuideItem>>({})
watchEffect(() => {
  const map: Record<number, GuideItem> = {}
  for (const i of items.value) map[i.id] = { ...i }
  drafts.value = map
})

// Pair each item with its draft so the template gets a narrowed, non-undefined draft.
function grouped(type: GuideItem['type']) {
  return computed(() =>
    (items.value ?? [])
      .filter(i => i.type === type)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map(item => ({ item, draft: drafts.value[item.id] })),
  )
}
const beaches = grouped('beach')
const trips = grouped('trip')
const infos = grouped('info')
const groups = { beach: beaches, trip: trips, info: infos }

async function save(id: number) {
  const d = drafts.value[id]
  if (!d) return
  await $fetch(`/api/guide-items/${id}`, {
    method: 'PATCH',
    body: {
      title: d.title,
      titleEn: d.titleEn,
      description: d.description,
      descriptionEn: d.descriptionEn,
      imageUrl: d.imageUrl?.trim() ? d.imageUrl.trim() : null,
      meta: d.meta?.trim() ? d.meta.trim() : null,
      metaEn: d.metaEn?.trim() ? d.metaEn.trim() : null,
      sortOrder: Number(d.sortOrder),
    },
  })
  await refresh()
}

async function remove(id: number) {
  if (!confirm('Opravdu smazat tuto položku?')) return
  await $fetch(`/api/guide-items/${id}`, { method: 'DELETE' })
  await refresh()
}

async function toggleHidden(item: GuideItem) {
  await $fetch(`/api/guide-items/${item.id}`, { method: 'PATCH', body: { hidden: !item.hidden } })
  await refresh()
}

// --- Image upload ---
const uploadingFor = ref<number | 'new' | null>(null)
const uploadErrors = ref<Record<string, string>>({})

async function uploadImage(e: Event, target: number | 'new') {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  delete uploadErrors.value[String(target)]
  uploadingFor.value = target
  try {
    const fd = new FormData()
    fd.append('file', file)
    const { url } = await $fetch<{ url: string }>('/api/guide-items/upload', { method: 'POST', body: fd })
    if (target === 'new') newItem.imageUrl = url
    else if (drafts.value[target]) drafts.value[target].imageUrl = url
  } catch (err: any) {
    uploadErrors.value[String(target)] = err?.data?.message ?? 'Nahrání selhalo.'
  } finally {
    uploadingFor.value = null
  }
}

// --- Add ---
const newItem = reactive({ type: 'beach' as GuideItem['type'], title: '', titleEn: '', description: '', descriptionEn: '', meta: '', metaEn: '', imageUrl: '' })
const addError = ref<string | null>(null)

async function add() {
  addError.value = null
  if (!newItem.title.trim() || !newItem.description.trim()) {
    addError.value = 'Vyplňte název a popis.'
    return
  }
  try {
    await $fetch('/api/guide-items', {
      method: 'POST',
      body: {
        type: newItem.type,
        title: newItem.title.trim(),
        titleEn: newItem.titleEn.trim(),
        description: newItem.description.trim(),
        descriptionEn: newItem.descriptionEn.trim(),
        meta: newItem.meta.trim() || null,
        metaEn: newItem.metaEn.trim() || null,
        imageUrl: newItem.imageUrl.trim() || null,
      },
    })
    newItem.title = ''
    newItem.titleEn = ''
    newItem.description = ''
    newItem.descriptionEn = ''
    newItem.meta = ''
    newItem.metaEn = ''
    newItem.imageUrl = ''
    await refresh()
  } catch (e: any) {
    addError.value = e?.data?.message ?? 'Přidání selhalo.'
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Editable hero text -->
    <AdminSiteTextEditor title="Hero sekce" :fields="OKOLI_HERO_FIELDS" section-key="area.hero" />

    <!-- Add form -->
    <div class="rounded-2xl bg-surface p-5 shadow-sm">
      <h3 class="mb-4 font-heading text-lg font-medium text-night">Přidat položku</h3>
      <div class="space-y-3">
        <select v-model="newItem.type" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          <option v-for="t in TYPES" :key="t" :value="t">{{ TYPE_LABELS[t] }}</option>
        </select>
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="newItem.title" type="text" placeholder="Název" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          <input v-model="newItem.titleEn" type="text" placeholder="Název (EN)" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <textarea v-model="newItem.description" rows="2" placeholder="Popis" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none" />
          <textarea v-model="newItem.descriptionEn" rows="2" placeholder="Popis (EN)" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <input v-model="newItem.meta" type="text" placeholder="Meta (např. 15 min autem)" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          <input v-model="newItem.metaEn" type="text" placeholder="Meta (EN, e.g. 15 min by car)" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        </div>
        <div class="flex items-center gap-3">
          <label class="shrink-0 cursor-pointer rounded-full bg-cloud px-4 py-2 text-sm text-night" :class="uploadingFor === 'new' ? 'pointer-events-none opacity-60' : ''">
            {{ uploadingFor === 'new' ? 'Nahrávám…' : 'Nahrát obrázek' }}
            <input type="file" accept="image/*" class="hidden" @change="uploadImage($event, 'new')">
          </label>
          <img v-if="newItem.imageUrl.trim()" :src="newItem.imageUrl" alt="" class="h-10 w-10 shrink-0 rounded-lg object-cover">
        </div>
        <span v-if="uploadErrors.new" class="text-sm text-red-700">{{ uploadErrors.new }}</span>
        <div class="flex items-center gap-3">
          <UiBaseButton variant="ocean" @click="add">Přidat</UiBaseButton>
          <span v-if="addError" class="text-sm text-red-700">{{ addError }}</span>
        </div>
      </div>
    </div>

    <!-- Grouped lists -->
    <div v-for="t in TYPES" :key="t">
      <h3 class="mb-3 font-heading text-xl font-medium text-night">{{ TYPE_LABELS[t] }}</h3>
      <div class="space-y-3">
        <div v-for="{ item, draft } in groups[t].value" :key="item.id" class="rounded-2xl bg-surface p-4 shadow-sm" :class="item.hidden ? 'opacity-60' : ''">
          <div v-if="draft" class="space-y-2">
            <div class="grid gap-2 sm:grid-cols-2">
              <input v-model="draft.title" type="text" placeholder="Název" class="w-full rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 font-medium text-night focus:border-sea-deep focus:outline-none">
              <input v-model="draft.titleEn" type="text" placeholder="Název (EN)" class="w-full rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 font-medium text-night focus:border-sea-deep focus:outline-none">
            </div>
            <div class="grid gap-2 sm:grid-cols-2">
              <textarea v-model="draft.description" rows="2" placeholder="Popis" class="w-full rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none" />
              <textarea v-model="draft.descriptionEn" rows="2" placeholder="Popis (EN)" class="w-full rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none" />
            </div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <input v-model="draft.meta" type="text" placeholder="Meta" class="rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none">
              <input v-model="draft.metaEn" type="text" placeholder="Meta (EN)" class="rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none">
              <label class="flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-cloud px-2 py-1.5 text-sm text-night" :class="uploadingFor === item.id ? 'pointer-events-none opacity-60' : ''">
                {{ uploadingFor === item.id ? 'Nahrávám…' : 'Nahrát obrázek' }}
                <input type="file" accept="image/*" class="hidden" @change="uploadImage($event, item.id)">
              </label>
              <input v-model.number="draft.sortOrder" type="number" placeholder="Pořadí" class="rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none">
            </div>
            <div v-if="draft.imageUrl?.trim() || uploadErrors[String(item.id)]" class="flex items-center gap-2">
              <img v-if="draft.imageUrl?.trim()" :src="draft.imageUrl!" alt="" class="h-12 w-12 rounded-lg object-cover">
              <span v-if="uploadErrors[String(item.id)]" class="text-sm text-red-700">{{ uploadErrors[String(item.id)] }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <UiBaseButton variant="ocean" @click="save(item.id)">Uložit</UiBaseButton>
              <button type="button" class="rounded-lg px-3 py-1.5 text-sm text-night hover:bg-cloud" @click="toggleHidden(item)">{{ item.hidden ? 'Zobrazit' : 'Skrýt' }}</button>
              <span v-if="item.hidden" class="text-xs font-medium uppercase tracking-wide text-stone">Skryto</span>
              <button type="button" class="ml-auto rounded-lg px-3 py-1.5 text-sm text-red-700 hover:bg-red-50" @click="remove(item.id)">Smazat</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
