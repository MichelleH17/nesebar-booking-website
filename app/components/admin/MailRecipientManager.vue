<script setup lang="ts">
interface MailRecipient {
  id: number
  name: string
  email: string
  active: boolean
  sortOrder: number
}

const { data: recipients, refresh } = useFetch<MailRecipient[]>('/api/mail-recipients', {
  query: { all: 1 },
  default: () => [],
})

const drafts = ref<Record<number, MailRecipient>>({})
watchEffect(() => {
  const map: Record<number, MailRecipient> = {}
  for (const r of recipients.value) map[r.id] = { ...r }
  drafts.value = map
})

// Pair each recipient with its draft so the template gets a narrowed, non-undefined draft.
const rows = computed(() => recipients.value.map(r => ({ r, draft: drafts.value[r.id] })))

async function save(id: number) {
  const d = drafts.value[id]
  if (!d) return
  await $fetch(`/api/mail-recipients/${id}`, { method: 'PATCH', body: { name: d.name, email: d.email } })
  await refresh()
}

async function toggleActive(r: MailRecipient) {
  await $fetch(`/api/mail-recipients/${r.id}`, { method: 'PATCH', body: { active: !r.active } })
  await refresh()
}

// --- Add ---
const newRecipient = reactive({ name: '', email: '' })
const addError = ref<string | null>(null)

async function add() {
  addError.value = null
  try {
    await $fetch('/api/mail-recipients', { method: 'POST', body: { ...newRecipient } })
    newRecipient.name = ''
    newRecipient.email = ''
    await refresh()
  } catch (e: any) {
    addError.value = e?.data?.message ?? 'Přidání selhalo.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl bg-surface p-5 shadow-sm">
      <h3 class="mb-4 font-heading text-lg font-medium text-night">Přidat příjemce</h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="newRecipient.name" type="text" placeholder="Jméno" class="rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        <input v-model="newRecipient.email" type="email" placeholder="E-mail" class="rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
      </div>
      <div class="mt-3 flex items-center gap-3">
        <UiBaseButton variant="ocean" @click="add">Přidat</UiBaseButton>
        <span v-if="addError" class="text-sm text-red-700">{{ addError }}</span>
      </div>
    </div>

    <div class="space-y-3">
      <div v-for="{ r, draft } in rows" :key="r.id" class="rounded-2xl bg-surface p-4 shadow-sm" :class="r.active ? '' : 'opacity-60'">
        <div v-if="draft" class="flex flex-wrap items-center gap-3">
          <input v-model="draft.name" type="text" class="min-w-32 flex-1 rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-night focus:border-sea-deep focus:outline-none">
          <input v-model="draft.email" type="email" class="min-w-48 flex-1 rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-night focus:border-sea-deep focus:outline-none">
          <UiBaseButton variant="ocean" @click="save(r.id)">Uložit</UiBaseButton>
          <button type="button" class="rounded-lg bg-cloud px-3 py-1.5 text-sm text-night" @click="toggleActive(r)">
            {{ r.active ? 'Deaktivovat' : 'Aktivovat' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
