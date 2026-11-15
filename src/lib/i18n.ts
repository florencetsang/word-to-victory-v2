import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en'
import zhHant from '@/locales/zh-Hant'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-Hant', label: '繁體中文' },
] as const

export type Locale = (typeof LANGUAGES)[number]['code']

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, 'zh-Hant': { translation: zhHant } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-Hant'],
    nonExplicitSupportedLngs: false,
    load: 'currentOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'w2v.lang',
      convertDetectedLanguage: (lng: string) => (lng.toLowerCase().startsWith('zh') ? 'zh-Hant' : 'en'),
    },
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export default i18n
