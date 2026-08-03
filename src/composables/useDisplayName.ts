import { useI18n } from 'vue-i18n'

/**
 * Returns a `pick(nameId, nameEn)` helper that selects the right language
 * field based on the current i18n locale. Reactive: re-evaluates when the
 * locale changes (locale.value is read at call time inside template rendering
 * or computed functions, so Vue tracks it automatically).
 */
export function useDisplayName() {
  const { locale } = useI18n()

  function pick(nameId: string, nameEn: string): string {
    return locale.value === 'en' ? nameEn : nameId
  }

  return { pick }
}
