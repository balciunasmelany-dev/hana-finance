import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'
import en from './en.json'
import ko from './ko.json'

const savedLang = localStorage.getItem('hana_lang') ?? 'es'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      ko: { translation: ko },
    },
    lng: savedLang,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  })

export default i18n
