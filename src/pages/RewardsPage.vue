<template>
  <div class="min-h-screen bg-cream pb-28">

    <!-- Back-nav header -->
    <header class="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-pink-100">
      <div class="page flex items-center gap-3 py-3">
        <button @click="router.back()"
                class="text-2xl text-pink-400 active:scale-90 transition-transform select-none leading-none">
          ←
        </button>
        <h1 class="font-display font-bold text-plum-700 text-xl flex-1">{{ t('rewards.title') }}</h1>
        <LangToggle />
      </div>
    </header>

    <div class="page pt-4 space-y-6">

      <!-- Stars balance hero -->
      <div class="card-pink text-center py-6">
        <p class="font-display font-bold text-yellow-400 leading-none"
           style="font-size: 4rem">⭐ {{ rewardsStore.starsBalance }}</p>
        <p class="text-sm font-semibold text-plum-700/70 mt-2">{{ t('rewards.available') }}</p>
        <p v-if="rewardsStore.starsSpent > 0" class="text-xs text-plum-700/40 mt-1">
          {{ t('rewards.totalEarned', { n: rewardsStore.totalStarsEarned }) }}
          · {{ t('rewards.totalSpent', { n: rewardsStore.starsSpent }) }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="rewardsStore.loading" class="text-center py-10 text-4xl text-pink-300">🌸</div>

      <template v-else>

        <!-- Reward shop -->
        <div>
          <h2 class="font-display font-bold text-plum-700 text-base mb-3">{{ t('rewards.shop') }}</h2>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="reward in rewardsStore.rewards"
              :key="reward.id"
              class="card flex flex-col items-center text-center gap-2 py-5"
              :class="{ 'opacity-50': rewardsStore.starsBalance < reward.star_cost }"
            >
              <span class="text-4xl leading-none">{{ reward.emoji }}</span>
              <p class="font-semibold text-plum-700 text-sm leading-snug">
                {{ locale === 'id' ? reward.name_id : reward.name_en }}
              </p>
              <p class="text-sm font-bold text-yellow-500">⭐ {{ reward.star_cost }}</p>

              <!-- Two-step confirm -->
              <template v-if="confirmingId === reward.id">
                <button
                  @click="doRedeem(reward)"
                  class="btn-primary text-sm py-2 w-full"
                >
                  {{ t('rewards.confirmYes') }}
                </button>
                <button @click="confirmingId = null"
                        class="text-xs text-plum-700/40 py-1">
                  {{ t('rewards.confirmNo') }}
                </button>
              </template>
              <button
                v-else
                @click="startRedeem(reward)"
                :disabled="rewardsStore.starsBalance < reward.star_cost"
                class="btn-primary text-sm py-2 w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {{ rewardsStore.starsBalance >= reward.star_cost
                    ? t('rewards.redeemBtn')
                    : t('rewards.notEnough') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Redemption history -->
        <div v-if="rewardsStore.redemptions.length">
          <h2 class="font-display font-bold text-plum-700 text-base mb-3">{{ t('rewards.history') }}</h2>
          <div class="space-y-2">
            <div
              v-for="r in rewardsStore.redemptions"
              :key="r.id"
              class="card flex items-center gap-3 py-3"
            >
              <span class="text-2xl flex-shrink-0">{{ r.reward?.emoji ?? '🎁' }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-plum-700 text-sm truncate">
                  {{ locale === 'id' ? (r.reward?.name_id ?? '') : (r.reward?.name_en ?? '') }}
                </p>
                <p class="text-xs text-plum-700/50 mt-0.5">
                  {{ formatLongDate(new Date(r.redeemed_at), locale) }}
                </p>
              </div>
              <span class="text-xs font-bold text-yellow-500 flex-shrink-0">
                −⭐{{ r.stars_spent }}
              </span>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRewardsStore, type Reward } from '@/stores/rewards'
import { formatLongDate } from '@/lib/time'
import LangToggle from '@/components/LangToggle.vue'

const { t, locale } = useI18n()
const router = useRouter()
const rewardsStore = useRewardsStore()

const confirmingId = ref<string | null>(null)

function startRedeem(reward: Reward) {
  if (rewardsStore.starsBalance < reward.star_cost) return
  confirmingId.value = reward.id
}

async function doRedeem(reward: Reward) {
  await rewardsStore.redeem(reward.id)
  confirmingId.value = null
}

onMounted(() => rewardsStore.fetchAll())
</script>
