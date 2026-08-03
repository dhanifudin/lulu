<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <AppHeader :title="t('calendar.title')">
      <p class="text-sm text-plum-700/60 mt-0.5">{{ t('calendar.subtitle') }}</p>

      <!-- Month navigation -->
      <div class="flex items-center justify-between mt-3">
        <button @click="prevMonth" class="btn-secondary px-4 py-2 text-sm">‹</button>
        <span class="font-display font-bold text-pink-500 text-lg">
          {{ months[month - 1] }} {{ year }}
        </span>
        <button @click="nextMonth" class="btn-secondary px-4 py-2 text-sm">›</button>
      </div>
    </AppHeader>

    <div class="page pt-4 pb-6">
      <!-- Day-of-week headers -->
      <div class="grid grid-cols-7 mb-2">
        <div v-for="d in dowLabels" :key="d"
             class="text-center text-xs font-bold text-plum-700/50">{{ d }}</div>
      </div>

      <!-- Calendar grid -->
      <div class="grid grid-cols-7 gap-1">
        <!-- Leading empty cells -->
        <div v-for="_ in leadingBlanks" :key="'b'+_" />

        <!-- Day cells -->
        <button
          v-for="day in daysInMonth"
          :key="day"
          @click="selectDay(day)"
          class="aspect-square flex flex-col items-center justify-start pt-1 rounded-2xl text-sm font-semibold transition-all duration-150 relative"
          :class="cellClass(day)"
        >
          <span>{{ day }}</span>
          <!-- Event dots -->
          <div class="flex gap-0.5 mt-0.5 flex-wrap justify-center">
            <span v-for="e in eventsForDay(day).slice(0,3)" :key="e.id"
                  class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: EVENT_COLORS[e.type] }" />
          </div>
        </button>
      </div>

      <!-- Selected day events -->
      <div v-if="selectedDay" class="mt-4 space-y-2">
        <h3 class="font-display font-bold text-plum-700">
          {{ t('calendar.selectedPrefix') }} {{ selectedDayStr }}
        </h3>
        <div v-if="!selectedEvents.length" class="card text-center text-plum-700/40 text-sm py-4">
          {{ t('calendar.noEvents') }}
        </div>
        <div v-for="e in selectedEvents" :key="e.id"
             class="card flex items-start gap-3"
             :style="{ borderLeft: `4px solid ${EVENT_COLORS[e.type]}` }">
          <span class="text-2xl mt-0.5">{{ EVENT_EMOJI[e.type] }}</span>
          <div>
            <p class="font-semibold text-plum-700 text-sm">{{ e.title }}</p>
            <p v-if="e.description" class="text-xs text-plum-700/60 mt-0.5">{{ e.description }}</p>
            <p class="text-xs text-plum-700/40 mt-1">{{ e.start_date }} – {{ e.end_date }}</p>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-6 card">
        <h3 class="font-display font-bold text-plum-700 text-sm mb-2">{{ t('calendar.legend') }}</h3>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="type in eventTypes" :key="type"
               class="flex items-center gap-2 text-xs text-plum-700/70">
            <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: EVENT_COLORS[type] }" />
            {{ t(`events.${type}`) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalendarStore, EVENT_COLORS, EVENT_EMOJI } from '@/stores/calendar'
import type { EventType } from '@/stores/calendar'
import { nowWIB, todayWIB } from '@/lib/time'
import AppHeader from '@/components/AppHeader.vue'

const { t, tm } = useI18n()
const cal        = useCalendarStore()
const now        = nowWIB()
const today      = todayWIB()

const year  = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)  // 1-indexed

// Reactive to locale changes
const months    = computed(() => tm('calendar.months') as string[])
const dowLabels = computed(() => tm('days.short') as string[])

const eventTypes: EventType[] = ['holiday', 'exam', 'report', 'event', 'activity']

const daysInMonth = computed(() =>
  new Date(year.value, month.value, 0).getDate()
)

const leadingBlanks = computed(() =>
  new Date(year.value, month.value - 1, 1).getDay()
)

function eventsForDay(day: number) {
  const str = `${year.value}-${String(month.value).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  return cal.eventsForDate(str)
}

const selectedDay = ref<number | null>(null)

const selectedDayStr = computed(() => {
  if (!selectedDay.value) return ''
  return `${selectedDay.value} ${months.value[month.value - 1]} ${year.value}`
})

const selectedEvents = computed(() => {
  if (!selectedDay.value) return []
  return eventsForDay(selectedDay.value)
})

function selectDay(day: number) {
  selectedDay.value = selectedDay.value === day ? null : day
}

function cellClass(day: number) {
  const str    = `${year.value}-${String(month.value).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  const isToday = str === today
  const isHol   = cal.isHoliday(str)
  const hasSel  = selectedDay.value === day
  const isWknd  = new Date(year.value, month.value - 1, day).getDay() % 6 === 0

  if (hasSel) return 'bg-pink-400 text-white shadow-flower'
  if (isToday) return 'bg-pink-200 text-pink-700 ring-2 ring-pink-400 font-bold'
  if (isHol)  return 'bg-pink-100 text-pink-400'
  if (isWknd) return 'text-plum-700/30'
  return 'hover:bg-pink-50 text-plum-700'
}

function prevMonth() {
  if (month.value === 1) { month.value = 12; year.value-- }
  else month.value--
  selectedDay.value = null
}
function nextMonth() {
  if (month.value === 12) { month.value = 1; year.value++ }
  else month.value++
  selectedDay.value = null
}

onMounted(() => {
  cal.fetchYear(2026)
  cal.fetchYear(2027)
})
</script>
