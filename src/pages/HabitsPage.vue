<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <PageHeader>
      <h1 class="font-display font-bold text-plum-700 text-2xl">{{ t('habits.title') }}</h1>
      <p class="text-sm text-plum-700/60 mt-0.5">{{ t('habits.subtitle', { date: todayStr }) }}</p>

      <!-- Summary stat cards -->
      <div class="mt-3 flex gap-2">
        <div class="card-pink flex-1 text-center py-2">
          <p class="font-display font-bold text-pink-500 text-2xl">{{ doneCount }}/{{ habits.habits.length }}</p>
          <p class="text-[11px] text-plum-700/60 leading-tight mt-0.5 whitespace-pre-line">{{ t('habits.doneToday') }}</p>
        </div>
        <div class="card-pink flex-1 text-center py-2">
          <p class="font-display font-bold text-orange-400 text-2xl">🔥 {{ maxStreak }}</p>
          <p class="text-[11px] text-plum-700/60 leading-tight mt-0.5 whitespace-pre-line">{{ t('habits.longestStreak') }}</p>
        </div>
        <div class="card-pink flex-1 text-center py-2">
          <p class="font-display font-bold text-pink-400 text-2xl">⭐ {{ totalStars }}</p>
          <p class="text-[11px] text-plum-700/60 leading-tight mt-0.5 whitespace-pre-line">{{ t('habits.totalStars') }}</p>
        </div>
      </div>
    </PageHeader>

    <div class="page pt-4 space-y-1 pb-6">
      <!-- Loading -->
      <div v-if="habits.loading" class="text-center py-12 text-3xl text-pink-300">🌸</div>

      <template v-else>
        <!-- Grouped habit sections -->
        <template v-for="group in groupedHabits" :key="group.bucket">
          <!-- Section header -->
          <div class="flex items-center gap-3 pt-3 pb-1">
            <span class="font-display font-bold text-plum-700 text-sm">
              {{ t(`habits.groups.${group.bucket}`) }}
            </span>
            <div class="flex-1 border-t border-pink-100" />
          </div>

          <!-- Habits in this group -->
          <div class="space-y-3">
            <HabitCard
              v-for="item in group.items"
              :key="item.habit.id"
              :habit="item.habit"
              :time-label="item.timeLabel"
              :done="habits.isCompletedToday(item.habit.id)"
              :stars="habits.starCount(item.habit.id)"
              :current-streak="habits.streak(item.habit.id)"
              :week-grid="habits.weekGrid(item.habit.id)"
              @toggle="habits.toggle"
            />
          </div>
        </template>

        <p v-if="!habits.habits.length"
           class="text-center text-plum-700/40 text-sm py-4">
          {{ t('habits.noHabits') }}
        </p>

        <!-- Add habit -->
        <div class="card space-y-3 mt-4">
          <h3 class="font-display font-bold text-plum-700">{{ t('habits.addTitle') }}</h3>
          <input v-model="newNameId" :placeholder="t('habits.namePlaceholder')"
                 class="w-full border border-pink-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400" />
          <input v-model="newNameEn" :placeholder="t('habits.nameEnPlaceholder')"
                 class="w-full border border-pink-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400" />
          <input v-model="newEmoji" :placeholder="t('habits.emojiPlaceholder')"
                 class="w-full border border-pink-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400" />
          <!-- Optional time window -->
          <div class="flex gap-2 items-center">
            <input type="time" v-model="newStartTime"
                   class="flex-1 border border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            <span class="text-plum-700/40 text-xs">–</span>
            <input type="time" v-model="newEndTime"
                   class="flex-1 border border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
          </div>
          <button @click="addHabit" :disabled="!newNameId" class="btn-primary">
            {{ t('habits.addBtn') }}
          </button>
        </div>

        <!-- Notification settings -->
        <NotificationSettings />
      </template>
    </div>

    <ConfettiBlast :show="showConfetti" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHabitsStore, type Habit } from '@/stores/habits'
import { usePrayerTimesStore, type PrayerKey } from '@/stores/prayerTimes'
import { formatDateId, nowWIB } from '@/lib/time'
import HabitCard            from '@/components/HabitCard.vue'
import ConfettiBlast        from '@/components/ConfettiBlast.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'
import PageHeader           from '@/components/PageHeader.vue'

const { t }   = useI18n()
const habits  = useHabitsStore()
const prayers = usePrayerTimesStore()

const todayStr = formatDateId(nowWIB())

const doneCount  = computed(() => habits.habits.filter(h => habits.isCompletedToday(h.id)).length)
const totalStars = computed(() => habits.habits.reduce((s, h) => s + habits.starCount(h.id), 0))
const maxStreak  = computed(() => habits.habits.reduce((m, h) => Math.max(m, habits.streak(h.id)), 0))

// ── Grouping ──────────────────────────────────────────────────────────────────

type Bucket = 'morning' | 'afternoon' | 'evening' | 'chores'
const BUCKETS: Bucket[] = ['morning', 'afternoon', 'evening', 'chores']

interface HabitItem {
  habit: Habit
  timeLabel: string | null
  sortKey: string        // for within-group ordering
}

/** Effective start time: live prayer time for prayer habits, else DB start_time. */
function effectiveStart(habit: Habit): string | null {
  if (habit.prayer_key) {
    return prayers.timeFor(habit.prayer_key as PrayerKey)
  }
  return habit.start_time ? habit.start_time.slice(0, 5) : null
}

/** Human-readable time label: "04:32" for prayers, "06:00–06:10" for timed habits. */
function buildTimeLabel(habit: Habit, start: string | null): string | null {
  if (!start) return null
  const end = (!habit.prayer_key && habit.end_time) ? habit.end_time.slice(0, 5) : null
  return end ? `${start}–${end}` : start
}

/** Map effective start to bucket. */
function getBucket(start: string | null): Bucket {
  if (!start) return 'chores'
  if (start < '12:00') return 'morning'
  if (start < '17:30') return 'afternoon'
  return 'evening'
}

const groupedHabits = computed(() => {
  const map = new Map<Bucket, HabitItem[]>()
  BUCKETS.forEach(b => map.set(b, []))

  for (const habit of habits.habits) {
    const start  = effectiveStart(habit)
    const bucket = getBucket(start)
    map.get(bucket)!.push({
      habit,
      timeLabel: buildTimeLabel(habit, start),
      sortKey: start ?? `z${String(habit.sort_order).padStart(6, '0')}`,
    })
  }

  // Sort within each bucket by start time (then sort_order for ties / chores)
  for (const items of map.values()) {
    items.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }

  return BUCKETS
    .map(bucket => ({ bucket, items: map.get(bucket)! }))
    .filter(g => g.items.length > 0)
})

// ── Add habit form ────────────────────────────────────────────────────────────

const newNameId    = ref('')
const newNameEn    = ref('')
const newEmoji     = ref('⭐')
const newStartTime = ref('')
const newEndTime   = ref('')

async function addHabit() {
  if (!newNameId.value) return
  await habits.addHabit({
    name_id:    newNameId.value,
    name_en:    newNameEn.value || newNameId.value,
    emoji:      newEmoji.value || '⭐',
    start_time: newStartTime.value || null,
    end_time:   newEndTime.value   || null,
  })
  newNameId.value    = ''
  newNameEn.value    = ''
  newEmoji.value     = '⭐'
  newStartTime.value = ''
  newEndTime.value   = ''
}

// ── Confetti ──────────────────────────────────────────────────────────────────

const showConfetti = ref(false)
let confettiShown = false
watch(() => habits.allDoneToday, (val) => {
  if (val && !confettiShown) {
    showConfetti.value = true
    confettiShown = true
    setTimeout(() => { showConfetti.value = false }, 4000)
  }
})

onMounted(async () => {
  await Promise.all([habits.fetchAll(), prayers.fetchToday()])
})
</script>
