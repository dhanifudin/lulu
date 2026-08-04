<template>
  <div class="card space-y-4">
    <h3 class="font-display font-bold text-plum-700 text-lg flex items-center gap-2">
      {{ t('notifications.title') }}
    </h3>

    <!-- Not supported -->
    <div v-if="!store.supported" class="text-sm text-plum-700/60">
      {{ t('notifications.notSupported') }}
    </div>

    <template v-else>
      <!-- Permission request -->
      <div v-if="store.permission !== 'granted'" class="space-y-2">
        <p class="text-sm text-plum-700/70">{{ t('notifications.requestMsg') }}</p>
        <button @click="requestAndSubscribe" class="btn-primary">
          {{ t('notifications.allowBtn') }}
        </button>
      </div>

      <template v-else>
        <!-- Subscribe toggle -->
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm font-semibold text-plum-700">{{ t('notifications.activeLabel') }}</span>
          <button @click="toggleSubscription"
                  class="relative flex-shrink-0 rounded-full transition-colors duration-200 active:opacity-80"
                  style="width:56px; min-width:56px; height:44px; display:flex; align-items:center"
                  :class="store.subscribed ? 'bg-pink-300' : 'bg-gray-200'">
            <span class="absolute left-1 h-7 w-7 bg-white rounded-full shadow transition-transform duration-200"
                  :class="store.subscribed ? 'translate-x-[28px]' : 'translate-x-0'" />
          </button>
        </div>

        <!-- Test button (always visible when permission granted) -->
        <button @click="sendTest" :disabled="testing"
                class="w-full flex items-center justify-center gap-2 rounded-2xl border border-pink-200
                       bg-pink-50 hover:bg-pink-100 text-pink-600 font-semibold text-sm
                       py-3 transition-all active:scale-95 disabled:opacity-50 min-h-[48px]">
          <span v-if="testing" class="text-base animate-spin">🌸</span>
          <span v-else class="text-base">🔔</span>
          {{ testLabel }}
        </button>

        <!-- Reminder settings — always visible but dimmed until subscribed -->
        <div :class="{ 'opacity-40 pointer-events-none': !store.subscribed }">
          <p v-if="!store.subscribed" class="text-xs text-plum-700/60 mb-3">
            {{ t('notifications.enableFirst') }}
          </p>

          <!-- Night before -->
          <div class="space-y-2 mb-4">
            <label class="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input type="checkbox" v-model="nightEnabled"
                     class="w-5 h-5 rounded accent-pink-400 flex-shrink-0" />
              <span class="text-sm font-semibold text-plum-700">{{ t('notifications.nightLabel') }}</span>
            </label>
            <input v-if="nightEnabled" type="time" v-model="nightTime" class="input" />
          </div>

          <!-- Morning -->
          <div class="space-y-2 mb-4">
            <label class="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input type="checkbox" v-model="morningEnabled"
                     class="w-5 h-5 rounded accent-pink-400 flex-shrink-0" />
              <span class="text-sm font-semibold text-plum-700">{{ t('notifications.morningLabel') }}</span>
            </label>
            <input v-if="morningEnabled" type="time" v-model="morningTime" class="input" />
          </div>

          <!-- Pickup reminder — always shown so it's discoverable -->
          <div class="space-y-2">
            <label class="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input type="checkbox" v-model="pickupEnabled"
                     class="w-5 h-5 rounded accent-pink-400 flex-shrink-0" />
              <span class="text-sm font-semibold text-plum-700">{{ t('notifications.pickupLabel') }}</span>
            </label>
            <!-- −/+ stepper for pickup minutes -->
            <div v-if="pickupEnabled" class="flex items-center gap-3">
              <button @click="pickupMinutes = Math.max(5, pickupMinutes - 5)" class="stepper-btn">−</button>
              <span class="font-display font-bold text-plum-700 text-lg w-10 text-center">{{ pickupMinutes }}</span>
              <button @click="pickupMinutes = Math.min(120, pickupMinutes + 5)" class="stepper-btn">＋</button>
              <span class="text-sm text-plum-700/60">{{ t('notifications.pickupMinutes') }}</span>
            </div>
          </div>
        </div>

        <button @click="save" class="btn-secondary w-full">{{ t('notifications.save') }}</button>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotificationsStore } from '@/stores/notifications'
import { supabase } from '@/lib/supabase'

const { t }  = useI18n()
const store  = useNotificationsStore()

// Test notification state
const testing   = ref(false)
const testLabel = ref(t('notifications.testBtn'))

async function sendTest() {
  testing.value   = true
  testLabel.value = t('notifications.testSending')
  try {
    const { data, error } = await supabase.functions.invoke('send-reminders', {
      body: { type: 'test' },
    })
    if (error) throw error
    const d = data as { sent?: number; subsFound?: number; pushErrors?: string[] }
    const sent      = d?.sent      ?? 0
    const subsFound = d?.subsFound ?? 0
    if (d?.pushErrors?.length) console.error('[lulu] push errors:', d.pushErrors)
    if (sent > 0) {
      testLabel.value = t('notifications.testSuccess')
    } else if (subsFound === 0) {
      testLabel.value = t('notifications.testNoSub')
    } else {
      testLabel.value = t('notifications.testPushFailed')
    }
  } catch {
    testLabel.value = t('notifications.testFail')
  } finally {
    testing.value = false
    setTimeout(() => { testLabel.value = t('notifications.testBtn') }, 4000)
  }
}

const nightEnabled   = ref(store.prefs.night_before_enabled)
const nightTime      = ref(store.prefs.night_before_time)
const morningEnabled = ref(store.prefs.morning_enabled)
const morningTime    = ref(store.prefs.morning_time)
const pickupEnabled  = ref(store.prefs.pickup_enabled)
const pickupMinutes  = ref(store.prefs.pickup_minutes_before)

onMounted(async () => {
  await store.fetchPrefs()
  await store.checkSubscription()
  nightEnabled.value   = store.prefs.night_before_enabled
  nightTime.value      = store.prefs.night_before_time
  morningEnabled.value = store.prefs.morning_enabled
  morningTime.value    = store.prefs.morning_time
  pickupEnabled.value  = store.prefs.pickup_enabled
  pickupMinutes.value  = store.prefs.pickup_minutes_before
})

async function requestAndSubscribe() {
  const ok = await store.requestPermission()
  if (ok) await store.subscribe()
}

async function toggleSubscription() {
  if (store.subscribed) {
    await store.unsubscribe()
  } else {
    try {
      await store.subscribe()
    } catch (e) {
      testLabel.value = t('notifications.testFail')
      console.error('[lulu] subscribe error:', e)
      setTimeout(() => { testLabel.value = t('notifications.testBtn') }, 4000)
    }
  }
}

async function save() {
  await store.savePrefs({
    night_before_enabled:  nightEnabled.value,
    night_before_time:     nightTime.value,
    morning_enabled:       morningEnabled.value,
    morning_time:          morningTime.value,
    pickup_enabled:        pickupEnabled.value,
    pickup_minutes_before: pickupMinutes.value,
  })
}
</script>
