<template>
  <div class="min-h-screen flower-bg flex items-center justify-center p-6">
    <!-- Decorative flowers top -->
    <div class="fixed top-4 left-0 right-0 flex justify-center gap-6 text-4xl pointer-events-none select-none opacity-60">
      <span class="animate-bounce" style="animation-delay:0s">🌸</span>
      <span class="animate-bounce" style="animation-delay:.15s">🌷</span>
      <span class="animate-bounce" style="animation-delay:.3s">🌺</span>
      <span class="animate-bounce" style="animation-delay:.15s">🌷</span>
      <span class="animate-bounce" style="animation-delay:0s">🌸</span>
    </div>

    <div class="w-full max-w-sm">
      <div class="card text-center shadow-flower-lg">
        <!-- Logo / title -->
        <div class="text-7xl mb-3 animate-pop">🌸</div>
        <h1 class="font-display font-bold text-pink-500 text-3xl mb-1">Lulu</h1>
        <p class="text-plum-700/60 text-sm mb-1">{{ t('login.subtitle') }}</p>
        <p class="text-plum-700/40 text-xs mb-8">{{ t('login.school') }}</p>

        <!-- School items decoration -->
        <div class="flex justify-center gap-3 text-2xl mb-8 select-none">
          🎒 📚 ✏️ 🖍️ 📐
        </div>

        <!-- Sign in -->
        <button
          @click="signIn"
          :disabled="loading"
          class="btn-primary"
        >
          <svg v-if="!loading" class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span v-if="loading" class="text-xl">🌸</span>
          {{ loading ? t('login.connecting') : t('login.signIn') }}
        </button>

        <!-- Language toggle on login screen -->
        <div class="flex justify-center mt-4">
          <LangToggle />
        </div>

        <p class="text-xs text-plum-700/40 mt-3">
          {{ t('login.restricted') }}
        </p>
      </div>
    </div>

    <!-- Bottom flowers -->
    <div class="fixed bottom-6 left-0 right-0 flex justify-center gap-4 text-3xl pointer-events-none select-none opacity-40">
      🌺 🌸 🌷 🌸 🌺
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import LangToggle from '@/components/LangToggle.vue'

const { t }  = useI18n()
const auth   = useAuthStore()
const loading = ref(false)

async function signIn() {
  loading.value = true
  try {
    await auth.signInWithGoogle()
  } catch {
    loading.value = false
  }
}
</script>
