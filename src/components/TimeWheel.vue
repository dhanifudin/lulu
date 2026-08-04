<template>
  <div>
    <label v-if="label" class="text-xs font-semibold text-plum-700/60 mb-1.5 block">
      {{ label }}
    </label>

    <!-- "No time" state — tap to add a time -->
    <button
      v-if="modelValue === null"
      type="button"
      @click="activate"
      class="w-full border-2 border-dashed border-pink-200 rounded-2xl py-3
             text-sm text-plum-700/40 text-center active:bg-pink-50 transition-all duration-150"
    >
      {{ t('habits.addTime') }} +
    </button>

    <!-- Wheel -->
    <div v-else>
      <div class="flex items-center gap-2">

        <!-- Hour column -->
        <div class="flex-1 relative">
          <div
            ref="hourEl"
            class="h-[132px] overflow-y-scroll snap-y snap-mandatory no-scrollbar
                   rounded-2xl bg-white border-2 border-pink-200"
            style="-webkit-overflow-scrolling: touch; scroll-behavior: auto"
            @scroll="onHourScroll"
          >
            <!-- top spacer so first item can center -->
            <div class="h-[44px] flex-shrink-0" />
            <div
              v-for="h in HOURS"
              :key="h"
              class="h-[44px] flex items-center justify-center snap-center
                     font-display font-bold text-lg text-plum-700 select-none"
            >{{ h }}</div>
            <!-- bottom spacer -->
            <div class="h-[44px] flex-shrink-0" />
          </div>
          <!-- highlight band (pointer-events-none so scroll works through it) -->
          <div class="pointer-events-none absolute inset-x-0 top-[44px] h-[44px]
                      bg-pink-50 border-y-2 border-pink-200" />
        </div>

        <!-- Colon separator -->
        <span class="font-display font-bold text-2xl text-plum-700/50 select-none flex-shrink-0">:</span>

        <!-- Minute column -->
        <div class="flex-1 relative">
          <div
            ref="minEl"
            class="h-[132px] overflow-y-scroll snap-y snap-mandatory no-scrollbar
                   rounded-2xl bg-white border-2 border-pink-200"
            style="-webkit-overflow-scrolling: touch; scroll-behavior: auto"
            @scroll="onMinScroll"
          >
            <div class="h-[44px] flex-shrink-0" />
            <div
              v-for="m in MINUTES"
              :key="m"
              class="h-[44px] flex items-center justify-center snap-center
                     font-display font-bold text-lg text-plum-700 select-none"
            >{{ m }}</div>
            <div class="h-[44px] flex-shrink-0" />
          </div>
          <div class="pointer-events-none absolute inset-x-0 top-[44px] h-[44px]
                      bg-pink-50 border-y-2 border-pink-200" />
        </div>

      </div>

      <!-- Clear -->
      <button
        type="button"
        @click="emit('update:modelValue', null)"
        class="w-full text-center text-xs text-plum-700/50 py-2 mt-1
               active:text-pink-400 transition-colors duration-150"
      >
        {{ t('habits.clearTime') }} ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const ITEM_H  = 44
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55']

const props = defineProps<{
  modelValue: string | null
  label?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [v: string | null] }>()
const { t } = useI18n()

const hourEl = ref<HTMLElement | null>(null)
const minEl  = ref<HTMLElement | null>(null)
let syncing  = false
let hourTimer: ReturnType<typeof setTimeout> | null = null
let minTimer:  ReturnType<typeof setTimeout> | null = null

/** Parse "HH:mm" or null → [hourIndex, minIndex] */
function parseValue(v: string | null): [number, number] {
  if (!v) return [7, 0]
  const [hStr, mStr] = v.split(':')
  const h  = Math.max(0, Math.min(23, parseInt(hStr ?? '7', 10)))
  const m  = Math.max(0, Math.min(55, parseInt(mStr ?? '0', 10)))
  const mi = Math.round(m / 5)
  return [h, mi]
}

function scrollCol(el: HTMLElement, index: number) {
  el.scrollTop = index * ITEM_H
}

function syncScroll() {
  if (!hourEl.value || !minEl.value) return
  const [h, mi] = parseValue(props.modelValue)
  syncing = true
  scrollCol(hourEl.value, h)
  scrollCol(minEl.value, mi)
  // Keep syncing flag set long enough to absorb the resulting scroll events
  setTimeout(() => { syncing = false }, 250)
}

function onHourScroll() {
  if (syncing) return
  if (hourTimer) clearTimeout(hourTimer)
  hourTimer = setTimeout(() => {
    if (!hourEl.value) return
    const h  = Math.round(hourEl.value.scrollTop / ITEM_H)
    const [, mi] = parseValue(props.modelValue)
    const hh = HOURS[Math.min(23, Math.max(0, h))]
    const mm = MINUTES[Math.min(11, Math.max(0, mi))]
    emit('update:modelValue', `${hh}:${mm}`)
  }, 200)
}

function onMinScroll() {
  if (syncing) return
  if (minTimer) clearTimeout(minTimer)
  minTimer = setTimeout(() => {
    if (!minEl.value) return
    const mi = Math.round(minEl.value.scrollTop / ITEM_H)
    const [h] = parseValue(props.modelValue)
    const hh  = HOURS[Math.min(23, Math.max(0, h))]
    const mm  = MINUTES[Math.min(11, Math.max(0, mi))]
    emit('update:modelValue', `${hh}:${mm}`)
  }, 200)
}

async function activate() {
  emit('update:modelValue', '07:00')
  await nextTick()
  syncScroll()
}

// Sync when value changes from outside (e.g. parent populates it)
watch(() => props.modelValue, async (v) => {
  if (v === null) return
  await nextTick()
  syncScroll()
})

onMounted(async () => {
  if (props.modelValue !== null) {
    await nextTick()
    syncScroll()
  }
})
</script>
