<template>
  <div class="relative">
    <!-- Trigger button -->
    <button
      type="button"
      @click="open = !open"
      class="w-full flex items-center gap-3 border-2 border-pink-200 rounded-2xl px-4 py-3
             bg-white active:bg-pink-50 transition-all duration-150 min-h-[52px]"
    >
      <span class="text-3xl leading-none select-none">{{ modelValue || '🌸' }}</span>
      <span class="text-sm text-plum-700/60">{{ t('habits.pickEmoji') }}</span>
      <span class="ml-auto text-pink-300 text-base leading-none">{{ open ? '▴' : '▾' }}</span>
    </button>

    <!-- Inline picker panel (no Teleport needed — sheet already scrolls) -->
    <Transition name="expand">
      <div v-if="open" class="mt-2 rounded-2xl overflow-hidden border-2 border-pink-100">
        <EmojiPicker
          :native="true"
          theme="light"
          :disable-skin-tones="true"
          @select="onSelect"
          class="w-full !rounded-none !border-none !shadow-none"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()
const open = ref(false)

function onSelect(emoji: { i: string }) {
  emit('update:modelValue', emoji.i)
  open.value = false
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
  transform-origin: top center;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
}
</style>
