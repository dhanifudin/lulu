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
  start_time: string | null   // HH:MM:SS from DB, or null
  end_time: string | null
  prayer_key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string       // YYYY-MM-DD
  completed: boolean
}

const HABITS_CACHE_KEY = 'lulu-cache-habits-v1'

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref<Habit[]>([])
  const logs = ref<HabitLog[]>([])       // last 30 days
  const loading = ref(false)

  function loadCache(): boolean {
    try {
      const raw = localStorage.getItem(HABITS_CACHE_KEY)
      if (!raw) return false
      const saved = JSON.parse(raw) as { habits: Habit[]; logs: HabitLog[] }
      if (saved.habits?.length) habits.value = saved.habits
      if (saved.logs?.length)   logs.value   = saved.logs
      return saved.habits?.length > 0
    } catch { return false }
  }

  function saveCache() {
    try {
      localStorage.setItem(HABITS_CACHE_KEY, JSON.stringify({ habits: habits.value, logs: logs.value }))
    } catch { /* storage unavailable */ }
  }

  async function fetchAll() {
    const hasCached = loadCache()
    loading.value = !hasCached

    const today = todayWIB()
    const from = new Date(today)
    from.setDate(from.getDate() - 30)
    const fromStr = from.toISOString().slice(0, 10)

    try {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('active', true).order('sort_order'),
        supabase.from('habit_logs')
          .select('*')
          .gte('date', fromStr)
          .eq('completed', true),
      ])
      if (habitsRes.data) habits.value = habitsRes.data
      if (logsRes.data)   logs.value   = logsRes.data
      saveCache()
    } catch { /* offline — cached data already loaded above */ }

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
      logs.value = logs.value.filter(l => !(l.habit_id === habitId && l.date === today))
      saveCache()
      await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', today)
    } else {
      const { data } = await supabase
        .from('habit_logs')
        .insert({ habit_id: habitId, date: today, completed: true })
        .select()
        .single()
      if (data) {
        logs.value.push(data)
        saveCache()
      }
    }
  }

  /** Update editable fields of a habit */
  async function updateHabit(id: string, patch: Partial<Pick<Habit, 'name_id' | 'name_en' | 'emoji' | 'start_time' | 'end_time'>>) {
    const { data } = await supabase.from('habits').update(patch).eq('id', id).select().single()
    if (data) {
      const i = habits.value.findIndex(h => h.id === id)
      if (i !== -1) habits.value[i] = data
    }
  }

  /** Soft-delete a habit — sets active=false, keeps logs/history */
  async function deleteHabit(id: string) {
    await supabase.from('habits').update({ active: false }).eq('id', id)
    habits.value = habits.value.filter(h => h.id !== id)
  }

  /** Add a new habit */
  async function addHabit(habit: Omit<Habit, 'id' | 'sort_order' | 'active' | 'prayer_key'>) {
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
    toggle, addHabit, updateHabit, deleteHabit, weekGrid,
  }
})
