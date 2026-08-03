<template>
  <div v-if="uniform"
       class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm shadow-flower max-w-full min-w-0"
       :style="{ backgroundColor: uniform.color + '33', color: '#5A3E4D' }">
    <span class="text-xl flex-shrink-0">{{ uniform.emoji }}</span>
    <div class="min-w-0">
      <p class="font-display font-bold text-base leading-tight truncate">{{ uniform.name_id }}</p>
      <p class="text-xs opacity-70 truncate">{{ uniform.name_en }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Uniform } from '@/stores/schedule'

defineProps<{ uniform: Uniform | null }>()
</script>
