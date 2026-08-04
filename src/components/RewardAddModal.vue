<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-end justify-center">
        <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

        <Transition name="slide-up">
          <div v-if="show"
               class="relative z-10 w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 space-y-4"
               style="max-height: 90dvh; overflow-y: auto; padding-bottom: max(2rem, env(safe-area-inset-bottom))">

            <div class="w-12 h-1.5 bg-pink-200 rounded-full mx-auto mb-2" />
            <h3 class="font-display font-bold text-plum-700 text-lg">{{ t('rewards.addTitle') }}</h3>

            <!-- Emoji picker -->
            <EmojiField v-model="newEmoji" />

            <!-- Names -->
            <input v-model="newNameId" :placeholder="t('rewards.namePlaceholder')" class="input" />
            <input v-model="newNameEn" :placeholder="t('rewards.nameEnPlaceholder')" class="input" />

            <!-- Flower cost -->
            <div>
              <label class="text-xs font-semibold text-plum-700/60 mb-2 block">{{ t('rewards.costLabel') }}</label>
              <div class="flex items-center gap-4">
                <button type="button"
                        @click="cost = Math.max(1, cost - 1)"
                        class="stepper-btn">−</button>
                <span class="font-display font-bold text-plum-700 text-2xl w-12 text-center">
                  🌸 {{ cost }}
                </span>
                <button type="button"
                        @click="cost = Math.min(999, cost + 1)"
                        class="stepper-btn">＋</button>
              </div>
            </div>

            <button @click="onAdd" :disabled="!newNameId.trim()" class="btn-primary">
              {{ t('rewards.addBtn') }}
            </button>
            <button @click="emit('close')"
                    class="w-full text-center text-sm text-plum-700/40 py-2">
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
import EmojiField from '@/components/EmojiField.vue'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{
  close: []
  add: [data: { name_id: string; name_en: string; emoji: string; star_cost: number }]
}>()

const { t } = useI18n()

const newEmoji  = ref('🎁')
const newNameId = ref('')
const newNameEn = ref('')
const cost      = ref(10)

watch(() => props.show, (v) => {
  if (v) {
    newEmoji.value  = '🎁'
    newNameId.value = ''
    newNameEn.value = ''
    cost.value      = 10
  }
})

function onAdd() {
  if (!newNameId.value.trim()) return
  emit('add', {
    name_id:   newNameId.value.trim(),
    name_en:   newNameEn.value.trim() || newNameId.value.trim(),
    emoji:     newEmoji.value || '🎁',
    star_cost: cost.value,
  })
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to       { transform: translateY(100%); }
</style>
