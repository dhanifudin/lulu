<template>
  <div class="min-h-screen bg-cream">
    <!-- Offline banner -->
    <div v-if="!isOnline" class="fixed top-0 inset-x-0 z-50 bg-amber-400 text-amber-900 text-center text-xs py-1 font-semibold tracking-wide">
      {{ t('common.offline') }}
    </div>

    <!-- Auth loading splash -->
    <div v-if="auth.loading" class="min-h-screen flex items-center justify-center flower-bg">
      <div class="text-center">
        <div class="text-6xl mb-4 animate-bounce">🌸</div>
        <p class="font-display text-pink-400 font-semibold text-lg">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Unauthorized screen -->
    <div v-else-if="auth.unauthorized" class="min-h-screen flex items-center justify-center flower-bg p-6">
      <div class="card text-center max-w-sm w-full">
        <div class="text-5xl mb-4">🚫🌸</div>
        <h1 class="font-display text-plum-700 text-xl font-bold mb-2">{{ t('common.unauthorized') }}</h1>
        <p class="text-plum-700 text-sm mb-6">{{ t('common.unauthorizedMsg') }}</p>
        <button @click="auth.signOut()" class="btn-secondary w-full">
          {{ t('common.tryOtherAccount') }}
        </button>
      </div>
    </div>

    <!-- Main app -->
    <template v-else>
      <RouterView />
      <!-- Bottom nav only when logged in -->
      <BottomNav v-if="auth.isLoggedIn" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BottomNav from '@/components/BottomNav.vue'

const { t }  = useI18n()
const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()

const isOnline = ref(navigator.onLine)
function onOnline()  { isOnline.value = true }
function onOffline() { isOnline.value = false }
onMounted(() => {
  window.addEventListener('online',  onOnline)
  window.addEventListener('offline', onOffline)
})
onUnmounted(() => {
  window.removeEventListener('online',  onOnline)
  window.removeEventListener('offline', onOffline)
})

// Keep the rendered view in sync with auth state in BOTH directions.
// Reacting to route.name as well closes the PKCE login race: if isLoggedIn
// flips before /login finishes navigating, this re-fires once route.name
// settles to 'login' and then replaces to today. The route.name && guard
// skips the very first tick before the router has a resolved route name.
watchEffect(() => {
  if (auth.isLoggedIn && route.name === 'login') {
    router.replace({ name: 'today' })           // logged in → enter app
  } else if (!auth.isLoggedIn && route.name && route.name !== 'login') {
    router.replace({ name: 'login' })            // logged out → back to login
  }
})
</script>
