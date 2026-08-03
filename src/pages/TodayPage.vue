<template>
  <div class="min-h-screen bg-cream pb-4">
    <!-- Hero header -->
    <div class="flower-bg bg-gradient-to-b from-pink-100 to-cream px-6 pt-8 pb-6">
      <!-- Avatar + greeting -->
      <div class="flex items-center gap-3 mb-4">
        <img v-if="auth.userAvatar" :src="auth.userAvatar" class="w-10 h-10 rounded-full border-2 border-pink-300" />
        <div class="flex-1 min-w-0">
          <p class="text-xs text-plum-700/60">Halo, {{ firstName }}! 👋</p>
          <h1 class="font-display font-bold text-plum-700 text-2xl leading-tight">
            {{ isWeekend ? 'Selamat libur! 🌸' : isHoliday ? '🌸 Hari libur!' : 'Hari ini 🌸' }}
          </h1>
        </div>
        <button @click="auth.signOut()" class="text-plum-700/30 hover:text-pink-400 text-sm p-2">
          Keluar
        </button>
      </div>

      <!-- Date chip -->
      <p class="text-sm font-semibold text-pink-500 mb-3">
        📅 {{ dayName }}, {{ dateStr }}
      </p>

      <!-- Uniform badge -->
      <div v-if="!isWeekend && !isHoliday && schedule.todayUniform" class="mb-2">
        <p class="text-xs text-plum-700/50 mb-1">🎽 Seragam hari ini / Today's Uniform</p>
        <UniformBadge :uniform="schedule.todayUniform" />
      </div>

      <!-- Holiday event label -->
      <div v-if="isHoliday && holidayEvents.length" class="mt-2 space-y-1">
        <div v-for="e in holidayEvents" :key="e.id"
             class="badge bg-pink-100 text-pink-600 text-xs">
          🌸 {{ e.title }}
        </div>
      </div>
    </div>

    <div class="px-4 space-y-4 mt-2">
      <!-- Weekend / holiday state -->
      <div v-if="isWeekend || isHoliday" class="card text-center py-8">
        <div class="text-6xl mb-3">🌺</div>
        <p class="font-display font-bold text-pink-400 text-xl">
          {{ isWeekend ? 'Selamat istirahat!' : 'Hari libur!' }}
        </p>
        <p class="text-sm text-plum-700/60 mt-1">Tidak ada jadwal hari ini 😊</p>
      </div>

      <template v-else>
        <!-- Today's schedule timeline -->
        <div>
          <h2 class="font-display font-bold text-plum-700 text-base mb-2 flex items-center gap-2">
            📅 Jadwal Hari Ini
            <span class="badge bg-pink-100 text-pink-500 text-xs">{{ currentTimeDisplay }}</span>
          </h2>
          <div v-if="schedule.loading" class="text-center py-8 text-pink-300">🌸 Memuat…</div>
          <div v-else class="space-y-2">
            <SubjectCard
              v-for="slot in schedule.todaySlots"
              :key="slot.id"
              :slot="slot"
              :subject="schedule.getSubject(slot.subject_key)"
              :is-active="schedule.currentSlot?.id === slot.id"
            />
          </div>
        </div>

        <!-- Quick habits -->
        <div>
          <h2 class="font-display font-bold text-plum-700 text-base mb-2">⭐ Kebiasaan Hari Ini</h2>
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
            <p v-if="!habits.habits.length" class="text-center text-plum-700/40 text-sm py-4">
              Belum ada kebiasaan. Tambah di tab Kebiasaan! ⭐
            </p>
          </div>
        </div>
      </template>

      <!-- Upcoming events (next 7 days) -->
      <div v-if="upcomingEvents.length">
        <h2 class="font-display font-bold text-plum-700 text-base mb-2">🗓️ Acara Mendatang</h2>
        <div class="space-y-2">
          <div v-for="e in upcomingEvents" :key="e.id"
               class="flex items-center gap-3 card py-3">
            <span class="text-xl">{{ EVENT_EMOJI[e.type] }}</span>
            <div class="min-w-0">
              <p class="font-semibold text-plum-700 text-sm truncate">{{ e.title }}</p>
              <p class="text-xs text-plum-700/50">{{ e.start_date }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfettiBlast :show="showConfetti" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useScheduleStore } from '@/stores/schedule'
import { useHabitsStore }  from '@/stores/habits'
import { useCalendarStore, EVENT_EMOJI } from '@/stores/calendar'
import { nowWIB, todayWIB, dayOfWeekWIB, formatDayId, formatDateId, currentTimeWIB } from '@/lib/time'
import SubjectCard    from '@/components/SubjectCard.vue'
import HabitCard      from '@/components/HabitCard.vue'
import UniformBadge   from '@/components/UniformBadge.vue'
import ConfettiBlast  from '@/components/ConfettiBlast.vue'

const auth     = useAuthStore()
const schedule = useScheduleStore()
const habits   = useHabitsStore()
const cal      = useCalendarStore()

const now      = nowWIB()
const dayName  = formatDayId(now)
const dateStr  = formatDateId(now)
const today    = todayWIB()
const dow      = dayOfWeekWIB()  // 1=Mon…7=Sun

const isWeekend = computed(() => dow >= 6)
const holidayEvents = computed(() => cal.eventsForDate(today).filter(e => e.type === 'holiday'))
const isHoliday = computed(() => holidayEvents.value.length > 0)

const firstName = computed(() => {
  const name = auth.userName
  return name.split(' ')[0]
})

// Live clock in WIB
const currentTimeDisplay = ref(currentTimeWIB())
setInterval(() => { currentTimeDisplay.value = currentTimeWIB() }, 30_000)

// Upcoming events (next 7 days, not today)
const upcomingEvents = computed(() => {
  const from = new Date(today); from.setDate(from.getDate() + 1)
  const to   = new Date(today); to.setDate(to.getDate() + 7)
  const fromStr = from.toISOString().slice(0, 10)
  const toStr   = to.toISOString().slice(0, 10)
  return cal.events.filter(e => e.start_date >= fromStr && e.start_date <= toStr).slice(0, 5)
})

// Confetti when all habits done
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
