/**
 * Supabase Edge Function: send-reminders
 *
 * Called by two pg_cron schedules:
 *   🌙 Night before:   12:00 UTC (19:00 WIB)
 *   ☀️ Early morning: 22:30 UTC prev day (05:30 WIB)
 *
 * Algorithm:
 *  1. Determine which reminder type this is (from query param ?type=night|morning)
 *  2. Figure out the target school day (WIB)
 *  3. Load that day's schedule slots + uniforms from lulu schema
 *  4. Check calendar_events — skip if target day is a holiday/weekend
 *  5. Build a friendly Indonesian push message
 *  6. Fetch all push_subscriptions + notification_prefs
 *  7. Send Web Push to subscriptions that have the reminder enabled
 *  8. Prune stale subscriptions (HTTP 404/410 responses)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Web Push via web-push (npm esm)
import webpush from 'https://esm.sh/web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL  = 'mailto:dhanifudin@gmail.com'

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)

const WIB_OFFSET = 7 * 60 * 60 * 1000  // UTC+7 in ms

function nowWIB(): Date {
  return new Date(Date.now() + WIB_OFFSET)
}

function dateStringWIB(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function dayOfWeekWIB(d: Date): number {
  const day = d.getDay()
  return day === 0 ? 7 : day  // ISO: 1=Mon, 7=Sun
}

const DOW_ID = ['', 'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']

Deno.serve(async (req: Request) => {
  const url    = new URL(req.url)
  const type   = url.searchParams.get('type') ?? 'night'  // 'night' | 'morning'

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: 'lulu' } })

  const wibNow = nowWIB()

  // Determine target date
  let targetDate: Date
  if (type === 'night') {
    // Night: remind about TOMORROW
    targetDate = new Date(wibNow.getTime() + 24 * 60 * 60 * 1000)
  } else {
    // Morning: remind about TODAY
    targetDate = wibNow
  }

  const targetDateStr = dateStringWIB(targetDate)
  const targetDow = dayOfWeekWIB(targetDate)

  // Skip weekends
  if (targetDow >= 6) {
    return new Response('Weekend — no reminder', { status: 200 })
  }

  // Check if target day is a holiday
  const { data: holidays } = await supabase
    .from('calendar_events')
    .select('id, title')
    .eq('type', 'holiday')
    .lte('start_date', targetDateStr)
    .gte('end_date', targetDateStr)

  if (holidays && holidays.length > 0) {
    return new Response(`Holiday (${holidays[0].title}) — skipping`, { status: 200 })
  }

  // Load schedule for target day (non-break/prayer academic subjects only)
  const { data: slots } = await supabase
    .from('schedule_slots')
    .select('subject_key, label, start_time')
    .eq('day_of_week', targetDow)
    .order('start_time')

  // Load subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('key, name_id, category')

  const subjectMap = new Map((subjects ?? []).map((s: { key: string; name_id: string; category: string }) => [s.key, s]))

  // Unique academic subjects (no duplicates, no break/prayer/ceremony)
  const SKIP_CATS = new Set(['break', 'prayer', 'ceremony'])
  const seen = new Set<string>()
  const subjectList: string[] = []
  let firstStart = ''

  for (const slot of (slots ?? [])) {
    const sub = subjectMap.get(slot.subject_key)
    if (!sub || SKIP_CATS.has(sub.category)) continue
    if (!seen.has(slot.subject_key)) {
      seen.add(slot.subject_key)
      subjectList.push(sub.name_id)
    }
    if (!firstStart) firstStart = slot.start_time
  }

  // Load uniform for target day
  const { data: uniformData } = await supabase
    .from('uniforms')
    .select('name_id, emoji')
    .eq('day_of_week', targetDow)
    .maybeSingle()

  const uniformStr = uniformData ? `${uniformData.emoji} Seragam: ${uniformData.name_id}` : ''

  // Build message
  const dowId = DOW_ID[targetDow]
  const subjectStr = subjectList.slice(0, 5).join(', ') + (subjectList.length > 5 ? '…' : '')

  let title: string
  let body: string

  if (type === 'night') {
    title = `🎒 Siapkan untuk besok, ${dowId}!`
    body  = `Mata pelajaran: ${subjectStr}. ${uniformStr}`
  } else {
    title = `☀️ Selamat pagi! Hari ini ${dowId} 🌸`
    body  = `${subjectStr}${firstStart ? `. Mulai jam ${firstStart.slice(0,5)}` : ''}. ${uniformStr}`
  }

  const payload = JSON.stringify({
    title,
    body,
    icon:  '/lulu/flower-192.png',
    badge: '/lulu/flower-192.png',
    url:   '/lulu/#/',
    tag:   `lulu-${type}`,
  })

  // Load subscriptions + prefs
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, user_id')

  const { data: prefs } = await supabase
    .from('notification_prefs')
    .select('user_id, night_before_enabled, morning_enabled')

  const prefsMap = new Map((prefs ?? []).map((p: { user_id: string; night_before_enabled: boolean; morning_enabled: boolean }) => [p.user_id, p]))

  const staleIds: string[] = []
  let sent = 0

  for (const sub of (subs ?? [])) {
    const p = prefsMap.get(sub.user_id)
    // Default: enabled if no prefs row
    const enabled = type === 'night'
      ? (p?.night_before_enabled ?? true)
      : (p?.morning_enabled ?? true)
    if (!enabled) continue

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 3600 }
      )
      sent++
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        staleIds.push(sub.id)
      }
    }
  }

  // Prune stale subscriptions
  if (staleIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds)
  }

  return new Response(
    JSON.stringify({ type, targetDate: targetDateStr, sent, stale: staleIds.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
