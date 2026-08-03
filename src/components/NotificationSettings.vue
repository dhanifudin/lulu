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
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-plum-700">{{ t('notifications.activeLabel') }}</span>
          <button @click="toggleSubscription"
                  class="relative w-14 h-8 rounded-full transition-colors duration-200 flex-shrink-0"
                  :class="store.subscribed ? 'bg-pink-300' : 'bg-gray-200'"
                  style="min-width: 56px; min-height: 32px;">
            <span class="absolute top-1 h-6 w-6 bg-white rounded-full shadow transition-transform duration-200"
                  :class="store.subscribed ? 'translate-x-7' : 'translate-x-1'" />
          </button>
        </div>

        <template v-if="store.subscribed">
          <!-- Night before -->
          <div class="space-y-1">
            <label class="flex items-center gap-3 cursor-pointer py-1">
              <input type="checkbox" v-model="nightEnabled"
                     class="w-5 h-5 rounded accent-pink-400 flex-shrink-0" />
              <span class="text-sm font-semibold text-plum-700">{{ t('notifications.nightLabel') }}</span>
            </label>
            <input v-if="nightEnabled" type="time" v-model="nightTime"
                   class="text-sm border border-pink-200 rounded-xl px-3 py-2.5 w-full" />
          </div>

          <!-- Morning -->
          <div class="space-y-1">
            <label class="flex items-center gap-3 cursor-pointer py-1">
              <input type="checkbox" v-model="morningEnabled"
                     class="w-5 h-5 rounded accent-pink-400 flex-shrink-0" />
              <span class="text-sm font-semibold text-plum-700">{{ t('notifications.morningLabel') }}</span>
            </label>
            <input v-if="morningEnabled" type="time" v-model="morningTime"
                   class="text-sm border border-pink-200 rounded-xl px-3 py-2.5 w-full" />
          </div>

          <!-- Pickup reminder -->
          <div class="space-y-1">
            <label class="flex items-center gap-3 cursor-pointer py-1">
              <input type="checkbox" v-model="pickupEnabled"
                     class="w-5 h-5 rounded accent-pink-400 flex-shrink-0" />
              <span class="text-sm font-semibold text-plum-700">{{ t('notifications.pickupLabel') }}</span>
            </label>
            <div v-if="pickupEnabled" class="flex items-center gap-2">
              <input type="number" v-model.number="pickupMinutes" min="5" max="120"
                     class="text-sm border border-pink-200 rounded-xl px-3 py-2.5 w-20 text-center" />
              <span class="text-sm text-plum-700/60">{{ t('notifications.pickupMinutes') }}</span>
            </div>
          </div>

          <button @click="save" class="btn-secondary w-full">{{ t('notifications.save') }}</button>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotificationsStore } from '@/stores/notifications'

const { t }  = useI18n()
const store  = useNotificationsStore()

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
  if (store.subscribed) await store.unsubscribe()
  else await store.subscribe()
}

async function save() {
  await store.savePrefs({
    night_before_enabled: nightEnabled.value,
    night_before_time:    nightTime.value,
    morning_enabled:      morningEnabled.value,
    morning_time:         morningTime.value,
    pickup_enabled:       pickupEnabled.value,
    pickup_minutes_before: pickupMinutes.value,
  })
}
</script>
