import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export type EventType = 'holiday' | 'exam' | 'report' | 'event' | 'activity'

export interface CalendarEvent {
  id: string
  start_date: string   // YYYY-MM-DD
  end_date: string     // YYYY-MM-DD
  title: string
  type: EventType
  description: string | null
}

export const EVENT_COLORS: Record<EventType, string> = {
  holiday:  '#FF8FB1',   // pink
  exam:     '#FFB347',   // amber
  report:   '#B5EAD7',   // mint
  event:    '#C7CEEA',   // lavender
  activity: '#FFE5EC',   // light pink
}

export const EVENT_EMOJI: Record<EventType, string> = {
  holiday:  '🌸',
  exam:     '📝',
  report:   '📋',
  event:    '🎉',
  activity: '🏃',
}

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)

  async function fetchYear(year: number) {
    loading.value = true
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_date', `${year}-01-01`)
      .lte('end_date', `${year}-12-31`)
      .order('start_date')
    if (data) events.value = data
    loading.value = false
  }

  /** Events that overlap with a date string (YYYY-MM-DD) */
  function eventsForDate(dateStr: string): CalendarEvent[] {
    return events.value.filter(e => e.start_date <= dateStr && e.end_date >= dateStr)
  }

  /** Is a date a school holiday / no-school day? */
  function isHoliday(dateStr: string): boolean {
    return eventsForDate(dateStr).some(e => e.type === 'holiday')
  }

  /** Events for a month (1-indexed) */
  function eventsForMonth(year: number, month: number): CalendarEvent[] {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-31`
    return events.value.filter(e => e.end_date >= from && e.start_date <= to)
  }

  return { events, loading, fetchYear, eventsForDate, isHoliday, eventsForMonth }
})
