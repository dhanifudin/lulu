<template>
  <div class="min-h-screen bg-cream">
    <AppHeader :title="t('nav.settings')" />
    <div class="page pt-4 pb-6">
      <NotificationSettings />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppHeader            from '@/components/AppHeader.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'

const { t } = useI18n()
</script>
