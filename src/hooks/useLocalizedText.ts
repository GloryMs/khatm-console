import { useTranslation } from 'react-i18next';

export interface LocalizedText {
  en?: string;
  ar?: string;
}

/**
 * Resolves a bilingual `{en, ar}` field (as returned by the API for every
 * `*_i18n` property) to the string for the active UI language, falling back
 * to `en` and then to an empty string.
 */
export function useLocalizedText(): (text: LocalizedText | undefined) => string {
  const { i18n } = useTranslation();

  return (text) => {
    if (!text) return '';
    const lang = i18n.language === 'ar' ? 'ar' : 'en';
    return text[lang] ?? text.en ?? '';
  };
}
