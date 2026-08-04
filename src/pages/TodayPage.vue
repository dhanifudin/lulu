<template>
  <div class="min-h-screen bg-cream">
    <AppHeader :title="isWeekend ? t('home.weekend') : isHoliday ? t('home.holiday') : t('home.today')">
      <!-- Today's uniform -->
      <div v-if="!isWeekend && !isHoliday && schedule.todayUniform" class="mb-2">
        <p class="text-xs text-plum-700/50 mb-1">{{ t('home.uniform') }}</p>
        <UniformBadge :uniform="schedule.todayUniform" />
      </div>

      <!-- Holiday event labels -->
      <div v-if="isHoliday && holidayEvents.length" class="mt-1 space-y-1">
        <div v-for="e in holidayEvents" :key="e.id"
             class="badge bg-pink-100 text-pink-600 text-xs">
          🌸 {{ e.title }}
        </div>
      </div>
    </AppHeader>

    <div class="page space-y-5 py-4">

      <!-- ── KPI Summary Strip ── -->
      <div class="grid grid-cols-4 gap-1.5">
        <div class="card-pink text-center py-2.5 px-1 min-w-0">
          <p class="font-display font-bold text-pink-500 text-xl leading-none tabular-nums truncate">{{ doneCount }}/{{ habits.habits.length }}</p>
          <p class="text-xs text-plum-700/60 leading-tight mt-1">{{ t('home.kpiDoneToday') }}</p>
        </div>
        <div class="card-pink text-center py-2.5 px-1 min-w-0">
          <p class="font-display font-bold text-lavender-400 text-xl leading-none tabular-nums truncate">{{ weekCompletionPct }}%</p>
          <p class="text-xs text-plum-700/60 leading-tight mt-1">{{ t('home.kpiWeekPct') }}</p>
        </div>
        <div class="card-pink text-center py-2.5 px-1 min-w-0">
          <p class="font-display font-bold text-orange-400 text-xl leading-none tabular-nums truncate">🔥{{ maxStreak }}</p>
          <p class="text-xs text-plum-700/60 leading-tight mt-1">{{ t('home.kpiStreak') }}</p>
        </div>
        <RouterLink to="/rewards"
                    class="card-pink text-center py-2.5 px-1 min-w-0 block active:scale-95 transition-transform">
          <p class="font-display font-bold text-pink-400 text-xl leading-none tabular-nums truncate">🌸{{ totalStars }}</p>
          <p class="text-xs text-plum-700/60 leading-tight mt-1">{{ t('home.kpiStars') }}</p>
        </RouterLink>
      </div>

      <!-- ── Upcoming Exams & Events ── -->
      <div v-if="upcomingEvents.length">
        <h2 class="font-display font-bold text-plum-700 text-base mb-2">
          {{ t('home.upcoming') }}
        </h2>
        <div class="space-y-2">
          <div v-for="e in upcomingEvents" :key="e.id"
               class="card flex items-center gap-3 py-3"
               :style="{ borderLeft: `4px solid ${EVENT_COLORS[e.type]}` }">
            <span class="text-xl flex-shrink-0">{{ EVENT_EMOJI[e.type] }}</span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-plum-700 text-sm truncate">{{ e.title }}</p>
              <p class="text-xs text-plum-700/50 mt-0.5">{{ formatLongDate(new Date(e.start_date), locale) }}</p>
            </div>
            <span class="flex-shrink-0 text-xs font-semibold rounded-lg px-2 py-1"
                  :style="{ backgroundColor: EVENT_COLORS[e.type] + '33', color: EVENT_COLORS[e.type] }">
              {{ t(`events.${e.type}`) }}
            </span>
          </div>
        </div>
      </div>

    </div>

    <ConfettiBlast :show="showConfetti" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore }     from '@/stores/auth'
import { useScheduleStore } from '@/stores/schedule'
import { useHabitsStore }   from '@/stores/habits'
import { useCalendarStore, EVENT_EMOJI, EVENT_COLORS } from '@/stores/calendar'
import { nowWIB, todayWIB, dayOfWeekWIB, formatLongDate } from '@/lib/time'
import AppHeader     from '@/components/AppHeader.vue'
import UniformBadge  from '@/components/UniformBadge.vue'
import ConfettiBlast from '@/components/ConfettiBlast.vue'

const { t, locale } = useI18n()

const auth     = useAuthStore()
const schedule = useScheduleStore()
const habits   = useHabitsStore()
const cal      = useCalendarStore()

const now   = nowWIB()
const today = todayWIB()
const dow   = dayOfWeekWIB()   // 1=Mon … 7=Sun

// State flags
const isWeekend     = computed(() => dow >= 6)
const holidayEvents = computed(() => cal.eventsForDate(today).filter(e => e.type === 'holiday'))
const isHoliday     = computed(() => holidayEvents.value.length > 0)

// ── KPI ──────────────────────────────────────────────────────────
const doneCount  = computed(() =>
  habits.habits.filter(h => habits.isCompletedToday(h.id)).length
)
const totalStars = computed(() =>
  habits.habits.reduce((s, h) => s + habits.starCount(h.id), 0)
)
const maxStreak  = computed(() =>
  habits.habits.reduce((m, h) => Math.max(m, habits.streak(h.id)), 0)
)
const weekCompletionPct = computed(() => {
  if (!habits.habits.length) return 0
  const total = habits.habits.length * 7
  const done  = habits.habits.reduce(
    (s, h) => s + habits.weekGrid(h.id).filter(Boolean).length, 0
  )
  return Math.round((done / total) * 100)
})

// ── Upcoming events ───────────────────────────────────────────────
const upcomingEvents = computed(() =>
  cal.events
    .filter(e => e.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 5)
)

// ── Confetti when all habits done ─────────────────────────────────
const showConfetti = ref(false)
let confettiShownToday = false
watch(() => habits.allDoneToday, (val) => {
  if (val && !confettiShownToday) {
    showConfetti.value = true
    confettiShownToday = true
    setTimeout(() => { showConfetti.value = false }, 4000)
  }
})

onMounted(async () => {
  const year = now.getFullYear()
  await Promise.all([
    schedule.fetchAll(),   // needed for todayUniform
    habits.fetchAll(),     // needed for KPI stats
    cal.fetchYear(year),   // needed for upcoming events + holiday detection
  ])
})
</script>
