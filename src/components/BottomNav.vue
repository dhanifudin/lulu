<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-pink-100 shadow-flower-lg"
       style="padding-bottom: env(safe-area-inset-bottom)">
    <div class="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all duration-150 min-w-0"
        :class="isActive(tab.to)
          ? 'text-pink-500 bg-pink-50 scale-105'
          : 'text-plum-700/50 hover:text-pink-400'"
      >
        <span class="text-2xl leading-none">{{ tab.icon }}</span>
        <span class="text-[10px] font-semibold font-body truncate">{{ tab.label }}</span>
      </RouterLink>
    </div>
  </nav>
  <!-- Spacer so content isn't hidden behind nav -->
  <div class="h-20" />
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/',          icon: '🏠', label: 'Beranda' },
  { to: '/jadwal',    icon: '📅', label: 'Jadwal'  },
  { to: '/kebiasaan', icon: '⭐', label: 'Kebiasaan'},
  { to: '/kalender',  icon: '🌸', label: 'Kalender' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
