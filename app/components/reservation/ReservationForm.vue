<script setup lang="ts">
import { nights } from '~~/shared/utils/booking'
import { isFullReservation } from '~/composables/useReservations'
import type { Reservation } from '~/composables/useReservations'

interface FormInitial {
  apartmentId: string
  guestName: string
  people: number
  arrival: string
  departure: string
  travelMethod: 'car' | 'plane' | 'bus' | 'train'
  notes: string
  priceApplied: number | null
  forGuest: boolean
  notifyEmails: string[]
}

interface Apartment {
  id: string
  label: string
  name: string
  capacity: number
  nightlyRate: number
  perPersonPricing: boolean
  priceHidden: boolean
  hidden: boolean
}

interface MailRecipient {
  id: number
  name: string
  email: string
}

const props = defineProps<{
  mode: 'new' | 'edit'
  initial: FormInitial
  reservationId?: number
  defaultPaid?: boolean
}>()

const { t } = useI18n()

// ?zpet=prehled → the form was opened from the dashboard, so Zpět returns there.
const route = useRoute()
const backTarget = computed(() => {
  if (route.query.zpet === 'prehled') return '/prehled'
  return form.arrival ? `/kalendar?mesic=${form.arrival.slice(0, 7)}` : '/kalendar'
})

const TRAVEL_OPTIONS = [
  { value: 'car', icon: '🚗', labelKey: 'travel.car' },
  { value: 'plane', icon: '✈️', labelKey: 'travel.plane' },
  { value: 'bus', icon: '🚌', labelKey: 'travel.bus' },
  { value: 'train', icon: '🚆', labelKey: 'travel.train' },
] as const

const form = reactive<FormInitial>({
  ...props.initial,
  notifyEmails: [...props.initial.notifyEmails],
})

const { data: apartments } = await useFetch<Apartment[]>('/api/apartments', { default: () => [] })
const { data: recipients } = await useFetch<MailRecipient[]>('/api/mail-recipients', { default: () => [] })
const { reservations, refresh: refreshReservations } = useReservations()

// Default: Michaela (first active recipient) checked on a fresh reservation.
const firstRecipient = recipients.value[0]
if (props.mode === 'new' && form.notifyEmails.length === 0 && firstRecipient) {
  form.notifyEmails = [firstRecipient.email]
}

const selectedApartment = computed(() => apartments.value.find(a => a.id === form.apartmentId))
// Hidden apartments are not offered — except when editing a reservation that already lives there.
const selectableApartments = computed(() => apartments.value.filter(a => !a.hidden || a.id === form.apartmentId))
const capacity = computed(() => selectedApartment.value?.capacity ?? 8)
const nightlyRate = computed(() => selectedApartment.value?.nightlyRate ?? 0)
const perPerson = computed(() => selectedApartment.value?.perPersonPricing ?? false)
const priceHidden = computed(() => selectedApartment.value?.priceHidden ?? false)

// Hidden price → no price section, stay is recorded without a price.
watch(priceHidden, (hidden) => {
  if (hidden) form.priceApplied = null
}, { immediate: true })

const nightsCount = computed(() =>
  form.arrival && form.departure && form.arrival < form.departure
    ? nights(form.arrival, form.departure)
    : 0,
)

// Keep departure at least one night after arrival.
watch(() => form.arrival, (arrival) => {
  if (arrival && (!form.departure || form.departure <= arrival)) {
    form.departure = addDays(arrival, 1)
  }
})

watch(capacity, (cap) => {
  if (form.people > cap) form.people = cap
})

function stepPeople(delta: number) {
  form.people = Math.min(capacity.value, Math.max(1, form.people + delta))
}

const changeoverHint = computed(() => {
  if (!form.arrival || !form.departure) return null
  const partner = (reservations.value ?? []).find((r: Reservation) =>
    r.status === 'active'
    && r.apartmentId === form.apartmentId
    && (props.reservationId === undefined || r.id !== props.reservationId)
    && (r.arrival === form.departure || r.departure === form.arrival),
  )
  if (!partner) return null
  const arrives = partner.arrival === form.departure
  const name = isFullReservation(partner) ? partner.guestName : t('reservation.anotherGuest')
  return t(arrives ? 'reservation.changeoverArrives' : 'reservation.changeoverDeparts', { name })
})

const submitting = ref(false)
const errorMsg = ref<string | null>(null)

async function submit() {
  errorMsg.value = null
  if (!form.guestName.trim()) {
    errorMsg.value = t('reservation.errNameRequired')
    return
  }
  if (!form.arrival || !form.departure || !(form.arrival < form.departure)) {
    errorMsg.value = t('reservation.errDateOrder')
    return
  }

  submitting.value = true
  const payload = {
    apartmentId: form.apartmentId,
    guestName: form.guestName.trim(),
    people: form.people,
    arrival: form.arrival,
    departure: form.departure,
    travelMethod: form.travelMethod,
    notes: form.notes,
    priceApplied: form.priceApplied,
    forGuest: form.forGuest,
    notifyEmails: form.notifyEmails,
  }
  try {
    if (props.mode === 'new') {
      await $fetch('/api/reservations', { method: 'POST', body: payload })
    } else {
      await $fetch(`/api/reservations/${props.reservationId}`, { method: 'PATCH', body: payload })
    }
    // Fresh data before the redirect, so the calendar shows the stay right away —
    // and open the calendar on the month the stay starts in.
    await refreshReservations()
    await navigateTo(`/kalendar?ulozeno=${props.mode === 'new' ? 'nova' : 'upravena'}&mesic=${form.arrival.slice(0, 7)}`)
  } catch (e: any) {
    errorMsg.value = e?.data?.message ?? e?.statusMessage ?? t('reservation.errSaveFailed')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="submit">
    <!-- Apartment toggle -->
    <div>
      <span class="mb-2 block font-sans text-sm font-medium text-night">{{ t('reservation.apartment') }}</span>
      <div class="inline-flex rounded-full bg-cloud p-1">
        <button
          v-for="a in selectableApartments"
          :key="a.id"
          type="button"
          class="rounded-full px-5 py-2 text-sm font-medium transition"
          :class="form.apartmentId === a.id ? 'bg-white text-night shadow-sm' : 'text-stone'"
          @click="form.apartmentId = a.id"
        >
          {{ a.label || a.id }}
        </button>
      </div>
    </div>

    <!-- Guest name -->
    <div>
      <label class="mb-2 block font-sans text-sm font-medium text-night" for="guestName">{{ t('reservation.guestName') }}</label>
      <input
        id="guestName"
        v-model="form.guestName"
        type="text"
        class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2.5 text-night transition focus:border-sea-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-sea-deep"
      >
      <label class="mt-3 flex cursor-pointer items-center gap-2 font-sans text-sm text-night">
        <input v-model="form.forGuest" type="checkbox" class="h-4 w-4 rounded accent-sea-deep">
        {{ t('reservation.forGuest') }}
      </label>
    </div>

    <!-- People stepper -->
    <div>
      <span class="mb-2 block font-sans text-sm font-medium text-night">{{ t('reservation.people') }}</span>
      <div class="inline-flex items-center gap-4 rounded-full bg-cloud px-2 py-1.5">
        <button type="button" :aria-label="t('reservation.decrease')" class="h-9 w-9 rounded-full bg-white text-lg text-night shadow-sm transition hover:bg-white/80 disabled:opacity-40" :disabled="form.people <= 1" @click="stepPeople(-1)">−</button>
        <span class="w-6 text-center font-semibold text-night">{{ form.people }}</span>
        <button type="button" :aria-label="t('reservation.increase')" class="h-9 w-9 rounded-full bg-white text-lg text-night shadow-sm transition hover:bg-white/80 disabled:opacity-40" :disabled="form.people >= capacity" @click="stepPeople(1)">+</button>
      </div>
      <p class="mt-1 font-sans text-xs text-stone">{{ t('reservation.capacity', { count: capacity }) }}</p>
    </div>

    <!-- Availability calendar -->
    <div>
      <span class="mb-2 block font-sans text-sm font-medium text-night">{{ t('reservation.calHint') }}</span>
      <ReservationAvailabilityCalendar
        v-model:arrival="form.arrival"
        v-model:departure="form.departure"
        :apartment-id="form.apartmentId"
        :reservations="reservations ?? []"
        :exclude-id="reservationId"
      />
    </div>

    <!-- Dates -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block font-sans text-sm font-medium text-night" for="arrival">{{ t('reservation.arrival') }}</label>
        <input
          id="arrival"
          v-model="form.arrival"
          type="date"
          class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2.5 text-night transition focus:border-sea-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-sea-deep"
        >
      </div>
      <div>
        <label class="mb-2 block font-sans text-sm font-medium text-night" for="departure">{{ t('reservation.departure') }}</label>
        <input
          id="departure"
          v-model="form.departure"
          type="date"
          :min="form.arrival"
          class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2.5 text-night transition focus:border-sea-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-sea-deep"
        >
      </div>
    </div>
    <p class="-mt-2 font-sans text-sm text-sea-deep">{{ t('reservation.nights', { count: nightsCount }) }}</p>

    <p v-if="changeoverHint" class="rounded-xl bg-sea/10 px-4 py-3 font-sans text-sm text-sea-deep">
      {{ changeoverHint }}
    </p>

    <!-- Travel method -->
    <div>
      <span class="mb-2 block font-sans text-sm font-medium text-night">{{ t('reservation.travelQuestion') }}</span>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="opt in TRAVEL_OPTIONS"
          :key="opt.value"
          type="button"
          class="flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition"
          :class="form.travelMethod === opt.value ? 'border-sea-deep bg-sea-deep/10 text-sea-deep' : 'border-cloud bg-cloud/40 text-stone hover:bg-cloud/70'"
          @click="form.travelMethod = opt.value"
        >
          <span class="text-xl">{{ opt.icon }}</span>
          {{ t(opt.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label class="mb-2 block font-sans text-sm font-medium text-night" for="notes">{{ t('reservation.notes') }}</label>
      <textarea
        id="notes"
        v-model="form.notes"
        rows="3"
        :placeholder="t('reservation.notesPlaceholder')"
        class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-2.5 text-night placeholder:text-stone transition focus:border-sea-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-sea-deep"
      />
    </div>

    <!-- Price -->
    <ReservationPriceCalculator
      v-if="!priceHidden"
      v-model="form.priceApplied"
      :nights="nightsCount"
      :nightly-rate="nightlyRate"
      :per-person="perPerson"
      :people="form.people"
      :default-paid="defaultPaid"
    />

    <!-- Notify recipients -->
    <div v-if="recipients.length">
      <span class="mb-2 block font-sans text-sm font-medium text-night">{{ t('reservation.notifyWhom') }}</span>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="r in recipients"
          :key="r.id"
          class="flex cursor-pointer items-center gap-2 rounded-full border border-cloud bg-cloud/40 px-4 py-2 text-sm text-night transition hover:bg-cloud/70"
        >
          <input v-model="form.notifyEmails" type="checkbox" :value="r.email" class="h-4 w-4 rounded accent-sea-deep">
          {{ r.name }}
        </label>
      </div>
    </div>

    <p v-if="errorMsg" class="rounded-xl bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
      {{ errorMsg }}
    </p>

    <div class="flex gap-3 pt-2">
      <UiBaseButton type="submit" variant="ocean" :disabled="submitting">
        {{ t(mode === 'new' ? 'reservation.submitNew' : 'reservation.submitEdit') }}
      </UiBaseButton>
      <UiBaseButton variant="ghost" @click="navigateTo(backTarget)">
        {{ t('common.back') }}
      </UiBaseButton>
    </div>
  </form>
</template>
