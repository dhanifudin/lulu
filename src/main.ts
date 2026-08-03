import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import { useAuthStore } from './stores/auth'
import { i18n } from './i18n'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)

// Resolve auth BEFORE the first navigation so the router guard
// can redirect unauthenticated users to /login immediately.
const auth = useAuthStore()
auth.init().then(() => app.mount('#app'))
