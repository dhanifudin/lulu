<template>
  <div class="min-h-screen bg-cream">
    <!-- Auth loading splash -->
    <div v-if="auth.loading" class="min-h-screen flex items-center justify-center flower-bg">
      <div class="text-center">
        <div class="text-6xl mb-4 animate-bounce">🌸</div>
        <p class="font-display text-pink-400 font-semibold text-lg">Memuat…</p>
      </div>
    </div>

    <!-- Unauthorized screen -->
    <div v-else-if="auth.unauthorized" class="min-h-screen flex items-center justify-center flower-bg p-6">
      <div class="card text-center max-w-sm w-full">
        <div class="text-5xl mb-4">🚫🌸</div>
        <h1 class="font-display text-plum-700 text-xl font-bold mb-2">Maaf!</h1>
        <p class="text-plum-700 text-sm mb-6">
          Akun ini tidak diizinkan untuk mengakses aplikasi Lulu 🌸
        </p>
        <button @click="auth.signOut()" class="btn-secondary w-full">
          Coba akun lain
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
import { watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BottomNav from '@/components/BottomNav.vue'

// auth.init() is called in main.ts before mount — no need to call it here.
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// After PKCE code exchange, onAuthStateChange fires AFTER the router has
// already sent the unauthenticated user to #/login. Watch isLoggedIn so
// we navigate away as soon as the session is confirmed.
watch(() => auth.isLoggedIn, (loggedIn) => {
  if (loggedIn && route.name === 'login') {
    router.replace({ name: 'today' })
  }
})
</script>
