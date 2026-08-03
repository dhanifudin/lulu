import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser, AuthSession } from '@supabase/supabase-js'
import type { AuthChangeEvent } from '@supabase/auth-js'
import { supabase, ALLOWED_EMAILS } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const session = ref<AuthSession | null>(null)
  const loading = ref(true)
  const unauthorized = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email ?? '')
  const userName = computed(() => user.value?.user_metadata?.full_name ?? user.value?.email ?? '')
  const userAvatar = computed(() => user.value?.user_metadata?.avatar_url ?? '')

  async function init() {
    loading.value = true
    const { data } = await supabase.auth.getSession()
    await handleSession(data.session)

    supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, s: AuthSession | null) => {
      await handleSession(s)
    })
    loading.value = false
  }

  async function handleSession(s: AuthSession | null) {
    if (!s) {
      user.value = null
      session.value = null
      unauthorized.value = false
      return
    }
    const email = s.user.email ?? ''
    if (!ALLOWED_EMAILS.includes(email)) {
      // Sign out silently — RLS blocks data access anyway, but give clear UX
      await supabase.auth.signOut()
      user.value = null
      session.value = null
      unauthorized.value = true
      return
    }
    user.value = s.user
    session.value = s
    unauthorized.value = false
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, session, loading, unauthorized, isLoggedIn, userEmail, userName, userAvatar, init, signInWithGoogle, signOut }
})
