<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-end justify-center">
        <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

        <Transition name="slide-up">
          <div v-if="show"
               class="relative z-10 w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 space-y-4"
               style="max-height: 90dvh; overflow-y: auto; padding-bottom: max(2rem, env(safe-area-inset-bottom))">

            <!-- Handle bar -->
            <div class="w-12 h-1.5 bg-pink-200 rounded-full mx-auto mb-2" />

            <h3 class="font-display font-bold text-plum-700 text-lg">{{ t('habits.addTitle') }}</h3>

            <!-- Emoji picker -->
            <EmojiField v-model="newEmoji" />

            <!-- Names -->
            <input v-model="newNameId" :placeholder="t('habits.namePlaceholder')" class="input" />
            <input v-model="newNameEn" :placeholder="t('habits.nameEnPlaceholder')" class="input" />

            <!-- Time window -->
            <div class="grid grid-cols-2 gap-3">
              <TimeWheel v-model="newStartTime" :label="t('habits.startLabel')" />
              <TimeWheel v-model="newEndTime"   :label="t('habits.endLabel')" />
            </div>

            <button @click="onAdd" :disabled="!newNameId.trim()" class="btn-primary">
              {{ t('habits.addBtn') }}
            </button>

            <button @click="emit('close')" class="w-full text-center text-sm text-plum-700/40 py-2">
              {{ t('habits.cancelBtn') }}
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Habit } from '@/stores/habits'
import EmojiField from '@/components/EmojiField.vue'
import TimeWheel  from '@/components/TimeWheel.vue'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{
  close: []
  add: [habit: Omit<Habit, 'id' | 'sort_order' | 'active' | 'prayer_key'>]
}>()

const { t } = useI18n()

const newEmoji     = ref('🌸')
const newNameId    = ref('')
const newNameEn    = ref('')
const newStartTime = ref<string | null>(null)
const newEndTime   = ref<string | null>(null)

// Clear form whenever modal opens
watch(() => props.show, (val) => {
  if (val) {
    newEmoji.value     = '🌸'
    newNameId.value    = ''
    newNameEn.value    = ''
    newStartTime.value = null
    newEndTime.value   = null
  }
})

function onAdd() {
  if (!newNameId.value.trim()) return
  emit('add', {
    name_id:    newNameId.value.trim(),
    name_en:    newNameEn.value.trim() || newNameId.value.trim(),
    emoji:      newEmoji.value || '🌸',
    start_time: newStartTime.value,
    end_time:   newEndTime.value,
  })
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to       { transform: translateY(100%); }
</style>
