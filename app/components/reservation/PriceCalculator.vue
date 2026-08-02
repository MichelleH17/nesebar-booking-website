<script setup lang="ts">
import { calcPrice } from '~~/shared/utils/booking'

const props = defineProps<{
  modelValue: number | null
  nights: number
  nightlyRate: number
  perPerson: boolean
  people: number
  defaultPaid?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [number | null]
}>()

const { t } = useI18n()

const enabled = ref(props.modelValue !== null || !!props.defaultPaid)

const total = computed(() =>
  calcPrice(Math.max(props.nights, 0), props.nightlyRate, props.people, props.perPerson),
)

watch(
  [enabled, total],
  () => emit('update:modelValue', enabled.value ? total.value : null),
  { immediate: true },
)
</script>

<template>
  <div class="rounded-2xl bg-cloud/60 p-5">
    <label class="flex cursor-pointer items-center justify-between gap-4">
      <span class="font-sans font-medium text-night">{{ t('price.paidStay') }}</span>
      <input
        v-model="enabled"
        type="checkbox"
        class="h-5 w-5 rounded accent-sea-deep"
      >
    </label>

    <div v-if="enabled" class="mt-4 space-y-1 border-t border-cloud pt-4 text-sm text-night">
      <div class="flex justify-between">
        <span class="text-stone">{{ perPerson ? t('price.lineItemPerPerson', { nights: Math.max(nights, 0), rate: nightlyRate, people }) : t('price.lineItem', { nights: Math.max(nights, 0), rate: nightlyRate }) }}</span>
        <span class="font-semibold">{{ t('price.total', { total }) }}</span>
      </div>
    </div>
    <p v-else class="mt-4 border-t border-cloud pt-4 font-sans text-sm text-sea-deep">
      {{ t('price.free') }}
    </p>
  </div>
</template>
