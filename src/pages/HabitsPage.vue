<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <div class="flower-bg bg-gradient-to-b from-pink-100 to-cream px-6 pt-8 pb-4">
      <h1 class="font-display font-bold text-plum-700 text-2xl">⭐ Kebiasaan Baik</h1>
      <p class="text-sm text-plum-700/60">Good Habits · {{ todayStr }}</p>

      <!-- Summary -->
      <div class="mt-3 flex gap-3">
        <div class="card-pink flex-1 text-center py-2">
          <p class="font-display font-bold text-pink-500 text-2xl">{{ doneCount }}/{{ habits.habits.length }}</p>
          <p class="text-xs text-plum-700/60">Selesai hari ini</p>
        </div>
        <div class="card-pink flex-1 text-center py-2">
          <p class="font-display font-bold text-orange-400 text-2xl">🔥 {{ maxStreak }}</p>
          <p class="text-xs text-plum-700/60">Streak terpanjang</p>
        </div>
        <div class="card-pink flex-1 text-center py-2">
          <p class="font-display font-bold text-pink-400 text-2xl">⭐ {{ totalStars }}</p>
          <p class="text-xs text-plum-700/60">Total bintang</p>
        </div>
      </div>
    </div>

    <div class="px-4 pt-4 space-y-4">
      <!-- Loading -->
      <div v-if="habits.loading" class="text-center py-12 text-3xl text-pink-300">🌸</div>

      <template v-else>
        <!-- Habit list -->
        <div class="space-y-3">
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
        </div>

        <!-- Add habit -->
        <div class="card space-y-3">
          <h3 class="font-display font-bold text-plum-700">➕ Tambah Kebiasaan</h3>
          <input v-model="newNameId" placeholder="Nama (Indonesia)" class="w-full border border-pink-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400" />
          <input v-model="newNameEn" placeholder="Name (English)" class="w-full border border-pink-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400" />
          <input v-model="newEmoji" placeholder="Emoji (e.g. 🏃)" class="w-full border border-pink-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400" />
          <button @click="addHabit" :disabled="!newNameId" class="btn-primary">
            Tambah ➕
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
import { useHabitsStore } from '@/stores/habits'
import { todayWIB, formatDateId, nowWIB } from '@/lib/time'
import HabitCard           from '@/components/HabitCard.vue'
import ConfettiBlast       from '@/components/ConfettiBlast.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'

const habits = useHabitsStore()
const todayStr = formatDateId(nowWIB())

const doneCount   = computed(() => habits.habits.filter(h => habits.isCompletedToday(h.id)).length)
const totalStars  = computed(() => habits.habits.reduce((s, h) => s + habits.starCount(h.id), 0))
const maxStreak   = computed(() => habits.habits.reduce((m, h) => Math.max(m, habits.streak(h.id)), 0))

// Add habit form
const newNameId = ref('')
const newNameEn = ref('')
const newEmoji  = ref('⭐')

async function addHabit() {
  if (!newNameId.value) return
  await habits.addHabit({
    name_id: newNameId.value,
    name_en: newNameEn.value || newNameId.value,
    emoji: newEmoji.value || '⭐',
  })
  newNameId.value = ''
  newNameEn.value = ''
  newEmoji.value  = '⭐'
}

// Confetti
const showConfetti = ref(false)
let confettiShown = false
watch(() => habits.allDoneToday, (val) => {
  if (val && !confettiShown) {
    showConfetti.value = true
    confettiShown = true
    setTimeout(() => { showConfetti.value = false }, 4000)
  }
})

onMounted(() => habits.fetchAll())
</script>
