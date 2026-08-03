import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface NotifPrefs {
  id?: string
  user_id?: string
  night_before_enabled: boolean
  night_before_time: string       // HH:mm WIB
  morning_enabled: boolean
  morning_time: string            // HH:mm WIB
  pickup_enabled: boolean
  pickup_minutes_before: number   // default 30
}

const DEFAULT_PREFS: NotifPrefs = {
  night_before_enabled: true,
  night_before_time: '19:00',
  morning_enabled: true,
  morning_time: '05:30',
  pickup_enabled: true,
  pickup_minutes_before: 30,
}

export const useNotificationsStore = defineStore('notifications', () => {
  const prefs = ref<NotifPrefs>({ ...DEFAULT_PREFS })
  const supported = ref('Notification' in window && 'PushManager' in window)
  const permission = ref<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const subscribed = ref(false)

  async function fetchPrefs() {
    const { data } = await supabase.from('notification_prefs').select('*').maybeSingle()
    if (data) prefs.value = data
  }

  async function savePrefs(p: Partial<NotifPrefs>) {
    prefs.value = { ...prefs.value, ...p }
    const authStore = useAuthStore()
    await supabase
      .from('notification_prefs')
      .upsert({ ...prefs.value, user_id: authStore.user?.id }, { onConflict: 'user_id' })
  }

  async function requestPermission(): Promise<boolean> {
    if (!supported.value) return false
    const result = await Notification.requestPermission()
    permission.value = result
    return result === 'granted'
  }

  async function subscribe() {
    if (!supported.value || permission.value !== 'granted') return
    const reg = await navigator.serviceWorker.ready
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    const json = sub.toJSON()
    const authStore = useAuthStore()

    await supabase.from('push_subscriptions').upsert({
      user_id: authStore.user?.id,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_agent: navigator.userAgent.slice(0, 200),
    }, { onConflict: 'endpoint' })

    subscribed.value = true
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
    }
    subscribed.value = false
  }

  async function checkSubscription() {
    if (!supported.value) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    subscribed.value = !!sub
  }

  return {
    prefs, supported, permission, subscribed,
    fetchPrefs, savePrefs, requestPermission, subscribe, unsubscribe, checkSubscription,
  }
})

// Web Push helper
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer
}
