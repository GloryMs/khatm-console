import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { t } = useTranslation();
  return (
    <nav className={styles.sidebar} aria-label={t('shell.sidebarLabel')}>
      <div className={styles.brand}>{t('app.brand')}</div>
      <NavLink
        to="/issue"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.issue')}
      </NavLink>
      <NavLink
        to="/schemas"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.schemas')}
      </NavLink>
      <NavLink
        to="/verify"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.verify')}
      </NavLink>
      <NavLink
        to="/revoke"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.revoke')}
      </NavLink>
    </nav>
  );
}
