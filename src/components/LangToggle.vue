<template>
  <!-- Language toggle pill: ID | EN -->
  <div class="inline-flex items-center rounded-xl overflow-hidden border border-pink-200 text-xs font-bold select-none">
    <button
      v-for="lang in (['id', 'en'] as const)"
      :key="lang"
      @click="setLocale(lang)"
      class="px-2.5 py-1.5 uppercase transition-colors duration-150"
      :class="locale === lang
        ? 'bg-pink-400 text-white'
        : 'bg-white/80 text-plum-700/50 hover:bg-pink-50'"
    >
      {{ lang.toUpperCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

const { locale } = useI18n()
</script>
