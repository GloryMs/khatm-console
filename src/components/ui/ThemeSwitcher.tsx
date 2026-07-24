import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type SupportedTheme, initialTheme, setTheme } from '@/theme';
import styles from './ThemeSwitcher.module.css';

const THEMES: { code: SupportedTheme; labelKey: string }[] = [
  { code: 'light', labelKey: 'theme.light' },
  { code: 'dark', labelKey: 'theme.dark' },
];

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const [theme, setActive] = useState<SupportedTheme>(initialTheme);

  return (
    <div className={styles.switcher} role="group" aria-label={t('theme.switcherLabel')}>
      {THEMES.map(({ code, labelKey }) => {
        const active = theme === code;
        return (
          <button
            key={code}
            type="button"
            className={active ? styles.active : styles.option}
            aria-pressed={active}
            onClick={() => {
              setTheme(code);
              setActive(code);
            }}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
