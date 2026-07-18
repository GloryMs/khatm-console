import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '@/i18n';
import styles from './LanguageSwitcher.module.css';

const LANGUAGES: { code: SupportedLanguage; labelKey: string }[] = [
  { code: 'en', labelKey: 'language.english' },
  { code: 'ar', labelKey: 'language.arabic' },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <div className={styles.switcher} role="group" aria-label={t('language.switcherLabel')}>
      {LANGUAGES.map(({ code, labelKey }) => (
        <button
          key={code}
          type="button"
          className={i18n.language === code ? styles.active : styles.option}
          aria-pressed={i18n.language === code}
          onClick={() => void i18n.changeLanguage(code)}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
