<template>
  <Teleport to="body">
    <div v-if="show"
         class="fixed inset-0 z-[999] pointer-events-none flex items-center justify-center">
      <div class="text-center">
        <p class="font-display font-bold text-pink-500 text-2xl drop-shadow-lg animate-bounce">
          🎉 Semua selesai! 🌸
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import confetti from 'canvas-confetti'

const props = defineProps<{ show: boolean }>()

function blast() {
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.55 },
    colors: ['#FF8FB1', '#FFC2D1', '#C7CEEA', '#B5EAD7', '#FFE5EC', '#FFEAA7'],
  })
  // Second burst
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 }, angle: 60 })
    confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 }, angle: 120 })
  }, 300)
}

watch(() => props.show, (val) => {
  if (val) blast()
})
</script>
