<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <div class="flower-bg bg-gradient-to-b from-pink-100 to-cream px-6 pt-8 pb-4">
      <h1 class="font-display font-bold text-plum-700 text-2xl">📅 Jadwal Kelas</h1>
      <p class="text-sm text-plum-700/60">I-B ICP · SD Lab UM Malang 2026/2027</p>
    </div>

    <!-- Day tabs -->
    <div class="sticky top-0 z-10 bg-cream/95 backdrop-blur px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-pink-100">
      <button
        v-for="day in DAYS"
        :key="day.dow"
        @click="activeDay = day.dow"
        class="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-display font-bold transition-all duration-150"
        :class="activeDay === day.dow
          ? 'bg-pink-300 text-white shadow-flower scale-105'
          : 'bg-pink-50 text-plum-700/70 hover:bg-pink-100'"
      >
        {{ day.short }}
      </button>
    </div>

    <div class="px-4 pt-4 pb-6">
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
          Tidak ada jadwal 😊
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { dayOfWeekWIB } from '@/lib/time'
import SubjectCard  from '@/components/SubjectCard.vue'
import UniformBadge from '@/components/UniformBadge.vue'

const schedule = useScheduleStore()

const todayDow = dayOfWeekWIB()
// Only Mon-Fri (1-5) are school days; default to today or Monday
const activeDay = ref(todayDow >= 1 && todayDow <= 5 ? todayDow : 1)
const isToday = computed(() => activeDay.value === todayDow)

const DAYS = [
  { dow: 1, label: 'Senin',  short: 'Sen' },
  { dow: 2, label: 'Selasa', short: 'Sel' },
  { dow: 3, label: 'Rabu',   short: 'Rab' },
  { dow: 4, label: 'Kamis',  short: 'Kam' },
  { dow: 5, label: 'Jumat',  short: 'Jum' },
]

onMounted(() => schedule.fetchAll())
</script>
