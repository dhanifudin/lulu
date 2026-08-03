import { createI18n } from 'vue-i18n'
import id from './locales/id'
import en from './locales/en'

const saved = typeof localStorage !== 'undefined'
  ? localStorage.getItem('lulu-lang') ?? 'id'
  : 'id'

export const i18n = createI18n({
  legacy: false,         // Composition API mode
  locale: saved,
  fallbackLocale: 'id',
  messages: { id, en },
})

/** Switch the app language, persist to localStorage, and update <html lang>. */
export function setLocale(lang: 'id' | 'en') {
  // In legacy:false mode, global.locale is a WritableComputedRef
  ;(i18n.global.locale as unknown as { value: string }).value = lang
  localStorage.setItem('lulu-lang', lang)
  document.documentElement.lang = lang
}
