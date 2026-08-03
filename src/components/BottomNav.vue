<template>
  <!-- Floating pill nav — primary navigation for the app -->
  <nav class="fixed bottom-0 left-0 right-0 z-50 px-3"
       style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px)">
    <div class="bg-white/95 backdrop-blur-sm shadow-flower-lg border border-pink-100/60 rounded-3xl max-w-lg mx-auto overflow-hidden">
      <div class="flex items-stretch p-1 gap-1">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] rounded-2xl transition-all duration-200 select-none"
          :class="isActive(tab.to)
            ? 'text-pink-500 bg-pink-50 shadow-sm'
            : 'text-plum-700/45 hover:text-pink-400 hover:bg-pink-50/50 active:bg-pink-50'"
        >
          <span class="text-2xl leading-none"
                :class="isActive(tab.to) ? 'scale-110' : 'scale-100'"
                style="transition: transform 0.15s cubic-bezier(0.175,0.885,0.32,1.275)">
            {{ tab.icon }}
          </span>
          <span class="text-xs font-semibold font-body leading-none"
                :class="isActive(tab.to) ? 'text-pink-500' : 'text-plum-700/45'">
            {{ t(tab.labelKey) }}
          </span>
        </RouterLink>
      </div>
    </div>
  </nav>
  <!-- Spacer: nav bar ~68px + 12px bottom margin + up to 34px safe area -->
  <div class="h-28" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()

const tabs = [
  { to: '/',         icon: '🏠', labelKey: 'nav.home'     },
  { to: '/schedule', icon: '📅', labelKey: 'nav.schedule' },
  { to: '/habits',   icon: '⭐', labelKey: 'nav.habits'   },
  { to: '/calendar', icon: '🌸', labelKey: 'nav.calendar' },
  { to: '/settings', icon: '⚙️', labelKey: 'nav.settings' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
