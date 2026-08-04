<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <AppHeader :title="t('habits.title')">
      <p class="text-sm text-plum-700/60 mt-0.5">{{ t('habits.subtitle') }}</p>

      <!-- Summary stat cards -->
      <div class="mt-3 flex gap-2">
        <div class="card-pink flex-1 text-center py-2">
          <p class="font-display font-bold text-pink-500 text-2xl tabular-nums">{{ doneCount }}/{{ habits.habits.length }}</p>
          <p class="text-xs text-plum-700/60 leading-tight mt-0.5 whitespace-pre-line">{{ t('habits.doneToday') }}</p>
        </div>
        <div class="card-pink flex-1 text-center py-2">
          <p class="font-display font-bold text-orange-400 text-2xl tabular-nums">🔥 {{ maxStreak }}</p>
          <p class="text-xs text-plum-700/60 leading-tight mt-0.5 whitespace-pre-line">{{ t('habits.longestStreak') }}</p>
        </div>
        <RouterLink to="/rewards"
          class="card-pink flex-1 text-center py-2 block active:scale-95 transition-transform">
          <p class="font-display font-bold text-pink-400 text-2xl tabular-nums">🌸 {{ totalStars }}</p>
          <p class="text-xs text-plum-700/60 leading-tight mt-0.5 whitespace-pre-line">{{ t('habits.totalStars') }}</p>
          <p class="text-[10px] text-pink-400 mt-0.5 leading-none">{{ t('habits.viewRewards') }}</p>
        </RouterLink>
      </div>
    </AppHeader>

    <!-- Category tabs: icon-only when unselected, full label+count when active -->
    <div class="sticky z-10 bg-cream/95 backdrop-blur py-2 overflow-x-auto no-scrollbar border-b border-pink-100"
         style="top: env(safe-area-inset-top, 0px)">
      <div class="flex gap-2 max-w-lg mx-auto px-3">
        <button
          v-for="bucket in BUCKETS"
          :key="bucket"
          @click="activeBucket = bucket"
          class="flex-shrink-0 flex items-center gap-1 rounded-2xl text-sm font-display font-bold transition-all duration-150 min-h-[44px]"
          :class="activeBucket === bucket
            ? 'bg-pink-300 text-white shadow-flower px-4 py-2'
            : 'bg-pink-50 text-plum-700/70 hover:bg-pink-100 active:bg-pink-100 px-3 py-2'"
          :aria-label="t(`habits.groups.${bucket}`)"
        >
          <span v-if="activeBucket === bucket">{{ t(`habits.groups.${bucket}`) }}</span>
          <span v-else class="text-base leading-none">{{ BUCKET_ICONS[bucket] }}</span>
          <span v-if="activeBucket === bucket && groupedHabits[bucket].length" class="text-xs opacity-75">
            {{ doneInBucket(bucket) }}/{{ groupedHabits[bucket].length }}
          </span>
        </button>
      </div>
    </div>

    <div class="page pt-4 space-y-1 pb-6">
      <!-- Loading -->
      <div v-if="habits.loading" class="text-center py-12 text-3xl text-pink-300">🌸</div>

      <template v-else>
        <!-- Habits in active bucket -->
        <div class="space-y-3">
          <HabitCard
            v-for="item in groupedHabits[activeBucket]"
            :key="item.habit.id"
            :habit="item.habit"
            :time-label="item.timeLabel"
            :done="habits.isCompletedToday(item.habit.id)"
            :stars="habits.starCount(item.habit.id)"
            :current-streak="habits.streak(item.habit.id)"
            :week-grid="habits.weekGrid(item.habit.id)"
            @toggle="habits.toggle"
            @edit="editingHabit = $event"
          />
          <p v-if="!groupedHabits[activeBucket].length"
             class="text-center text-plum-700/40 text-sm py-8">
            {{ t('habits.noHabitsInGroup') }}
          </p>
        </div>
      </template>
    </div>

    <!-- FAB: centered above the bottom nav -->
    <button @click="showAddModal = true"
            class="fixed left-1/2 -translate-x-1/2 z-50 w-16 h-16 rounded-full bg-pink-400
                   hover:bg-pink-500 text-white text-4xl shadow-flower-lg flex items-center
                   justify-center transition-all active:scale-90 select-none"
            style="bottom: calc(env(safe-area-inset-bottom, 0px) + 88px)">
      ＋
    </button>

    <ConfettiBlast :show="showConfetti" />

    <!-- Add modal -->
    <HabitAddModal :show="showAddModal" @close="showAddModal = false" @add="onHabitAdded" />

    <!-- Edit modal -->
    <HabitEditModal
      :habit="editingHabit"
      @close="editingHabit = null"
      @save="onEditSave"
      @delete="onEditDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHabitsStore, type Habit } from '@/stores/habits'
import { usePrayerTimesStore, type PrayerKey } from '@/stores/prayerTimes'
import { currentTimeWIB } from '@/lib/time'
import AppHeader      from '@/components/AppHeader.vue'
import HabitCard      from '@/components/HabitCard.vue'
import HabitAddModal  from '@/components/HabitAddModal.vue'
import HabitEditModal from '@/components/HabitEditModal.vue'
import ConfettiBlast  from '@/components/ConfettiBlast.vue'

const { t }   = useI18n()
const habits  = useHabitsStore()
const prayers = usePrayerTimesStore()

const doneCount  = computed(() => habits.habits.filter(h => habits.isCompletedToday(h.id)).length)
const totalStars = computed(() => habits.habits.reduce((s, h) => s + habits.starCount(h.id), 0))
const maxStreak  = computed(() => habits.habits.reduce((m, h) => Math.max(m, habits.streak(h.id)), 0))

// ── Grouping ──────────────────────────────────────────────────────────────────

type Bucket = 'morning' | 'afternoon' | 'evening' | 'chores'
const BUCKETS: Bucket[] = ['morning', 'afternoon', 'evening', 'chores']
const BUCKET_ICONS: Record<Bucket, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙', chores: '🧹' }

interface HabitItem {
  habit: Habit
  timeLabel: string | null
  sortKey: string
}

function effectiveStart(habit: Habit): string | null {
  if (habit.prayer_key) return prayers.timeFor(habit.prayer_key as PrayerKey)
  return habit.start_time ? habit.start_time.slice(0, 5) : null
}

function buildTimeLabel(habit: Habit, start: string | null): string | null {
  if (!start) return null
  const end = (!habit.prayer_key && habit.end_time) ? habit.end_time.slice(0, 5) : null
  return end ? `${start}–${end}` : start
}

function getBucket(start: string | null): Bucket {
  if (!start) return 'chores'
  if (start < '12:00') return 'morning'
  if (start < '17:30') return 'afternoon'
  return 'evening'
}

const groupedHabits = computed((): Record<Bucket, HabitItem[]> => {
  const map: Record<Bucket, HabitItem[]> = { morning: [], afternoon: [], evening: [], chores: [] }
  for (const habit of habits.habits) {
    const start  = effectiveStart(habit)
    const bucket = getBucket(start)
    map[bucket].push({
      habit,
      timeLabel: buildTimeLabel(habit, start),
      sortKey: start ?? `z${String(habit.sort_order).padStart(6, '0')}`,
    })
  }
  for (const bucket of BUCKETS) {
    map[bucket].sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }
  return map
})

const activeBucket = ref<Bucket>(getBucket(currentTimeWIB()))

function doneInBucket(bucket: Bucket): number {
  return groupedHabits.value[bucket].filter(item => habits.isCompletedToday(item.habit.id)).length
}

// ── Add habit ─────────────────────────────────────────────────────────────────

const showAddModal = ref(false)

async function onHabitAdded(data: Omit<Habit, 'id' | 'sort_order' | 'active' | 'prayer_key'>) {
  await habits.addHabit(data)
  showAddModal.value = false
}

// ── Edit / delete habit ───────────────────────────────────────────────────────

const editingHabit = ref<Habit | null>(null)

async function onEditSave(patch: Parameters<typeof habits.updateHabit>[1]) {
  await habits.updateHabit(editingHabit.value!.id, patch)
  editingHabit.value = null
}

async function onEditDelete(id: string) {
  await habits.deleteHabit(id)
  editingHabit.value = null
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
