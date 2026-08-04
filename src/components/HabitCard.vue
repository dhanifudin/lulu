<template>
  <div class="card flex items-center gap-4 animate-pop cursor-pointer transition-transform active:scale-[0.98]"
       @click="emit('edit', habit)">
    <!-- Check circle (stop propagation so it doesn't open the editor) -->
    <button
      @click.stop="emit('toggle', habit.id)"
      class="habit-circle flex-shrink-0"
      :class="done ? 'habit-circle-done' : 'habit-circle-todo'"
      :aria-label="done
        ? t('habits.markUndone', { name: displayName })
        : t('habits.markDone',   { name: displayName })"
    >
      <span v-if="done" class="text-2xl">✓</span>
    </button>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="font-display font-bold text-plum-700 text-base leading-tight">
        {{ habit.emoji }} {{ displayName }}
      </p>
      <!-- Time window -->
      <p v-if="timeLabel" class="text-xs text-plum-700/60 mt-0.5">🕐 {{ timeLabel }}</p>

      <!-- Week grid: last 7 days -->
      <div class="flex gap-1 mt-2">
        <div
          v-for="(day, i) in weekGrid"
          :key="i"
          class="w-5 h-5 rounded-md transition-colors duration-150"
          :class="day ? 'bg-pink-300' : 'bg-pink-100'"
        />
      </div>
    </div>

    <!-- Flowers & streak -->
    <div class="flex-shrink-0 text-right">
      <p class="font-display font-bold text-pink-400 text-lg leading-none tabular-nums">
        🌸 {{ stars }}
      </p>
      <p v-if="currentStreak > 0" class="text-xs text-orange-400 font-semibold mt-1">
        {{ t('habits.streakDays', { n: currentStreak }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplayName } from '@/composables/useDisplayName'
import type { Habit } from '@/stores/habits'

const props = defineProps<{
  habit: Habit
  done: boolean
  stars: number
  currentStreak: number
  weekGrid: boolean[]
  /** Formatted time label, e.g. "04:32" or "06:00–06:10". Null = no display. */
  timeLabel?: string | null
}>()

const emit = defineEmits<{ toggle: [id: string]; edit: [habit: Habit] }>()

const { t } = useI18n()
const { pick }  = useDisplayName()

const displayName = computed(() => pick(props.habit.name_id, props.habit.name_en))
</script>
