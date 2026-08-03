import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Hash history avoids 404 on GitHub Pages (no server rewrites)
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'today',
      component: () => import('@/pages/TodayPage.vue'),
    },
    {
      path: '/jadwal',
      name: 'schedule',
      component: () => import('@/pages/SchedulePage.vue'),
    },
    {
      path: '/kebiasaan',
      name: 'habits',
      component: () => import('@/pages/HabitsPage.vue'),
    },
    {
      path: '/kalender',
      name: 'calendar',
      component: () => import('@/pages/CalendarPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Navigation guard — redirect to login unless authenticated.
// auth.init() is awaited in main.ts before mount, so loading is already
// false on the first navigation — no need to gate on auth.loading here.
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) {
    return { name: 'login' }
  }
  // Already logged in? Bounce off the login page back to today.
  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'today' }
  }
})

export default router
