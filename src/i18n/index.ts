import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

export type SupportedLanguage = 'en' | 'ar';
const RTL_LANGUAGES: readonly SupportedLanguage[] = ['ar'];
const STORAGE_KEY = 'khatm-console:lang';

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === 'en' || value === 'ar';
}

function readStoredLanguage(): SupportedLanguage {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isSupportedLanguage(stored) ? stored : 'en';
}

function applyDocumentDirection(lang: SupportedLanguage): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
}

const initialLanguage = readStoredLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

applyDocumentDirection(initialLanguage);
document.title = i18n.t('app.title');

i18n.on('languageChanged', (lang) => {
  if (isSupportedLanguage(lang)) {
    window.localStorage.setItem(STORAGE_KEY, lang);
    applyDocumentDirection(lang);
    document.title = i18n.t('app.title');
  }
});

export default i18n;
