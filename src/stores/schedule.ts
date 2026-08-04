import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { dayOfWeekWIB, currentTimeWIB, isTimeBetween } from '@/lib/time'

export interface ScheduleSlot {
  id: number
  day_of_week: number
  start_time: string  // HH:mm
  end_time: string    // HH:mm
  subject_key: string
  label: string
}

export interface Subject {
  key: string
  name_id: string
  name_en: string
  emoji: string
  color: string       // hex
  category: 'academic' | 'break' | 'prayer' | 'ceremony' | 'habituation' | 'extracurricular'
}

export interface Uniform {
  day_of_week: number
  name_id: string
  name_en: string
  emoji: string
  color: string
}

const SCHEDULE_CACHE_KEY = 'lulu-cache-schedule-v1'

export const useScheduleStore = defineStore('schedule', () => {
  const slots = ref<ScheduleSlot[]>([])
  const subjects = ref<Map<string, Subject>>(new Map())
  const uniforms = ref<Map<number, Uniform>>(new Map())
  const loading = ref(false)

  function loadCache(): boolean {
    try {
      const raw = localStorage.getItem(SCHEDULE_CACHE_KEY)
      if (!raw) return false
      const saved = JSON.parse(raw) as { slots: ScheduleSlot[]; subjects: [string, Subject][]; uniforms: [number, Uniform][] }
      if (saved.slots?.length)    slots.value    = saved.slots
      if (saved.subjects?.length) subjects.value = new Map(saved.subjects)
      if (saved.uniforms?.length) uniforms.value = new Map(saved.uniforms)
      return saved.slots?.length > 0
    } catch { return false }
  }

  function saveCache() {
    try {
      localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify({
        slots:    slots.value,
        subjects: [...subjects.value.entries()],
        uniforms: [...uniforms.value.entries()],
      }))
    } catch { /* storage unavailable */ }
  }

  async function fetchAll() {
    const hasCached = loadCache()
    loading.value = !hasCached  // skip spinner if we already have cached data

    try {
      const [slotsRes, subjectsRes, uniformsRes] = await Promise.all([
        supabase.from('schedule_slots').select('*').order('day_of_week').order('start_time'),
        supabase.from('subjects').select('*'),
        supabase.from('uniforms').select('*'),
      ])
      if (slotsRes.data) slots.value = slotsRes.data
      if (subjectsRes.data) {
        subjects.value = new Map(subjectsRes.data.map((s: Subject) => [s.key, s]))
      }
      if (uniformsRes.data) {
        uniforms.value = new Map(uniformsRes.data.map((u: Uniform) => [u.day_of_week, u]))
      }
      saveCache()
    } catch { /* offline — cached data already loaded above */ }

    loading.value = false
  }

  /** Slots for a given day of week (1=Mon, 5=Fri) */
  function slotsForDay(dow: number): ScheduleSlot[] {
    return slots.value.filter(s => s.day_of_week === dow)
  }

  /** Today's slots (WIB) */
  const todaySlots = computed(() => slotsForDay(dayOfWeekWIB()))

  /** Uniform for today */
  const todayUniform = computed(() => uniforms.value.get(dayOfWeekWIB()) ?? null)

  /** Uniform for a given day */
  function uniformForDay(dow: number): Uniform | null {
    return uniforms.value.get(dow) ?? null
  }

  /** Subject object from key */
  function getSubject(key: string): Subject | undefined {
    return subjects.value.get(key)
  }

  /** Which slot is currently active (WIB clock) */
  const currentSlot = computed(() => {
    const t = currentTimeWIB()
    return todaySlots.value.find(s =>
      isTimeBetween(t, s.start_time, s.end_time)
    ) ?? null
  })

  return {
    slots, subjects, uniforms, loading,
    fetchAll, slotsForDay, todaySlots, todayUniform, uniformForDay,
    getSubject, currentSlot,
  }
})
