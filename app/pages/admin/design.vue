<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

// Design system reference — the Marina system used on the
// homepage, kalendáři and rezervačním formuláři.

interface Swatch { name: string; token: string; hex: string; note?: string; dark?: boolean }

const current: Swatch[] = [
  { name: 'night', token: 'bg-night', hex: '#0D0F19', note: 'nadpisy, plná tlačítka', dark: true },
  { name: 'cloud', token: 'bg-cloud', hex: '#F0F0F0', note: 'pruhy sekcí, pozadí stránek, hairline okraje, hover výplně' },
  { name: 'stone', token: 'bg-stone', hex: '#59504F', note: 'běžný text na bílé', dark: true },
  { name: 'surface', token: 'bg-surface', hex: '#FFFFFF', note: 'bílé plochy, karty' },
  { name: 'ink', token: 'bg-ink', hex: '#23261F', note: 'text hlavičky a patičky', dark: true },
  { name: 'sea', token: 'bg-sea', hex: '#4A90A4', note: 'gradient hero/CTA', dark: true },
  { name: 'sea-deep', token: 'bg-sea-deep', hex: '#2F6577', note: 'ocean tlačítko, odkazy, focus', dark: true },
  { name: 'off-white', token: 'bg-off-white', hex: '#FAF6EF', note: 'konec gradientu hero/CTA' },
  { name: 'silver', token: 'bg-silver', hex: '#9AA0A6', note: 'anonymizované/host rezervace v kalendáři' },
]

const buttonsLight = ['ghost', 'night-outline', 'night', 'ocean'] as const
const buttonsDark = ['light-outline', 'light'] as const
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
    <p class="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-sea-deep">Interní</p>
    <h1 class="mt-1 mb-2 font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">Design systém</h1>
    <p class="mb-12 max-w-2xl font-sans text-stone">
      Aktuální systém (Marina) - referenční implementace je homepage, kalendář a rezervační formulář.
      Při stavbě dalších stránek kopíruj odsud, nevymýšlej nové varianty.
    </p>

    <!-- Colours -->
    <section class="mb-14">
      <h2 class="mb-4 font-heading text-2xl font-medium tracking-tight text-night">Barvy</h2>

      <p class="mt-4 mb-2 font-sans text-sm font-medium text-stone">Aktuální paleta</p>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div v-for="c in current" :key="c.name" class="overflow-hidden rounded-2xl border border-cloud">
          <div class="flex h-20 items-end p-2" :class="c.token">
            <span class="font-sans text-xs font-medium" :class="c.dark ? 'text-white' : 'text-night/70'">Aa</span>
          </div>
          <div class="bg-surface px-3 py-2">
            <p class="font-sans text-sm font-medium text-night">{{ c.name }}</p>
            <p class="font-sans text-xs text-stone">{{ c.hex }}<template v-if="c.note"> — {{ c.note }}</template></p>
          </div>
        </div>
      </div>
      <p class="mt-3 font-sans text-xs text-stone">
        Kontrast (WCAG AA): <code>night</code>/<code>stone</code> na bílé ✓, bílá na <code>night</code> ✓.
        Nikdy světlou <code>sea</code> jako text na světlém pozadí.
      </p>

    </section>

    <!-- Typography -->
    <section class="mb-14">
      <h2 class="mb-4 font-heading text-2xl font-medium tracking-tight text-night">Typografie</h2>
      <div class="space-y-4 rounded-2xl bg-cloud p-8 sm:p-10">
        <p class="font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">Nadpis sekce - Montserrat Medium</p>
        <p class="font-heading text-2xl font-medium tracking-tight text-night">Podnadpis / karta</p>
        <p class="font-sans text-base text-stone">Montserrat - běžný text pro odstavce a popisky. Jediné písmo, odlišujeme jen řezem a velikostí.</p>
        <p class="font-sans text-sm text-stone">Sekundární text (stone, menší).</p>
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-sea-deep">Eyebrow / meta řádek - uppercase sea-deep</p>
        <p class="rounded-xl bg-night p-4 font-sans text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Eyebrow na fotce - tracking 0.3em, white/80</p>
      </div>
    </section>

    <!-- Buttons -->
    <section class="mb-14">
      <h2 class="mb-4 font-heading text-2xl font-medium tracking-tight text-night">Tlačítka</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-cloud bg-surface p-6">
          <div v-for="v in buttonsLight" :key="v" class="flex flex-col items-center gap-2">
            <UiBaseButton :variant="v">{{ v }}</UiBaseButton>
            <span class="font-sans text-xs text-stone">{{ v }}</span>
          </div>
        </div>
        <div class="relative isolate flex flex-wrap items-center gap-3 overflow-hidden rounded-2xl p-6">
          <div class="absolute inset-0 -z-10 bg-gradient-to-br from-sea to-off-white">
            <div class="absolute inset-0 bg-gradient-to-t from-night/85 via-night/35 to-night/10" />
          </div>
          <div v-for="v in buttonsDark" :key="v" class="flex flex-col items-center gap-2">
            <UiBaseButton :variant="v">{{ v }}</UiBaseButton>
            <span class="font-sans text-xs text-white/80">{{ v }}</span>
          </div>
        </div>
      </div>
      <p class="mt-2 font-sans text-xs text-stone">
        Pořadí: outline (sekundární) první, plné (primární) druhé. <code>ocean</code> = navbar Přihlásit,
        <code>ghost</code> = terciární akce (zpět, zrušit).
      </p>
    </section>

    <!-- Section treatments -->
    <section class="mb-14">
      <h2 class="mb-4 font-heading text-2xl font-medium tracking-tight text-night">Varianty sekcí</h2>
      <div class="space-y-4">
        <div class="rounded-2xl bg-surface p-8 ring-1 ring-cloud">
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-sea-deep">Bílý pruh</p>
          <h3 class="mt-2 font-heading text-3xl font-medium tracking-tight text-night">Bílá + night nadpis</h3>
          <p class="mt-2 font-sans text-stone">Základní sekce. Střídá se s cloud pruhem (rytmus homepage).</p>
        </div>
        <div class="rounded-2xl bg-cloud p-8">
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-sea-deep">Cloud pruh</p>
          <h3 class="mt-2 font-heading text-3xl font-medium tracking-tight text-night">Cloud + night nadpis</h3>
          <p class="mt-2 font-sans text-stone">Světle šedý pruh - také pozadí stránek kalendáře a rezervace.</p>
        </div>
        <div class="relative isolate overflow-hidden rounded-2xl p-8">
          <div class="absolute inset-0 -z-10 bg-gradient-to-br from-sea to-off-white">
            <div class="absolute inset-0 bg-gradient-to-t from-night/85 via-night/35 to-night/10" />
          </div>
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Hero / CTA</p>
          <h3 class="mt-2 font-heading text-3xl font-medium tracking-tight text-white">Gradient + tmavý overlay</h3>
          <p class="mt-2 font-sans text-white/85">Foto nebo sea gradient + overlay. Sekce potřebuje <code>relative isolate</code>.</p>
        </div>
        <div class="rounded-2xl bg-cloud p-6">
          <p class="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-sea-deep">Stránka s kartou (kalendář, rezervace)</p>
          <div class="rounded-2xl bg-white p-6 shadow-sm">
            <p class="font-sans text-sm text-stone">Stránka = <code>bg-cloud</code>, obsah v bílé kartě <code>rounded-2xl bg-white shadow-sm</code>.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Cards -->
    <section class="mb-14">
      <h2 class="mb-4 font-heading text-2xl font-medium tracking-tight text-night">Karty</h2>
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="rounded-2xl bg-cloud p-8 transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-10">
          <h3 class="font-heading text-2xl font-medium tracking-tight text-night">Cloud karta s hoverem</h3>
          <p class="mt-3 font-sans text-stone">Na bílých sekcích. Zvednutí + stín při najetí (byty na homepage).</p>
          <p class="mt-4 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-sea-deep">Meta řádek →</p>
        </div>
        <UiBaseCard>
          <h3 class="font-heading text-2xl font-medium tracking-tight text-night">Bílá karta (UiBaseCard)</h3>
          <p class="mt-3 font-sans text-stone">Na cloud pozadí - kalendář, formuláře. Bez hoveru pro neklikatelný obsah.</p>
        </UiBaseCard>
      </div>
    </section>

    <!-- Form elements -->
    <section class="mb-4">
      <h2 class="mb-4 font-heading text-2xl font-medium tracking-tight text-night">Formuláře</h2>
      <div class="space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div>
          <label class="mb-2 block font-sans text-sm font-medium text-night" for="ds-input">Textové pole</label>
          <input
            id="ds-input"
            type="text"
            placeholder="Placeholder text"
            class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2.5 text-night placeholder:text-stone transition focus:border-sea-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-sea-deep"
          >
        </div>

        <div>
          <span class="mb-2 block font-sans text-sm font-medium text-night">Přepínač (segmented)</span>
          <div class="inline-flex rounded-full bg-cloud p-1">
            <button type="button" class="rounded-full bg-white px-5 py-2 text-sm font-medium text-night shadow-sm transition">15B</button>
            <button type="button" class="rounded-full px-5 py-2 text-sm font-medium text-stone transition">16B</button>
          </div>
        </div>

        <div>
          <span class="mb-2 block font-sans text-sm font-medium text-night">Volba s ikonou</span>
          <div class="grid max-w-sm grid-cols-2 gap-2">
            <button type="button" class="flex flex-col items-center gap-1 rounded-xl border border-sea-deep bg-sea-deep/10 py-3 text-xs font-medium text-sea-deep transition">
              <span class="text-xl">🚗</span>
              Vybraná
            </button>
            <button type="button" class="flex flex-col items-center gap-1 rounded-xl border border-cloud bg-cloud/40 py-3 text-xs font-medium text-stone transition hover:bg-cloud/70">
              <span class="text-xl">✈️</span>
              Nevybraná
            </button>
          </div>
        </div>

        <p class="rounded-xl bg-sea/10 px-4 py-3 font-sans text-sm text-sea-deep">
          Informační hint / toast - <code>bg-sea/10 text-sea-deep</code> (předávka, uloženo).
        </p>
        <p class="rounded-xl bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
          Chybová hláška - <code>bg-red-50 text-red-700</code>.
        </p>
      </div>
    </section>
  </div>
</template>
