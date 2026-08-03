<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div v-if="habit" class="fixed inset-0 z-50 flex items-end justify-center">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

      <!-- Sheet -->
      <Transition name="slide-up">
        <div v-if="habit" class="relative z-10 w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 space-y-4"
             style="max-height: 90dvh; overflow-y: auto;">

          <!-- Handle bar -->
          <div class="w-12 h-1.5 bg-pink-200 rounded-full mx-auto mb-2" />

          <h3 class="font-display font-bold text-plum-700 text-lg">{{ t('habits.editTitle') }}</h3>

          <!-- Emoji -->
          <input v-model="editEmoji" :placeholder="t('habits.emojiPlaceholder')" class="input" />

          <!-- Names -->
          <input v-model="editNameId" :placeholder="t('habits.namePlaceholder')" class="input" />
          <input v-model="editNameEn" :placeholder="t('habits.nameEnPlaceholder')" class="input" />

          <!-- Time window (hidden for prayer habits) -->
          <template v-if="!habit.prayer_key">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-semibold text-plum-700/60 mb-1.5 block">{{ t('habits.startLabel') }}</label>
                <input type="time" v-model="editStartTime" class="input" />
              </div>
              <div>
                <label class="text-xs font-semibold text-plum-700/60 mb-1.5 block">{{ t('habits.endLabel') }}</label>
                <input type="time" v-model="editEndTime" class="input" />
              </div>
            </div>
          </template>
          <p v-else class="text-xs text-plum-700/50 bg-pink-50 rounded-2xl px-4 py-3">
            🕌 {{ t('habits.prayerTimeNote') }}
          </p>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <!-- Delete with 2-step confirm -->
            <button
              @click="onDeleteTap"
              class="flex-1 flex items-center justify-center gap-1 rounded-2xl border-2 py-3 font-display font-bold text-sm transition-all duration-150 active:scale-95"
              :class="confirmDelete
                ? 'border-red-400 bg-red-50 text-red-500'
                : 'border-pink-200 bg-white text-plum-700/50 hover:border-pink-300'"
            >
              {{ confirmDelete ? t('habits.deleteConfirm') : t('habits.deleteBtn') }}
            </button>

            <!-- Save -->
            <button @click="onSave" :disabled="!editNameId.trim()"
                    class="flex-1 btn-primary py-3 text-sm">
              {{ t('common.save') }}
            </button>
          </div>

          <!-- Cancel -->
          <button @click="emit('close')"
                  class="w-full text-center text-sm text-plum-700/40 py-1">
            {{ t('habits.cancelBtn') }}
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Habit } from '@/stores/habits'

const props = defineProps<{ habit: Habit | null }>()
const emit = defineEmits<{
  close: []
  save: [patch: Partial<Pick<Habit, 'name_id' | 'name_en' | 'emoji' | 'start_time' | 'end_time'>>]
  delete: [id: string]
}>()

const { t } = useI18n()

const editEmoji     = ref('')
const editNameId    = ref('')
const editNameEn    = ref('')
const editStartTime = ref('')
const editEndTime   = ref('')
const confirmDelete = ref(false)

// Populate form when a habit is selected
watch(() => props.habit, (h) => {
  if (!h) { confirmDelete.value = false; return }
  editEmoji.value     = h.emoji
  editNameId.value    = h.name_id
  editNameEn.value    = h.name_en
  editStartTime.value = h.start_time ? h.start_time.slice(0, 5) : ''
  editEndTime.value   = h.end_time   ? h.end_time.slice(0, 5)   : ''
  confirmDelete.value = false
})

function onSave() {
  if (!editNameId.value.trim()) return
  emit('save', {
    emoji:      editEmoji.value || '⭐',
    name_id:    editNameId.value.trim(),
    name_en:    editNameEn.value.trim() || editNameId.value.trim(),
    start_time: editStartTime.value || null,
    end_time:   editEndTime.value   || null,
  })
}

function onDeleteTap() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
  } else {
    emit('delete', props.habit!.id)
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to       { transform: translateY(100%); }
</style>
