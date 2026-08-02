<script setup lang="ts">
import type { AdminUser } from '~~/shared/types/adminUser'

const ROLES: AdminUser['role'][] = ['guest', 'family', 'admin']
const ROLE_LABELS: Record<AdminUser['role'], string> = {
  guest: 'Host',
  family: 'Rodina',
  admin: 'Správce',
}

const { user: sessionUser } = useUserSession()
const { data: users, refresh } = useFetch<AdminUser[]>('/api/users', { default: () => [] })

const drafts = ref<Record<number, AdminUser>>({})
watchEffect(() => {
  const map: Record<number, AdminUser> = {}
  for (const u of users.value) map[u.id] = { ...u }
  drafts.value = map
})

// Pair each user with their draft so the template gets a narrowed, non-undefined draft.
const rows = computed(() => users.value.map(u => ({ u, draft: drafts.value[u.id] })))

const message = ref<{ id: number; text: string; ok: boolean } | null>(null)

async function save(id: number) {
  const d = drafts.value[id]
  if (!d) return
  message.value = null
  try {
    await $fetch(`/api/users/${id}`, {
      method: 'PATCH',
      body: { name: d.name, email: d.email, color: d.color, role: d.role },
    })
    await refresh()
    message.value = { id, text: 'Uloženo 💛', ok: true }
  } catch (e: any) {
    message.value = { id, text: e?.data?.message ?? 'Uložení selhalo.', ok: false }
  }
}

async function setPassword(id: number) {
  const pw = prompt('Nové heslo (alespoň 8 znaků):')
  if (pw === null) return
  message.value = null
  try {
    await $fetch(`/api/users/${id}`, { method: 'PATCH', body: { password: pw } })
    message.value = { id, text: 'Heslo změněno.', ok: true }
  } catch (e: any) {
    message.value = { id, text: e?.data?.message ?? 'Změna hesla selhala.', ok: false }
  }
}

// --- Add ---
const newUser = reactive({ name: '', email: '', password: '', color: '#4A90A4', role: 'family' as AdminUser['role'] })
const addError = ref<string | null>(null)

async function add() {
  addError.value = null
  try {
    await $fetch('/api/users', { method: 'POST', body: { ...newUser } })
    newUser.name = ''
    newUser.email = ''
    newUser.password = ''
    newUser.color = '#4A90A4'
    newUser.role = 'family'
    await refresh()
  } catch (e: any) {
    addError.value = e?.data?.message ?? 'Přidání selhalo.'
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Add form -->
    <div class="rounded-2xl bg-surface p-5 shadow-sm">
      <h3 class="mb-4 font-heading text-lg font-medium text-night">Přidat uživatele</h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="newUser.name" type="text" placeholder="Jméno" class="rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        <input v-model="newUser.email" type="email" placeholder="E-mail" class="rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        <input v-model="newUser.password" type="password" placeholder="Heslo (min. 8 znaků)" class="rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
        <select v-model="newUser.role" class="rounded-xl border border-cloud bg-cloud/60 px-4 py-2 text-night focus:border-sea-deep focus:outline-none">
          <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-night">
          Barva v kalendáři
          <input v-model="newUser.color" type="color" class="h-9 w-12 rounded border border-cloud bg-cloud/60">
        </label>
      </div>
      <div class="mt-3 flex items-center gap-3">
        <UiBaseButton variant="ocean" @click="add">Přidat</UiBaseButton>
        <span v-if="addError" class="text-sm text-red-700">{{ addError }}</span>
      </div>
    </div>

    <!-- User list -->
    <div class="space-y-3">
      <div v-for="{ u, draft } in rows" :key="u.id" class="rounded-2xl bg-surface p-4 shadow-sm">
        <div v-if="draft" class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <input v-model="draft.name" type="text" class="rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-night focus:border-sea-deep focus:outline-none">
            <input v-model="draft.email" type="email" class="rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-night focus:border-sea-deep focus:outline-none">
            <select v-model="draft.role" class="rounded-lg border border-cloud bg-cloud/60 px-3 py-1.5 text-night focus:border-sea-deep focus:outline-none">
              <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
            </select>
            <label class="flex items-center gap-2 text-sm text-night">
              Barva
              <input v-model="draft.color" type="color" class="h-8 w-10 rounded border border-cloud bg-cloud/60">
              <span class="text-xs text-stone">{{ draft.color }}</span>
            </label>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UiBaseButton variant="ocean" @click="save(u.id)">Uložit</UiBaseButton>
            <button type="button" class="rounded-lg bg-cloud px-3 py-1.5 text-sm text-night" @click="setPassword(u.id)">Nastavit nové heslo</button>
            <span v-if="u.id === sessionUser?.id" class="text-xs text-stone">(to jste vy)</span>
            <span v-if="message && message.id === u.id" :class="message.ok ? 'text-sea-deep' : 'text-red-700'" class="text-sm">{{ message.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
