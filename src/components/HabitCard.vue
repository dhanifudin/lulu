<template>
  <div class="card flex items-center gap-4 animate-pop">
    <!-- Check circle -->
    <button
      @click="emit('toggle', habit.id)"
      class="habit-circle flex-shrink-0"
      :class="done ? 'habit-circle-done' : 'habit-circle-todo'"
      :aria-label="done ? `Batal ${habit.name_id}` : `Selesai ${habit.name_id}`"
    >
      <span v-if="done" class="text-2xl">✓</span>
    </button>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="font-display font-bold text-plum-700 text-base leading-tight">
        {{ habit.emoji }} {{ habit.name_id }}
      </p>
      <p class="text-xs text-plum-700/60">{{ habit.name_en }}</p>

      <!-- Week grid: last 7 days -->
      <div class="flex gap-1 mt-2">
        <div
          v-for="(day, i) in weekGrid"
          :key="i"
          class="w-5 h-5 rounded-md transition-colors duration-150"
          :class="day ? 'bg-pink-300' : 'bg-pink-100'"
          :title="dayLabels[i]"
        />
      </div>
    </div>

    <!-- Stars & streak -->
    <div class="flex-shrink-0 text-right">
      <p class="font-display font-bold text-pink-400 text-lg leading-none">
        ⭐ {{ stars }}
      </p>
      <p v-if="currentStreak > 0" class="text-xs text-orange-400 font-semibold mt-1">
        🔥 {{ currentStreak }} hari
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Habit } from '@/stores/habits'

const props = defineProps<{
  habit: Habit
  done: boolean
  stars: number
  currentStreak: number
  weekGrid: boolean[]
}>()

const emit = defineEmits<{ toggle: [id: string] }>()

// Last 7 day short labels (Mon–Sun)
const DAY_SHORT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
const today = new Date()
const dayLabels = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today)
  d.setDate(d.getDate() - (6 - i))
  return DAY_SHORT[d.getDay()]
})
</script>
