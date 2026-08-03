/**
 * Supabase Edge Function: fetch-prayer-times
 *
 * Fetches today's (WIB) prayer times for Malang from the Aladhan API
 * and caches them in lulu.prayer_times.  Safe to call multiple times —
 * already-cached dates are returned immediately without hitting Aladhan.
 *
 * Scheduling (manual pg_cron step — configure once in Supabase dashboard):
 *   -- Fetch tomorrow's times each night at 17:10 UTC (00:10 WIB next day)
 *   SELECT cron.schedule('fetch-prayer-times', '10 17 * * *',
 *     $$SELECT net.http_post(url:='<SUPABASE_URL>/functions/v1/fetch-prayer-times',
 *              headers:='{"Authorization":"Bearer <SERVICE_KEY>"}'::jsonb)$$);
 *
 * Query params:
 *   ?date=YYYY-MM-DD  (optional, defaults to today WIB)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Malang, East Java coordinates
const LAT    = -7.9797
const LON    = 112.6304
// Method 20 = Kemenag Indonesia; fallback is method 3 (Muslim World League)
const METHOD = 20

const WIB_OFFSET = 7 * 60 * 60 * 1000  // UTC+7 in ms

function todayWIB(): string {
  return new Date(Date.now() + WIB_OFFSET).toISOString().slice(0, 10)
}

/** YYYY-MM-DD → DD-MM-YYYY (Aladhan date param format) */
function toDDMMYYYY(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}-${m}-${y}`
}

Deno.serve(async (req: Request) => {
  const url      = new URL(req.url)
  const dateStr  = url.searchParams.get('date') ?? todayWIB()

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: 'lulu' } })

  // 1. Return cached row immediately if it exists
  const { data: cached } = await supabase
    .from('prayer_times')
    .select('*')
    .eq('date', dateStr)
    .maybeSingle()

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Fetch from Aladhan
  const ddmmyyyy  = toDDMMYYYY(dateStr)
  const aladhanUrl = `https://api.aladhan.com/v1/timings/${ddmmyyyy}?latitude=${LAT}&longitude=${LON}&method=${METHOD}`

  let timings: Record<string, string>
  try {
    const resp = await fetch(aladhanUrl)
    const body = await resp.json()
    if (body.code !== 200) throw new Error(`Aladhan ${body.code}: ${body.status}`)
    timings = body.data.timings as Record<string, string>
  } catch (err) {
    console.error('Aladhan fetch failed:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Strip seconds (HH:MM:SS → HH:MM) and build the row
  const row = {
    date:    dateStr,
    fajr:    timings.Fajr.slice(0, 5),
    dhuhr:   timings.Dhuhr.slice(0, 5),
    asr:     timings.Asr.slice(0, 5),
    maghrib: timings.Maghrib.slice(0, 5),
    isha:    timings.Isha.slice(0, 5),
  }

  // 3. Store in cache (upsert — safe to replay)
  const { error: upsertErr } = await supabase
    .from('prayer_times')
    .upsert(row, { onConflict: 'date' })

  if (upsertErr) console.error('prayer_times upsert error:', upsertErr)

  return new Response(JSON.stringify(row), {
    headers: { 'Content-Type': 'application/json' },
  })
})
