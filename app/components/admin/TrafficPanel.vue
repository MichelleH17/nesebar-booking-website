<script setup lang="ts">
type View = {
  id: number
  ts: string
  visitor: string
  path: string
  referrer: string
  userName: string
  role: string
  userAgent: string
}

const { data: views } = useFetch<View[]>('/api/traffic', { default: () => [] })

const fmt = (ts: string) =>
  new Date(ts).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })

const source = (ref_: string) => {
  if (!ref_) return 'přímo'
  try {
    return new URL(ref_).hostname.replace(/^www\./, '')
  } catch {
    return ref_
  }
}

const device = (ua: string) => (/Mobile|Android|iPhone/.test(ua) ? 'mobil' : 'počítač')

// Jedna návštěva = jeden vizitor; seskupíme jeho zobrazení a seřadíme od nejnovější.
const visits = computed(() => {
  const map = new Map<string, View[]>()
  for (const v of views.value) {
    const list = map.get(v.visitor)
    if (list) list.push(v)
    else map.set(v.visitor, [v])
  }
  return [...map.values()].map((list) => {
    const sorted = [...list].sort((a, b) => a.ts.localeCompare(b.ts))
    const first = sorted[0]!
    const last = sorted[sorted.length - 1]!
    return {
      key: first.visitor,
      first,
      last,
      pages: sorted,
      minutes: Math.round((new Date(last.ts).getTime() - new Date(first.ts).getTime()) / 60000),
      who: sorted.find(v => v.userName)?.userName || '',
      role: sorted.find(v => v.role)?.role || '',
    }
  }).sort((a, b) => b.last.ts.localeCompare(a.last.ts))
})

const topPages = computed(() => {
  const counts = new Map<string, number>()
  for (const v of views.value) counts.set(v.path, (counts.get(v.path) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
})

const open = ref<string | null>(null)
</script>

<template>
  <div class="space-y-8">
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <p class="text-sm text-stone">Návštěv</p>
        <p class="font-heading text-3xl text-night">{{ visits.length }}</p>
      </div>
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <p class="text-sm text-stone">Zobrazení stránek</p>
        <p class="font-heading text-3xl text-night">{{ views.length }}</p>
      </div>
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <p class="text-sm text-stone">Nejčastější stránka</p>
        <p class="truncate font-heading text-xl text-night">{{ topPages[0]?.[0] ?? '—' }}</p>
      </div>
    </div>

    <div class="rounded-2xl bg-white p-5 shadow-sm">
      <h2 class="mb-3 font-heading text-lg text-night">Nejnavštěvovanější stránky</h2>
      <ul class="space-y-1 text-sm">
        <li v-for="[path, count] in topPages" :key="path" class="flex justify-between gap-4">
          <span class="truncate text-stone">{{ path }}</span>
          <span class="tabular-nums text-night">{{ count }}</span>
        </li>
      </ul>
    </div>

    <div class="rounded-2xl bg-white p-5 shadow-sm">
      <h2 class="mb-3 font-heading text-lg text-night">Poslední návštěvy</h2>
      <p v-if="!visits.length" class="text-sm text-stone">Zatím žádná data.</p>
      <ul class="divide-y divide-cloud">
        <li v-for="v in visits" :key="v.key">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between gap-4 py-3 text-left"
            @click="open = open === v.key ? null : v.key"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium text-night">
                {{ v.who || (v.role === 'demo' ? 'Demo' : 'Neznámý návštěvník') }}
                <span class="font-normal text-stone">· ze zdroje {{ source(v.first.referrer) }}</span>
              </span>
              <span class="block truncate text-xs text-stone">
                {{ fmt(v.first.ts) }} · {{ v.pages.length }}× stránka · {{ v.minutes }} min · {{ device(v.first.userAgent) }}
              </span>
            </span>
            <span class="text-xs text-stone">{{ open === v.key ? '−' : '+' }}</span>
          </button>
          <ol v-if="open === v.key" class="mb-3 space-y-1 pl-4 text-xs text-stone">
            <li v-for="p in v.pages" :key="p.id">{{ fmt(p.ts) }} — {{ p.path }}</li>
          </ol>
        </li>
      </ul>
    </div>
  </div>
</template>
