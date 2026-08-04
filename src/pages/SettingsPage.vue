<template>
  <div class="min-h-screen bg-cream">
    <AppHeader :title="t('nav.settings')" />
    <div class="page pt-4 pb-6 space-y-4">

      <!-- Language selector -->
      <div class="card space-y-3">
        <h3 class="font-display font-bold text-plum-700 text-lg">{{ t('settings.language') }}</h3>
        <div class="flex gap-3">
          <button
            v-for="lang in (['id', 'en'] as const)"
            :key="lang"
            @click="setLocale(lang)"
            class="flex-1 rounded-2xl py-3 font-display font-bold text-base transition-all duration-150 active:scale-95"
            :class="locale === lang
              ? 'bg-pink-400 text-white shadow-flower'
              : 'bg-pink-50 text-plum-700/60 hover:bg-pink-100'"
          >
            {{ lang === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English' }}
          </button>
        </div>
      </div>

      <!-- Notifications + reminders -->
      <NotificationSettings />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'
import AppHeader            from '@/components/AppHeader.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'

const { t, locale } = useI18n()
</script>
