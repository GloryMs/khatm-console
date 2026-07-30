import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import styles from './Sidebar.module.css';

interface NavItemDef {
  to: string;
  labelKey: string;
  /** Plain Unicode glyph (mono) — no icon library, per the design guide. */
  icon: string;
  /** When set, the item renders only for operators with this scope. */
  scope?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: '▦' },
  { to: '/issue', labelKey: 'nav.issue', icon: '＋' },
  { to: '/issue/bulk', labelKey: 'nav.issueBulk', icon: '≡' },
  { to: '/schemas', labelKey: 'nav.schemas', icon: '▤' },
  { to: '/schemas/manage', labelKey: 'nav.schemaManage', icon: '✎', scope: 'schema:manage' },
  { to: '/credentials', labelKey: 'nav.credentials', icon: '◈' },
  { to: '/verify', labelKey: 'nav.verify', icon: '✓' },
  { to: '/revoke', labelKey: 'nav.revoke', icon: '⊘' },
  { to: '/consumers', labelKey: 'nav.consumingParties', icon: '⚑', scope: 'consumer:manage' },
  { to: '/consume-sim', labelKey: 'nav.consumeSim', icon: '▷' },
  { to: '/users', labelKey: 'nav.users', icon: '☺', scope: 'tenant:admin' },
  { to: '/tenants', labelKey: 'nav.tenants', icon: '⌂', scope: 'platform:admin' },
  { to: '/security', labelKey: 'nav.security', icon: '⚿' },
];

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : trimmed.slice(0, 2)).toUpperCase();
}

export function Sidebar() {
  const { t } = useTranslation();
  const { user, logout, hasScope } = useAuth();
  const localize = useLocalizedText();
  const userName = (user && (localize(user.displayNameI18n) || user.username)) ?? '';

  return (
    <aside className={styles.sidebar} aria-label={t('shell.sidebarLabel')}>
      <div className={styles.header}>
        <div className={styles.seal} aria-hidden="true">
          <span className={styles.sealRing} />
          <span className={styles.sealMark}>{t('app.brand')}</span>
        </div>
        <div className={styles.wordmark}>
          <span className={styles.brand}>{t('app.brand')}</span>
          <span className={styles.console}>{t('app.console')}</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.filter((item) => !item.scope || hasScope(item.scope)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            <span className={styles.icon} aria-hidden="true">
              {item.icon}
            </span>
            <span className={styles.label}>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className={styles.footer}>
          <span className={styles.avatar} aria-hidden="true">
            {initials(userName)}
          </span>
          <div className={styles.user}>
            <span className={styles.userName}>{userName}</span>
            <button type="button" className={styles.logout} onClick={() => void logout()}>
              {t('auth.logout')}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
