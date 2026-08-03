import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface Reward {
  id: string
  name_id: string
  name_en: string
  emoji: string
  star_cost: number
  active: boolean
  sort_order: number
}

export interface Redemption {
  id: string
  user_id: string
  reward_id: string
  stars_spent: number
  redeemed_at: string
  reward: Reward | null
}

export const useRewardsStore = defineStore('rewards', () => {
  const rewards = ref<Reward[]>([])
  const redemptions = ref<Redemption[]>([])
  const totalStarsEarned = ref(0)
  const loading = ref(false)

  const starsSpent = computed(() =>
    redemptions.value.reduce((s, r) => s + r.stars_spent, 0)
  )
  const starsBalance = computed(() => totalStarsEarned.value - starsSpent.value)

  async function fetchAll() {
    loading.value = true
    const [rewardsRes, redemptionsRes, countRes] = await Promise.all([
      supabase.from('rewards').select('*').eq('active', true).order('sort_order'),
      supabase
        .from('redemptions')
        .select('*, reward:rewards(*)')
        .order('redeemed_at', { ascending: false }),
      supabase
        .from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true),
    ])
    if (rewardsRes.data)     rewards.value = rewardsRes.data
    if (redemptionsRes.data) redemptions.value = redemptionsRes.data as Redemption[]
    totalStarsEarned.value = countRes.count ?? 0
    loading.value = false
  }

  async function redeem(rewardId: string): Promise<boolean> {
    const reward = rewards.value.find(r => r.id === rewardId)
    if (!reward || starsBalance.value < reward.star_cost) return false

    const { data } = await supabase
      .from('redemptions')
      .insert({ reward_id: rewardId, stars_spent: reward.star_cost })
      .select('*, reward:rewards(*)')
      .single()
    if (data) {
      redemptions.value.unshift(data as Redemption)
      return true
    }
    return false
  }

  return {
    rewards, redemptions, totalStarsEarned, starsBalance, starsSpent, loading,
    fetchAll, redeem,
  }
})
