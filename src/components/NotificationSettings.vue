<template>
  <div class="card space-y-4">
    <h3 class="font-display font-bold text-plum-700 text-lg flex items-center gap-2">
      🔔 Pengingat / Reminders
    </h3>

    <!-- Not supported -->
    <div v-if="!store.supported" class="text-sm text-plum-700/60">
      Browser ini tidak mendukung notifikasi push.
    </div>

    <template v-else>
      <!-- Permission request -->
      <div v-if="store.permission !== 'granted'" class="space-y-2">
        <p class="text-sm text-plum-700/70">
          Izinkan notifikasi untuk mendapatkan pengingat jadwal sekolah.
        </p>
        <button @click="requestAndSubscribe" class="btn-primary">
          Izinkan Notifikasi 🔔
        </button>
      </div>

      <template v-else>
        <!-- Subscribe toggle -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-plum-700">Notifikasi Aktif</span>
          <!-- Toggle: min 44px tap area via padding -->
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
              <span class="text-sm font-semibold text-plum-700">🌙 Pengingat Malam (siapkan buku)</span>
            </label>
            <input v-if="nightEnabled" type="time" v-model="nightTime"
                   class="text-sm border border-pink-200 rounded-xl px-3 py-2.5 w-full" />
          </div>

          <!-- Morning -->
          <div class="space-y-1">
            <label class="flex items-center gap-3 cursor-pointer py-1">
              <input type="checkbox" v-model="morningEnabled"
                     class="w-5 h-5 rounded accent-pink-400 flex-shrink-0" />
              <span class="text-sm font-semibold text-plum-700">☀️ Pengingat Pagi (jadwal hari ini)</span>
            </label>
            <input v-if="morningEnabled" type="time" v-model="morningTime"
                   class="text-sm border border-pink-200 rounded-xl px-3 py-2.5 w-full" />
          </div>

          <button @click="save" class="btn-secondary w-full">Simpan ✓</button>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const store = useNotificationsStore()

const nightEnabled = ref(store.prefs.night_before_enabled)
const nightTime    = ref(store.prefs.night_before_time)
const morningEnabled = ref(store.prefs.morning_enabled)
const morningTime    = ref(store.prefs.morning_time)

onMounted(async () => {
  await store.fetchPrefs()
  await store.checkSubscription()
  nightEnabled.value  = store.prefs.night_before_enabled
  nightTime.value     = store.prefs.night_before_time
  morningEnabled.value = store.prefs.morning_enabled
  morningTime.value   = store.prefs.morning_time
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
    night_before_time: nightTime.value,
    morning_enabled: morningEnabled.value,
    morning_time: morningTime.value,
  })
}
</script>
