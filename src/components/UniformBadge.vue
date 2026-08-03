<template>
  <div v-if="uniform"
       class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm shadow-flower"
       :style="{ backgroundColor: uniform.color + '33', color: '#5A3E4D' }">
    <span class="text-xl">{{ uniform.emoji }}</span>
    <div>
      <p class="font-display font-bold text-base leading-tight">{{ uniform.name_id }}</p>
      <p class="text-xs opacity-70">{{ uniform.name_en }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Uniform } from '@/stores/schedule'

defineProps<{ uniform: Uniform | null }>()
</script>
