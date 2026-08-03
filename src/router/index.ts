import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// HTML5 history mode (clean URLs). GitHub Pages deep-link fallback is handled
// by a dist/404.html generated at build time (see vite.config.ts), and by the
// Workbox navigateFallback once the service worker is active.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/schedule',
      name: 'schedule',
      component: () => import('@/pages/SchedulePage.vue'),
    },
    {
      path: '/habits',
      name: 'habits',
      component: () => import('@/pages/HabitsPage.vue'),
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/pages/CalendarPage.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue'),
    },
    {
      path: '/rewards',
      name: 'rewards',
      component: () => import('@/pages/RewardsPage.vue'),
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
