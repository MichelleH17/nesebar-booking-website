<script setup lang="ts">
import type { SiteText } from '~~/shared/types/siteText'

interface Field { key: string, label: string, multiline?: boolean }

const props = defineProps<{
  title: string
  fields: Field[]
  sectionKey?: string
}>()

const { data: siteTexts, refresh } = useFetch<Record<string, SiteText>>('/api/site-texts', { key: 'site-texts', default: () => ({}) })

// Optional whole-section hide/show toggle.
const { isHidden, refresh: refreshSections } = useSectionVisibility()
const sectionHidden = computed(() => props.sectionKey ? isHidden(props.sectionKey) : false)
async function toggleSection() {
  if (!props.sectionKey) return
  await $fetch(`/api/sections/${props.sectionKey}`, { method: 'PATCH', body: { hidden: !sectionHidden.value } })
  await refreshSections()
}

// Seed each of this editor's fields once when data arrives; never clobber in-progress edits
// (several editors share the 'site-texts' fetch, so a sibling's save must not reset our drafts).
const drafts = ref<Record<string, SiteText>>({})
watchEffect(() => {
  for (const f of props.fields) {
    const source = siteTexts.value?.[f.key]
    if (!drafts.value[f.key] && source) {
      drafts.value[f.key] = { ...source }
    }
  }
})

// Pair each field with its draft so the template gets a narrowed, non-undefined draft.
const fieldRows = computed(() => props.fields.map(f => ({ f, draft: drafts.value[f.key] })))

const saved = ref(false)
async function save() {
  saved.value = false
  for (const f of props.fields) {
    const d = drafts.value[f.key]
    if (!d) continue
    await $fetch(`/api/site-texts/${f.key}`, { method: 'PATCH', body: { valueCs: d.cs, valueEn: d.en } })
  }
  await refresh()
  saved.value = true
}
</script>

<template>
  <div class="rounded-2xl bg-surface p-5 shadow-sm" :class="sectionHidden ? 'opacity-60' : ''">
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <h3 class="font-heading text-lg font-medium text-night">{{ title }}</h3>
      <template v-if="sectionKey">
        <button type="button" class="rounded-lg border border-cloud px-3 py-1 text-sm text-night hover:bg-cloud" @click="toggleSection">
          {{ sectionHidden ? 'Zobrazit' : 'Skrýt' }}
        </button>
        <span v-if="sectionHidden" class="text-xs font-medium uppercase tracking-wide text-stone">Skryto</span>
      </template>
    </div>
    <div class="space-y-3">
      <div v-for="{ f, draft } in fieldRows" :key="f.key">
        <span class="mb-1 block font-sans text-sm font-medium text-night">{{ f.label }}</span>
        <div v-if="draft" class="grid gap-2 sm:grid-cols-2">
          <textarea v-if="f.multiline" v-model="draft.cs" rows="3" placeholder="Česky" class="w-full rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none" />
          <input v-else v-model="draft.cs" type="text" placeholder="Česky" class="w-full rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none">
          <textarea v-if="f.multiline" v-model="draft.en" rows="3" placeholder="English" class="w-full rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none" />
          <input v-else v-model="draft.en" type="text" placeholder="English" class="w-full rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-sm text-night focus:border-sea-deep focus:outline-none">
        </div>
      </div>
      <div class="flex items-center gap-3">
        <UiBaseButton variant="ocean" @click="save">Uložit</UiBaseButton>
        <span v-if="saved" class="text-sm text-sea-deep">Uloženo 💛</span>
      </div>
    </div>
  </div>
</template>
