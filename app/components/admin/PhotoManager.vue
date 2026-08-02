<script setup lang="ts">
import type { Photo } from '~~/shared/types/photo'

// ?all=true so hidden photos are visible to admin here.
const { data: photos, refresh } = useFetch<Photo[]>('/api/photos', { query: { all: 'true' }, default: () => [] })
const { apartmentLabel } = useApartmentLabels()

const sorted = computed(() =>
  [...(photos.value ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
)

// --- Upload ---
const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const alt = ref('')
const altEn = ref('')
const apartmentId = ref<'' | '15B' | '16B'>('')
const uploading = ref(false)
const uploadError = ref<string | null>(null)

function onFile(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function upload() {
  uploadError.value = null
  if (!file.value) { uploadError.value = 'Vyberte soubor.'; return }
  if (!alt.value.trim()) { uploadError.value = 'Vyplňte popisek.'; return }
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    fd.append('alt', alt.value.trim())
    if (altEn.value.trim()) fd.append('altEn', altEn.value.trim())
    if (apartmentId.value) fd.append('apartmentId', apartmentId.value)
    await $fetch('/api/photos', { method: 'POST', body: fd })
    file.value = null
    alt.value = ''
    altEn.value = ''
    apartmentId.value = ''
    if (fileInput.value) fileInput.value.value = ''
    await refresh()
  } catch (e: any) {
    uploadError.value = e?.data?.message ?? 'Nahrání selhalo.'
  } finally {
    uploading.value = false
  }
}

// --- Per-photo actions ---
async function saveAlt(p: Photo, value: string) {
  await $fetch(`/api/photos/${p.id}`, { method: 'PATCH', body: { alt: value } })
  await refresh()
}

async function saveAltEn(p: Photo, value: string) {
  await $fetch(`/api/photos/${p.id}`, { method: 'PATCH', body: { altEn: value } })
  await refresh()
}

async function setApartment(p: Photo, value: string) {
  await $fetch(`/api/photos/${p.id}`, { method: 'PATCH', body: { apartmentId: value === '' ? null : value } })
  await refresh()
}

async function reorder(p: Photo, delta: number) {
  await $fetch(`/api/photos/${p.id}`, { method: 'PATCH', body: { sortOrder: p.sortOrder + delta } })
  await refresh()
}

async function toggleHidden(p: Photo) {
  await $fetch(`/api/photos/${p.id}`, { method: 'PATCH', body: { hidden: !p.hidden } })
  await refresh()
}

async function toggleHomepage(p: Photo) {
  if (!confirm(p.onHomepage ? 'Odebrat fotku z galerie?' : 'Přidat fotku do galerie?')) return
  await $fetch(`/api/photos/${p.id}`, { method: 'PATCH', body: { onHomepage: !p.onHomepage } })
  await refresh()
}

async function remove(p: Photo) {
  if (!confirm('Opravdu smazat tuto fotku?')) return
  await $fetch(`/api/photos/${p.id}`, { method: 'DELETE' })
  await refresh()
  await refreshOrphans()
}

// --- Swap image modal ---
const swapPhoto = ref<Photo | null>(null)
const swapping = ref(false)
const swapError = ref<string | null>(null)

function openSwap(p: Photo) {
  swapPhoto.value = p
  swapError.value = null
}

function closeSwap() {
  if (swapping.value) return
  swapPhoto.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeSwap()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

async function swapImage(e: Event) {
  const input = e.target as HTMLInputElement
  const picked = input.files?.[0]
  input.value = ''
  if (!picked || !swapPhoto.value) return
  swapError.value = null
  swapping.value = true
  try {
    const fd = new FormData()
    fd.append('file', picked)
    swapPhoto.value = await $fetch<Photo>(`/api/photos/${swapPhoto.value.id}/image`, { method: 'POST', body: fd })
    await refresh()
    await refreshOrphans()
  } catch (e: any) {
    swapError.value = e?.data?.message ?? 'Nahrání selhalo.'
  } finally {
    swapping.value = false
  }
}

// --- Orphaned upload files ---
const { data: orphans, refresh: refreshOrphans } = useFetch<{ files: string[] }>('/api/uploads/orphans', { default: () => ({ files: [] }) })
const cleaning = ref(false)

async function cleanOrphans() {
  if (!confirm(`Opravdu smazat ${orphans.value.files.length} nepoužívaných souborů?`)) return
  cleaning.value = true
  try {
    await $fetch('/api/uploads/orphans', { method: 'DELETE' })
    await refreshOrphans()
  } finally {
    cleaning.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Upload card -->
    <div class="rounded-2xl bg-surface p-5 shadow-sm">
      <h3 class="mb-4 font-heading text-lg font-medium text-night">Nahrát fotku</h3>
      <div class="space-y-3">
        <input ref="fileInput" type="file" accept="image/*" class="block w-full text-sm text-night file:mr-3 file:rounded-full file:border-0 file:bg-cloud file:px-4 file:py-2 file:text-sm file:text-night" @change="onFile">
        <input v-model="alt" type="text" placeholder="Popisek (alt)" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        <input v-model="altEn" type="text" placeholder="Popisek (alt, EN)" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        <select v-model="apartmentId" class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          <option value="">Obecná / Nesebar</option>
          <option value="15B">{{ apartmentLabel('15B') }}</option>
          <option value="16B">{{ apartmentLabel('16B') }}</option>
        </select>
        <div class="flex items-center gap-3">
          <UiBaseButton variant="ocean" :disabled="uploading" @click="upload">Nahrát</UiBaseButton>
          <span v-if="uploadError" class="text-sm text-red-700">{{ uploadError }}</span>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div v-for="p in sorted" :key="p.id" class="flex gap-3 rounded-2xl bg-surface p-3 shadow-sm" :class="p.hidden ? 'opacity-60' : ''">
        <img :src="p.url" :alt="p.alt" title="Kliknutím vyměníte obrázek" class="h-24 w-24 shrink-0 cursor-pointer rounded-xl object-cover transition-opacity hover:opacity-80" @click="openSwap(p)">
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <input :value="p.alt" type="text" placeholder="Popisek" class="w-full rounded-lg border border-cloud bg-cloud/60 px-2 py-1 text-sm text-night focus:border-sea-deep focus:outline-none" @change="saveAlt(p, ($event.target as HTMLInputElement).value)">
          <input :value="p.altEn" type="text" placeholder="Popisek (EN)" class="w-full rounded-lg border border-cloud bg-cloud/60 px-2 py-1 text-sm text-night focus:border-sea-deep focus:outline-none" @change="saveAltEn(p, ($event.target as HTMLInputElement).value)">
          <select :value="p.apartmentId ?? ''" class="w-full rounded-lg border border-cloud bg-cloud/60 px-2 py-1 text-sm text-night focus:border-sea-deep focus:outline-none" @change="setApartment(p, ($event.target as HTMLSelectElement).value)">
            <option value="">Obecná</option>
            <option value="15B">{{ apartmentLabel('15B') }}</option>
            <option value="16B">{{ apartmentLabel('16B') }}</option>
          </select>
          <div class="flex flex-wrap items-center gap-1 text-sm">
            <button type="button" class="rounded-lg bg-cloud px-2 py-1" @click="reorder(p, -1)">↑</button>
            <button type="button" class="rounded-lg bg-cloud px-2 py-1" @click="reorder(p, 1)">↓</button>
            <span class="text-stone">#{{ p.sortOrder }}</span>
            <button type="button" class="rounded-lg px-2 py-1 text-night hover:bg-cloud" @click="toggleHidden(p)">{{ p.hidden ? 'Zobrazit' : 'Skrýt' }}</button>
            <button type="button" class="ml-auto rounded-lg px-2 py-1 text-red-700 hover:bg-red-50" @click="remove(p)">Smazat</button>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <button type="button" class="rounded-lg px-2 py-1 text-night hover:bg-cloud" @click="toggleHomepage(p)">{{ p.onHomepage ? 'Odebrat z galerie' : 'Přidat do galerie' }}</button>
            <span v-if="p.onHomepage" class="rounded-full bg-sea-deep/10 px-2 py-0.5 text-xs font-medium text-sea-deep">V galerii</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Orphaned files -->
    <div v-if="orphans.files.length" class="rounded-2xl bg-surface p-5 shadow-sm">
      <h3 class="mb-2 font-heading text-lg font-medium text-night">Nepoužívané soubory ({{ orphans.files.length }})</h3>
      <p class="mb-3 text-sm text-stone">Soubory v úložišti, na které už neodkazuje žádná fotka ani karta v průvodci.</p>
      <ul class="mb-4 max-h-40 space-y-1 overflow-y-auto text-sm text-stone">
        <li v-for="f in orphans.files" :key="f" class="truncate font-mono">{{ f }}</li>
      </ul>
      <button type="button" class="rounded-full px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50" :disabled="cleaning" @click="cleanOrphans">Smazat nepoužívané</button>
    </div>

    <!-- Swap image modal -->
    <Teleport to="body">
      <div v-if="swapPhoto" class="fixed inset-0 z-50 flex items-center justify-center bg-night/60 p-4" @click.self="closeSwap">
        <div class="w-full max-w-lg rounded-2xl bg-surface p-5 shadow-lg">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-heading text-lg font-medium text-night">Vyměnit obrázek</h3>
            <button type="button" class="rounded-lg px-2 py-1 text-night hover:bg-cloud" @click="closeSwap">✕</button>
          </div>
          <img :src="swapPhoto.url" :alt="swapPhoto.alt" class="mb-2 max-h-80 w-full rounded-xl bg-cloud/40 object-contain">
          <p class="mb-4 text-sm text-stone">{{ swapPhoto.alt }}</p>
          <div class="flex items-center gap-3">
            <label class="cursor-pointer rounded-full bg-cloud px-4 py-2 text-sm text-night" :class="swapping ? 'pointer-events-none opacity-60' : ''">
              {{ swapping ? 'Nahrávám…' : 'Vybrat nový obrázek' }}
              <input type="file" accept="image/*" class="hidden" @change="swapImage">
            </label>
            <span v-if="swapError" class="text-sm text-red-700">{{ swapError }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
