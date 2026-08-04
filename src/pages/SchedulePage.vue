<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <AppHeader :title="t('schedule.title')">
      <p class="text-sm text-plum-700/60 mt-0.5">{{ t('schedule.subtitle') }}</p>
    </AppHeader>

    <!-- Day tabs -->
    <div class="sticky z-10 bg-cream/95 backdrop-blur py-2 overflow-x-auto no-scrollbar border-b border-pink-100"
         style="top: env(safe-area-inset-top, 0px)">
      <div class="flex gap-2 max-w-lg mx-auto px-3">
        <button
          v-for="(day, i) in schoolDays"
          :key="day.dow"
          @click="activeDay = day.dow"
          class="flex-shrink-0 px-4 rounded-2xl text-sm font-display font-bold transition-all duration-150 min-h-[44px]"
          :class="activeDay === day.dow
            ? 'bg-pink-300 text-white shadow-flower scale-105'
            : 'bg-pink-50 text-plum-700/70 hover:bg-pink-100 active:bg-pink-100'"
        >
          {{ weekdayShort[i] }}
        </button>
      </div>
    </div>

    <div class="page pt-4 pb-6">
      <!-- Uniform for selected day -->
      <div class="mb-4">
        <UniformBadge :uniform="schedule.uniformForDay(activeDay)" />
      </div>

      <!-- Loading -->
      <div v-if="schedule.loading" class="text-center py-12 text-pink-300 text-3xl">🌸</div>

      <!-- Slots for selected day -->
      <div v-else class="space-y-2">
        <SubjectCard
          v-for="slot in schedule.slotsForDay(activeDay)"
          :key="slot.id"
          :slot="slot"
          :subject="schedule.getSubject(slot.subject_key)"
          :is-active="isToday && schedule.currentSlot?.id === slot.id"
        />
        <p v-if="!schedule.slotsForDay(activeDay).length"
           class="text-center text-plum-700/40 text-sm py-8">
          {{ t('schedule.noSchedule') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScheduleStore } from '@/stores/schedule'
import { dayOfWeekWIB } from '@/lib/time'
import SubjectCard  from '@/components/SubjectCard.vue'
import UniformBadge from '@/components/UniformBadge.vue'
import AppHeader    from '@/components/AppHeader.vue'

const { t, tm } = useI18n()
const schedule  = useScheduleStore()

const todayDow  = dayOfWeekWIB()
const activeDay = ref(todayDow >= 1 && todayDow <= 5 ? todayDow : 1)
const isToday   = computed(() => activeDay.value === todayDow)

// Mon-Fri day objects — reactive to locale changes via tm()
const weekdayShort = computed(() => tm('days.weekdayShort') as string[])
const schoolDays   = [
  { dow: 1 }, { dow: 2 }, { dow: 3 }, { dow: 4 }, { dow: 5 },
]

onMounted(() => schedule.fetchAll())
</script>
