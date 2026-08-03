<template>
  <div
    class="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200"
    :class="[isActive ? 'shadow-flower-lg scale-[1.02] ring-2 ring-pink-300' : 'shadow-flower',
             isBreak ? 'opacity-60' : '']"
    :style="{ backgroundColor: bgColor }"
  >
    <!-- Time -->
    <div class="flex-shrink-0 text-right min-w-[52px]">
      <p class="text-xs font-semibold text-plum-700/60 leading-none">{{ slot.start_time }}</p>
      <p class="text-xs text-plum-700/40 mt-0.5">{{ slot.end_time }}</p>
    </div>

    <!-- Divider dot -->
    <div class="flex-shrink-0 w-2 h-2 rounded-full" :style="{ backgroundColor: subject?.color ?? '#FFC2D1' }"></div>

    <!-- Subject info -->
    <div class="flex-1 min-w-0">
      <p class="font-display font-bold text-plum-700 text-sm leading-tight truncate">
        {{ displayLabel }}
      </p>
    </div>

    <!-- Emoji -->
    <div class="flex-shrink-0 text-2xl">{{ subject?.emoji ?? '📚' }}</div>

    <!-- Active pulse -->
    <div v-if="isActive" class="flex-shrink-0">
      <span class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplayName } from '@/composables/useDisplayName'
import type { ScheduleSlot, Subject } from '@/stores/schedule'

const props = defineProps<{
  slot: ScheduleSlot
  subject: Subject | undefined
  isActive?: boolean
}>()

const { locale } = useI18n()
const { pick }   = useDisplayName()

const isBreak = computed(() =>
  ['break', 'prayer'].includes(props.subject?.category ?? '')
)

const bgColor = computed(() => {
  if (props.isActive) return '#FFF0F5'
  if (isBreak.value) return '#FFF7F0'
  return (props.subject?.color ?? '#FFC2D1') + '22'
})

// In EN mode prefer name_en; fall back to slot.label or subject_key
const displayLabel = computed(() => {
  if (locale.value === 'en') {
    return props.subject?.name_en ?? props.slot.label ?? props.slot.subject_key
  }
  return props.slot.label ?? props.subject?.name_id ?? props.slot.subject_key
})
</script>
