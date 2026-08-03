import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { todayWIB } from '@/lib/time'

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export interface PrayerTimes {
  date: string
  fajr: string     // HH:MM
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

/** Slice Postgres time string (HH:MM:SS) down to HH:MM */
function toHHMM(t: string): string {
  return t.slice(0, 5)
}

export const usePrayerTimesStore = defineStore('prayerTimes', () => {
  const times = ref<PrayerTimes | null>(null)
  const loading = ref(false)

  /** Return HH:MM for a prayer key, or null if not yet loaded */
  function timeFor(key: PrayerKey): string | null {
    if (!times.value) return null
    return times.value[key]
  }

  async function fetchToday() {
    if (loading.value) return
    loading.value = true
    const today = todayWIB()

    // 1. Try the local Supabase cache first
    const { data } = await supabase
      .from('prayer_times')
      .select('*')
      .eq('date', today)
      .maybeSingle()

    if (data) {
      times.value = {
        date: data.date,
        fajr:    toHHMM(data.fajr),
        dhuhr:   toHHMM(data.dhuhr),
        asr:     toHHMM(data.asr),
        maghrib: toHHMM(data.maghrib),
        isha:    toHHMM(data.isha),
      }
      loading.value = false
      return
    }

    // 2. Not cached yet — invoke the Edge Function to fetch & store
    try {
      const { data: fnData, error } = await supabase.functions.invoke('fetch-prayer-times')
      if (!error && fnData) {
        times.value = {
          date:    fnData.date,
          fajr:    toHHMM(String(fnData.fajr)),
          dhuhr:   toHHMM(String(fnData.dhuhr)),
          asr:     toHHMM(String(fnData.asr)),
          maghrib: toHHMM(String(fnData.maghrib)),
          isha:    toHHMM(String(fnData.isha)),
        }
      }
    } catch (e) {
      console.warn('[prayerTimes] fetch-prayer-times failed:', e)
    }

    loading.value = false
  }

  return { times, loading, timeFor, fetchToday }
})
