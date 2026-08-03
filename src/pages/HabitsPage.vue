<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <AppHeader :title="t('habits.title')">
      <p class="text-sm text-plum-700/60 mt-0.5">{{ t('habits.subtitle') }}</p>

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
    </AppHeader>

    <!-- Category tabs: icon-only when unselected, full label+count when active -->
    <div class="sticky top-0 z-10 bg-cream/95 backdrop-blur py-2 overflow-x-auto no-scrollbar border-b border-pink-100">
      <div class="flex gap-2 max-w-lg mx-auto px-3">
        <button
          v-for="bucket in BUCKETS"
          :key="bucket"
          @click="activeBucket = bucket"
          class="flex-shrink-0 flex items-center gap-1 rounded-2xl text-sm font-display font-bold transition-all duration-150"
          :class="activeBucket === bucket
            ? 'bg-pink-300 text-white shadow-flower px-4 py-2'
            : 'bg-pink-50 text-plum-700/70 hover:bg-pink-100 px-3 py-2'"
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

        <!-- Add habit -->
        <div class="card space-y-3 mt-4">
          <h3 class="font-display font-bold text-plum-700">{{ t('habits.addTitle') }}</h3>
          <input v-model="newNameId" :placeholder="t('habits.namePlaceholder')" class="input" />
          <input v-model="newNameEn" :placeholder="t('habits.nameEnPlaceholder')" class="input" />
          <input v-model="newEmoji"  :placeholder="t('habits.emojiPlaceholder')"  class="input" />

          <!-- Time window: 2-col with labels -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-plum-700/60 mb-1.5 block">{{ t('habits.startLabel') }}</label>
              <input type="time" v-model="newStartTime" class="input" />
            </div>
            <div>
              <label class="text-xs font-semibold text-plum-700/60 mb-1.5 block">{{ t('habits.endLabel') }}</label>
              <input type="time" v-model="newEndTime" class="input" />
            </div>
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
import AppHeader            from '@/components/AppHeader.vue'
import HabitCard            from '@/components/HabitCard.vue'
import HabitEditModal       from '@/components/HabitEditModal.vue'
import ConfettiBlast        from '@/components/ConfettiBlast.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'

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

// All 4 buckets always present (empty arrays for empty ones)
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

// Active tab: default to current time-of-day bucket
const activeBucket = ref<Bucket>(getBucket(currentTimeWIB()))

/** Count of completed habits in a bucket today. */
function doneInBucket(bucket: Bucket): number {
  return groupedHabits.value[bucket].filter(item => habits.isCompletedToday(item.habit.id)).length
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
