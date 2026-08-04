/**
 * Supabase Edge Function: send-reminders
 *
 * Called by pg_cron schedules:
 *   🌙 Night before:  12:00 UTC (19:00 WIB)
 *   ☀️ Early morning: 22:30 UTC prev day (05:30 WIB)
 *   🚗 Pickup:        every 5 min during school hours — each run
 *                     only delivers to users whose pickup_minutes_before
 *                     window matches the current time vs. school end.
 *
 * Also accepts POST body { type: 'test' } to validate the push pipeline.
 *
 * Query param OR POST body: ?type=night|morning|pickup|test
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL   = 'mailto:dhanifudin@gmail.com'

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

/** Convert "HH:MM:SS" or "HH:MM" to minutes-since-midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

const DOW_ID = ['', 'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  let type  = url.searchParams.get('type') ?? 'night'

  // Also read type from POST body (used by client-side test button)
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      if (body?.type) type = body.type
    } catch { /* no body or not JSON — keep query-param value */ }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: 'lulu' } })
  const wibNow   = nowWIB()

  // ── Test branch: skip all schedule/holiday logic, push to every sub ──
  if (type === 'test') {
    const testPayload = JSON.stringify({
      title: '🌸 Lulu · Test',
      body:  'Push notifications are working! ✓',
      icon:  '/flower-192.png',
      badge: '/flower-192.png',
      url:   '/',
      tag:   'lulu-test',
    })

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')

    const staleIds: string[] = []
    let sent = 0

    for (const sub of (subs ?? [])) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          testPayload,
          { TTL: 60 }
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) staleIds.push(sub.id)
      }
    }

    if (staleIds.length) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds)
    }

    return new Response(
      JSON.stringify({ type: 'test', sent, stale: staleIds.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── Regular branch ────────────────────────────────────────────────────
  let targetDate: Date
  if (type === 'night') {
    targetDate = new Date(wibNow.getTime() + 24 * 60 * 60 * 1000)
  } else {
    targetDate = wibNow
  }

  const targetDateStr = dateStringWIB(targetDate)
  const targetDow     = dayOfWeekWIB(targetDate)

  if (targetDow >= 6) {
    return new Response('Weekend — no reminder', { status: 200 })
  }

  const { data: holidays } = await supabase
    .from('calendar_events')
    .select('id, title')
    .eq('type', 'holiday')
    .lte('start_date', targetDateStr)
    .gte('end_date',   targetDateStr)

  if (holidays && holidays.length > 0) {
    return new Response(`Holiday (${holidays[0].title}) — skipping`, { status: 200 })
  }

  const { data: slots } = await supabase
    .from('schedule_slots')
    .select('subject_key, label, start_time, end_time')
    .eq('day_of_week', targetDow)
    .order('start_time')

  const { data: subjects } = await supabase
    .from('subjects')
    .select('key, name_id, category')

  const subjectMap = new Map(
    (subjects ?? []).map((s: { key: string; name_id: string; category: string }) => [s.key, s])
  )

  const SKIP_CATS = new Set(['break', 'prayer', 'ceremony'])
  const seen        = new Set<string>()
  const subjectList: string[] = []
  let firstStart = ''
  let lastEnd    = ''

  for (const slot of (slots ?? [])) {
    const sub = subjectMap.get(slot.subject_key)
    if (!sub || SKIP_CATS.has(sub.category)) continue
    if (!seen.has(slot.subject_key)) {
      seen.add(slot.subject_key)
      subjectList.push(sub.name_id)
    }
    if (!firstStart) firstStart = slot.start_time
    if (slot.end_time) lastEnd = slot.end_time
  }

  const subjectStr = subjectList.join(', ')

  const { data: uniformData } = await supabase
    .from('uniforms')
    .select('name_id, emoji')
    .eq('day_of_week', targetDow)
    .maybeSingle()

  const uniformStr = uniformData ? `${uniformData.emoji} Seragam: ${uniformData.name_id}` : ''
  const dowId      = DOW_ID[targetDow]

  // Load prefs — including pickup_minutes_before
  const { data: prefs } = await supabase
    .from('notification_prefs')
    .select('user_id, night_before_enabled, morning_enabled, pickup_enabled, pickup_minutes_before')

  const prefsMap = new Map(
    (prefs ?? []).map((p: {
      user_id: string
      night_before_enabled: boolean
      morning_enabled: boolean
      pickup_enabled: boolean
      pickup_minutes_before: number
    }) => [p.user_id, p])
  )

  // Current WIB time in minutes-since-midnight (for pickup window check)
  const nowMinutes = wibNow.getHours() * 60 + wibNow.getMinutes()

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, user_id')

  const staleIds: string[] = []
  let sent = 0

  for (const sub of (subs ?? [])) {
    const p = prefsMap.get(sub.user_id)

    let enabled: boolean
    if (type === 'night') {
      enabled = p?.night_before_enabled ?? true
    } else if (type === 'morning') {
      enabled = p?.morning_enabled ?? true
    } else {
      // pickup — check per-user window
      enabled = p?.pickup_enabled ?? true
      if (enabled && lastEnd) {
        const minutesBefore = p?.pickup_minutes_before ?? 30
        const endMinutes    = timeToMinutes(lastEnd)
        const windowStart   = endMinutes - minutesBefore
        const windowEnd     = windowStart + 5  // 5-min cron window
        if (nowMinutes < windowStart || nowMinutes >= windowEnd) {
          enabled = false  // not this user's window yet
        }
      }
    }

    if (!enabled) continue

    // Build payload for this delivery
    let title: string
    let body: string

    if (type === 'pickup') {
      const endTimeStr = lastEnd ? lastEnd.slice(0, 5) : '--:--'
      title = `🚗 Waktunya jemput! ${dowId}`
      body  = `Sekolah selesai jam ${endTimeStr}. ${uniformStr}`
    } else if (type === 'night') {
      title = `🎒 Siapkan untuk besok, ${dowId}!`
      body  = `Mata pelajaran: ${subjectStr}. ${uniformStr}`
    } else {
      title = `☀️ Selamat pagi! Hari ini ${dowId} 🌸`
      body  = `${subjectStr}${firstStart ? `. Mulai jam ${firstStart.slice(0,5)}` : ''}. ${uniformStr}`
    }

    const payload = JSON.stringify({
      title,
      body,
      icon:  '/flower-192.png',
      badge: '/flower-192.png',
      url:   '/',
      tag:   `lulu-${type}`,
    })

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 3600 }
      )
      sent++
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) staleIds.push(sub.id)
    }
  }

  if (staleIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds)
  }

  return new Response(
    JSON.stringify({ type, targetDate: targetDateStr, sent, stale: staleIds.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
