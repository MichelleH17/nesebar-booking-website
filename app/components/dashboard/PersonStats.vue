<script setup lang="ts">
import type { PersonStat, FriendsStat } from '~~/shared/utils/stats'

const props = defineProps<{
  perUser: PersonStat[]
  friends: FriendsStat
}>()

// Demo accounts can't reserve, so they have no place in the stats — family only, ordered by users.sortOrder.
const familyUsers = computed(() => props.perUser.filter(p => p.role !== 'demo'))

const { user } = useUserSession()
const today = todayStr()

// A stay row opens the reservation only while the stay isn't finished,
// and only for its owner (or admin) — mirrors the calendar behaviour.
function canOpen(ownerId: number, departure: string): boolean {
  if (departure < today) return false
  return ownerId === user.value?.id || user.value?.role === 'admin'
}

function openStay(id: number) {
  // `from` tells the reservation form where its Zpět button should return to.
  navigateTo(`/rezervace/${id}?from=overview`)
}

const root = useTemplateRef<HTMLElement>('root')
useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section ref="root">
    <h2 class="gs-hidden mb-4 font-heading text-2xl font-medium text-night">Kdo jezdí</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="p in familyUsers"
        :key="p.userId"
        class="gs-hidden person-card rounded-2xl bg-surface p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <span class="inline-block h-3 w-3 rounded-full" :style="{ backgroundColor: p.color }" />
          <h3 class="font-heading text-lg font-medium text-night">{{ p.name }}</h3>
        </div>
        <div class="mt-3 flex gap-6 text-sm text-night">
          <div>
            <p class="font-display text-2xl">{{ p.stays }}</p>
            <p class="text-stone">pobytů</p>
          </div>
          <div>
            <p class="font-display text-2xl">{{ p.nights }}</p>
            <p class="text-stone">nocí</p>
          </div>
          <div>
            <p class="font-display text-2xl">{{ p.paidTotal }} Kč</p>
            <p class="text-stone">zaplaceno</p>
          </div>
        </div>
        <ul v-if="p.list.length" class="mt-4 space-y-1 border-t border-cloud pt-3 text-sm text-stone">
          <li v-for="s in p.list" :key="s.id">
            <component
              :is="canOpen(p.userId, s.departure) ? 'button' : 'div'"
              :type="canOpen(p.userId, s.departure) ? 'button' : undefined"
              class="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-left"
              :class="canOpen(p.userId, s.departure) ? 'cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 transition hover:bg-cloud/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea' : ''"
              @click="canOpen(p.userId, s.departure) && openStay(s.id)"
            >
              <span>{{ s.dates }} · {{ s.nights }} nocí</span>
              <span v-if="s.amount !== null" class="font-medium text-night">{{ s.amount }} Kč</span>
            </component>
          </li>
        </ul>
      </div>

      <!-- All friend stays together — the responsible family member is listed per stay. -->
      <div v-if="friends.stays" class="gs-hidden person-card rounded-2xl bg-surface p-5 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="inline-block h-3 w-3 rounded-full bg-stone/50" />
          <h3 class="font-heading text-lg font-medium text-night">Přátelé</h3>
        </div>
        <div class="mt-3 flex gap-6 text-sm text-night">
          <div>
            <p class="font-display text-2xl">{{ friends.stays }}</p>
            <p class="text-stone">pobytů</p>
          </div>
          <div>
            <p class="font-display text-2xl">{{ friends.nights }}</p>
            <p class="text-stone">nocí</p>
          </div>
          <div>
            <p class="font-display text-2xl">{{ friends.paidTotal }} Kč</p>
            <p class="text-stone">zaplaceno</p>
          </div>
        </div>
        <ul class="mt-4 space-y-1 border-t border-cloud pt-3 text-sm text-stone">
          <li v-for="s in friends.list" :key="s.id">
            <component
              :is="canOpen(s.ownerId, s.departure) ? 'button' : 'div'"
              :type="canOpen(s.ownerId, s.departure) ? 'button' : undefined"
              class="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-left"
              :class="canOpen(s.ownerId, s.departure) ? 'cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 transition hover:bg-cloud/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea' : ''"
              @click="canOpen(s.ownerId, s.departure) && openStay(s.id)"
            >
              <span><span class="font-medium text-night">{{ s.guestName }}</span> · {{ s.dates }} · zodpovídá {{ s.ownerName }}</span>
              <span v-if="s.amount !== null" class="font-medium text-night">{{ s.amount }} Kč</span>
            </component>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
