<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero header -->
    <PageHeader>
      <!-- Row 1: avatar + greeting + actions -->
      <div class="flex items-center gap-3 mb-2">
        <img v-if="auth.userAvatar" :src="auth.userAvatar"
             class="w-10 h-10 rounded-full border-2 border-pink-300 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-xs text-plum-700/60">{{ t('home.greeting', { name: firstName }) }}</p>
          <h1 class="font-display font-bold text-plum-700 text-xl leading-tight">
            {{ isWeekend ? t('home.weekend') : isHoliday ? t('home.holiday') : t('home.today') }}
          </h1>
        </div>
        <!-- Lang toggle + sign-out -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <LangToggle />
          <button @click="auth.signOut()"
                  class="text-xs font-semibold bg-white/60 hover:bg-pink-50 text-plum-700/50 hover:text-pink-500 rounded-xl px-3 py-2 transition-all active:scale-95 border border-pink-100">
            {{ t('common.signOut') }}
          </button>
        </div>
      </div>

      <!-- Date + live clock -->
      <p class="text-sm font-semibold text-pink-500 mb-2">
        📅 {{ localizedDay }}, {{ localizedDate }} · {{ currentTimeDisplay }}
      </p>

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
    </PageHeader>

    <div class="page space-y-5 py-4">

      <!-- ── KPI Summary Strip ── -->
      <div class="grid grid-cols-4 gap-1.5">
        <div class="card-pink text-center py-2.5 px-1">
          <p class="font-display font-bold text-pink-500 text-xl leading-none">{{ doneCount }}/{{ habits.habits.length }}</p>
          <p class="text-[10px] text-plum-700/60 leading-tight mt-1">{{ t('home.kpiDoneToday') }}</p>
        </div>
        <div class="card-pink text-center py-2.5 px-1">
          <p class="font-display font-bold text-lavender-400 text-xl leading-none">{{ weekCompletionPct }}%</p>
          <p class="text-[10px] text-plum-700/60 leading-tight mt-1">{{ t('home.kpiWeekPct') }}</p>
        </div>
        <div class="card-pink text-center py-2.5 px-1">
          <p class="font-display font-bold text-orange-400 text-xl leading-none">🔥{{ maxStreak }}</p>
          <p class="text-[10px] text-plum-700/60 leading-tight mt-1">{{ t('home.kpiStreak') }}</p>
        </div>
        <div class="card-pink text-center py-2.5 px-1">
          <p class="font-display font-bold text-pink-400 text-xl leading-none">⭐{{ totalStars }}</p>
          <p class="text-[10px] text-plum-700/60 leading-tight mt-1">{{ t('home.kpiStars') }}</p>
        </div>
      </div>

      <!-- ── Live Schedule ── -->
      <div>
        <h2 class="font-display font-bold text-plum-700 text-base mb-2 flex items-center gap-2">
          {{ t('home.todaySchedule') }}
          <span class="badge bg-pink-100 text-pink-500 text-xs">{{ currentTimeDisplay }}</span>
        </h2>

        <!-- Weekend / holiday rest state -->
        <div v-if="isWeekend || isHoliday" class="card text-center py-6">
          <div class="text-5xl mb-2">🌺</div>
          <p class="font-display font-bold text-pink-400 text-lg">
            {{ isWeekend ? t('home.restTitle') : t('home.holidayTitle') }}
          </p>
          <p class="text-sm text-plum-700/60 mt-1">{{ t('home.noSchool') }}</p>
        </div>

        <template v-else>
          <!-- Loading -->
          <div v-if="schedule.loading" class="text-center py-8 text-pink-300 text-3xl">🌸</div>

          <template v-else>
            <!-- Current lesson highlight -->
            <div v-if="schedule.currentSlot"
                 class="card bg-pink-50 border-2 border-pink-300 mb-2 animate-pop">
              <div class="flex items-center gap-2 mb-1.5">
                <span class="badge bg-pink-400 text-white text-xs font-bold">{{ t('home.now') }}</span>
                <span class="text-xs text-plum-700/50">
                  {{ schedule.currentSlot.start_time }} – {{ schedule.currentSlot.end_time }}
                </span>
                <!-- Pulse dot -->
                <span class="ml-auto relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ currentSubjectEmoji }}</span>
                <p class="font-display font-bold text-plum-700 text-base">{{ currentSubjectName }}</p>
              </div>
            </div>

            <!-- Next lesson -->
            <div v-if="nextSlot" class="card border border-pink-100 mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-plum-700/40">{{ t('home.next') }}</span>
                <span class="text-xs text-plum-700/40">{{ nextSlot.start_time }}</span>
                <div class="flex-1" />
                <span class="text-xl">{{ nextSubjectEmoji }}</span>
                <p class="font-display font-semibold text-plum-700 text-sm">{{ nextSubjectName }}</p>
              </div>
            </div>

            <!-- Full schedule list -->
            <div class="space-y-2">
              <SubjectCard
                v-for="slot in schedule.todaySlots"
                :key="slot.id"
                :slot="slot"
                :subject="schedule.getSubject(slot.subject_key)"
                :is-active="schedule.currentSlot?.id === slot.id"
              />
              <p v-if="!schedule.todaySlots.length"
                 class="text-center text-plum-700/40 text-sm py-4">
                {{ t('home.noSchool') }}
              </p>
            </div>
          </template>
        </template>
      </div>

      <!-- ── Habit Consistency ── -->
      <div>
        <h2 class="font-display font-bold text-plum-700 text-base mb-2">
          {{ t('home.todayHabits') }}
        </h2>
        <div v-if="habits.loading" class="text-center py-4 text-pink-300">🌸</div>
        <div v-else class="space-y-2">
          <HabitCard
            v-for="habit in habits.habits"
            :key="habit.id"
            :habit="habit"
            :done="habits.isCompletedToday(habit.id)"
            :stars="habits.starCount(habit.id)"
            :current-streak="habits.streak(habit.id)"
            :week-grid="habits.weekGrid(habit.id)"
            @toggle="habits.toggle"
          />
          <p v-if="!habits.habits.length"
             class="text-center text-plum-700/40 text-sm py-4">
            {{ t('home.noHabits') }}
          </p>
        </div>
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
              <p class="text-xs text-plum-700/50 mt-0.5">{{ e.start_date }}</p>
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
import { nowWIB, todayWIB, dayOfWeekWIB, formatDay, formatDate, currentTimeWIB } from '@/lib/time'
import { useDisplayName } from '@/composables/useDisplayName'
import SubjectCard   from '@/components/SubjectCard.vue'
import HabitCard     from '@/components/HabitCard.vue'
import UniformBadge  from '@/components/UniformBadge.vue'
import ConfettiBlast from '@/components/ConfettiBlast.vue'
import PageHeader    from '@/components/PageHeader.vue'
import LangToggle    from '@/components/LangToggle.vue'

const { t, locale } = useI18n()
const { pick }      = useDisplayName()

const auth     = useAuthStore()
const schedule = useScheduleStore()
const habits   = useHabitsStore()
const cal      = useCalendarStore()

const now   = nowWIB()
const today = todayWIB()
const dow   = dayOfWeekWIB()   // 1=Mon … 7=Sun

// Localized date strings (reactive to locale changes)
const localizedDay  = computed(() => formatDay(now, locale.value))
const localizedDate = computed(() => formatDate(now, locale.value))

// State flags
const isWeekend     = computed(() => dow >= 6)
const holidayEvents = computed(() => cal.eventsForDate(today).filter(e => e.type === 'holiday'))
const isHoliday     = computed(() => holidayEvents.value.length > 0)

const firstName = computed(() => auth.userName.split(' ')[0])

// Live clock (refreshes every 30 s)
const currentTimeDisplay = ref(currentTimeWIB())
setInterval(() => { currentTimeDisplay.value = currentTimeWIB() }, 30_000)

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

// ── Live schedule helpers ─────────────────────────────────────────
/** Next slot after the current clock time */
const nextSlot = computed(() => {
  const now = currentTimeDisplay.value
  return schedule.todaySlots.find(s => s.start_time > now) ?? null
})

/** Current lesson display helpers (locale-reactive) */
const currentSubjectEmoji = computed(() =>
  schedule.currentSlot
    ? (schedule.getSubject(schedule.currentSlot.subject_key)?.emoji ?? '📚')
    : '📚'
)
const currentSubjectName = computed(() => {
  const slot = schedule.currentSlot
  if (!slot) return ''
  const sub = schedule.getSubject(slot.subject_key)
  return pick(sub?.name_id ?? slot.subject_key, sub?.name_en ?? slot.subject_key)
})

/** Next lesson display helpers (locale-reactive) */
const nextSubjectEmoji = computed(() =>
  nextSlot.value
    ? (schedule.getSubject(nextSlot.value.subject_key)?.emoji ?? '📚')
    : '📚'
)
const nextSubjectName = computed(() => {
  const slot = nextSlot.value
  if (!slot) return ''
  const sub = schedule.getSubject(slot.subject_key)
  return pick(sub?.name_id ?? slot.subject_key, sub?.name_en ?? slot.subject_key)
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
    schedule.fetchAll(),
    habits.fetchAll(),
    cal.fetchYear(year),
  ])
})
</script>
