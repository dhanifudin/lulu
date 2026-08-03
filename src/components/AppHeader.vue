<template>
  <PageHeader>
    <!-- Row 1: avatar + greeting + title + actions -->
    <div class="flex items-center gap-3 mb-2">
      <img v-if="auth.userAvatar" :src="auth.userAvatar"
           class="w-10 h-10 rounded-full border-2 border-pink-300 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-xs text-plum-700/60">{{ t('home.greeting', { name: firstName }) }}</p>
        <h1 class="font-display font-bold text-plum-700 text-xl leading-tight">{{ title }}</h1>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <LangToggle />
        <button @click="auth.signOut()"
                class="text-xs font-semibold bg-white/60 hover:bg-pink-50 text-plum-700/50 hover:text-pink-500 rounded-xl px-3 py-2 transition-all active:scale-95 border border-pink-100">
          {{ t('common.signOut') }}
        </button>
      </div>
    </div>

    <!-- Date + live clock -->
    <p class="text-sm font-semibold text-pink-500 mb-2">
      📅 {{ localizedDate }} · {{ currentTimeDisplay }}
    </p>

    <!-- Page-specific extras -->
    <slot />
  </PageHeader>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { nowWIB, currentTimeWIB, formatLongDate } from '@/lib/time'
import PageHeader from '@/components/PageHeader.vue'
import LangToggle from '@/components/LangToggle.vue'

defineProps<{ title: string }>()

const { t, locale } = useI18n()
const auth = useAuthStore()

const firstName = computed(() => auth.userName.split(' ')[0])

// Locale-aware long date, recomputed when language toggles
const localizedDate = computed(() => formatLongDate(nowWIB(), locale.value))

// Live clock, updates every 30 s
const currentTimeDisplay = ref(currentTimeWIB())
setInterval(() => { currentTimeDisplay.value = currentTimeWIB() }, 30_000)
</script>
