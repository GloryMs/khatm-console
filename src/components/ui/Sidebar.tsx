import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { t } = useTranslation();
  const { hasScope } = useAuth();
  return (
    <nav className={styles.sidebar} aria-label={t('shell.sidebarLabel')}>
      <div className={styles.brand}>{t('app.brand')}</div>
      <NavLink
        to="/dashboard"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.dashboard')}
      </NavLink>
      <NavLink
        to="/issue"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.issue')}
      </NavLink>
      <NavLink
        to="/issue/bulk"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.issueBulk')}
      </NavLink>
      <NavLink
        to="/schemas"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.schemas')}
      </NavLink>
      {hasScope('admin') && (
        <NavLink
          to="/schemas/manage"
          className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
        >
          {t('nav.schemaManage')}
        </NavLink>
      )}
      <NavLink
        to="/credentials"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.credentials')}
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
      {hasScope('admin') && (
        <NavLink
          to="/consumers"
          className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
        >
          {t('nav.consumingParties')}
        </NavLink>
      )}
      <NavLink
        to="/consume-sim"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {t('nav.consumeSim')}
      </NavLink>
    </nav>
  );
}
