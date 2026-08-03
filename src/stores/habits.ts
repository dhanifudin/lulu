import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { todayWIB, calcStreak } from '@/lib/time'

export interface Habit {
  id: string
  name_id: string
  name_en: string
  emoji: string
  sort_order: number
  active: boolean
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string       // YYYY-MM-DD
  completed: boolean
}

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref<Habit[]>([])
  const logs = ref<HabitLog[]>([])       // last 30 days
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    const today = todayWIB()
    // Calculate 30 days ago
    const from = new Date(today)
    from.setDate(from.getDate() - 30)
    const fromStr = from.toISOString().slice(0, 10)

    const [habitsRes, logsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('active', true).order('sort_order'),
      supabase.from('habit_logs')
        .select('*')
        .gte('date', fromStr)
        .eq('completed', true),
    ])
    if (habitsRes.data) habits.value = habitsRes.data
    if (logsRes.data) logs.value = logsRes.data
    loading.value = false
  }

  /** Dates (YYYY-MM-DD) a habit was completed */
  function datesForHabit(habitId: string): string[] {
    return logs.value.filter(l => l.habit_id === habitId && l.completed).map(l => l.date)
  }

  /** Was habit completed today? */
  function isCompletedToday(habitId: string): boolean {
    const today = todayWIB()
    return logs.value.some(l => l.habit_id === habitId && l.date === today && l.completed)
  }

  /** Star count = total completed days */
  function starCount(habitId: string): number {
    return datesForHabit(habitId).length
  }

  /** Streak for a habit */
  function streak(habitId: string): number {
    return calcStreak(datesForHabit(habitId))
  }

  /** All of today's active habits completed? */
  const allDoneToday = computed(() => {
    if (!habits.value.length) return false
    return habits.value.every(h => isCompletedToday(h.id))
  })

  /** Toggle a habit for today */
  async function toggle(habitId: string) {
    const today = todayWIB()
    const already = isCompletedToday(habitId)

    if (already) {
      // Remove
      await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', today)
      logs.value = logs.value.filter(l => !(l.habit_id === habitId && l.date === today))
    } else {
      // Insert
      const { data } = await supabase
        .from('habit_logs')
        .insert({ habit_id: habitId, date: today, completed: true })
        .select()
        .single()
      if (data) logs.value.push(data)
    }
  }

  /** Add a new habit */
  async function addHabit(habit: Omit<Habit, 'id' | 'sort_order' | 'active'>) {
    const maxOrder = habits.value.reduce((m, h) => Math.max(m, h.sort_order), 0)
    const { data } = await supabase
      .from('habits')
      .insert({ ...habit, sort_order: maxOrder + 1, active: true })
      .select()
      .single()
    if (data) habits.value.push(data)
  }

  /** Last 7 completion dates for a habit (true/false per day, index 0=6d ago, 6=today) */
  function weekGrid(habitId: string): boolean[] {
    const today = todayWIB()
    const completed = new Set(datesForHabit(habitId))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      return completed.has(d.toISOString().slice(0, 10))
    })
  }

  return {
    habits, logs, loading,
    fetchAll, isCompletedToday, starCount, streak, allDoneToday,
    toggle, addHabit, weekGrid,
  }
})
