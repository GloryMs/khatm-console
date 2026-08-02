import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { TypeToConfirmDialog } from '@/components/ui/TypeToConfirmDialog';
import { useErrorMessage } from '@/api/useErrorMessage';
import { useAuth } from '@/features/auth/useAuth';
import { useRetireKey, useRotateKey, useSigningKeyStatuses } from '../hooks';
import type { SigningKeyView } from '../api';
import { PanelCard } from './PanelCard';
import { RetireKeyDialog } from './RetireKeyDialog';
import styles from './SigningKeysPanel.module.css';

const STATE_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  RETIRING: 'warning',
  PENDING: 'info',
  RETIRED: 'neutral',
};

const STATE_LABEL_KEY: Record<string, string> = {
  ACTIVE: 'dashboard.keys.states.active',
  RETIRING: 'dashboard.keys.states.retiring',
  PENDING: 'dashboard.keys.states.pending',
  RETIRED: 'dashboard.keys.states.retired',
};

/**
 * Every signing key's lifecycle status from `GET /api/v1/admin/signing-keys`
 * (KH-1.1.5-BE, `key:manage`-scoped) — real `state`/`validFrom`/`validTo`,
 * never the public JWK or any private material. Unlike the public
 * `/.well-known/jwks.json` this includes RETIRED keys.
 *
 * Also offers rotate (KH-2.3a-BE D2, spec FS-2.3 C8) — a hardened
 * type-to-confirm gate keyed off the current ACTIVE key's `kid` (the
 * contract exposes no tenant-slug field anywhere reachable from the
 * caller's own session, see `docs/STATE.md`, so this substitutes the one
 * real, visible identifier the operator is about to act on) — and retire
 * (D4), staged through {@link RetireKeyDialog} for the min-age guard.
 * No `provider` field exists in the contract yet (KH-2.3b-BE/Vault Transit
 * territory), so there's no provider column here yet.
 */
export function SigningKeysPanel() {
  const { t, i18n } = useTranslation();
  const { hasScope } = useAuth();
  const resolveError = useErrorMessage();
  const canViewKeys = hasScope('key:manage');
  const keys = useSigningKeyStatuses(canViewKeys);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  const rotateKey = useRotateKey();
  const retireKey = useRetireKey();

  const [rotateOpen, setRotateOpen] = useState(false);
  const [retireTarget, setRetireTarget] = useState<SigningKeyView | null>(null);

  const activeKid = keys.data?.keys?.find((k) => k.state === 'ACTIVE')?.kid;

  const closeRotate = () => {
    setRotateOpen(false);
    rotateKey.reset();
  };

  const onConfirmRotate = async () => {
    try {
      await rotateKey.mutateAsync();
      closeRotate();
    } catch {
      // surfaced via rotateKey.isError/error in TypeToConfirmDialog
    }
  };

  const closeRetire = () => {
    setRetireTarget(null);
    retireKey.reset();
  };

  const onConfirmRetire = async (force: boolean) => {
    if (!retireTarget?.kid) return;
    try {
      await retireKey.mutateAsync({ kid: retireTarget.kid, force });
      closeRetire();
    } catch {
      // surfaced via retireKey.isError/error in RetireKeyDialog
    }
  };

  return (
    <PanelCard
      title={t('dashboard.keys.title')}
      action={
        canViewKeys &&
        keys.isSuccess && (
          <Button
            variant="danger"
            type="button"
            disabled={!activeKid}
            title={activeKid ? undefined : t('dashboard.keys.rotate.noActiveKey')}
            onClick={() => setRotateOpen(true)}
          >
            {t('dashboard.keys.rotate.cta')}
          </Button>
        )
      }
    >
      {!canViewKeys && (
        <EmptyState
          title={t('dashboard.keys.adminOnlyTitle')}
          body={t('dashboard.keys.adminOnlyBody')}
        />
      )}
      {canViewKeys && keys.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {canViewKeys && keys.isError && <ApiErrorBanner error={keys.error} />}
      {canViewKeys && keys.isSuccess && (keys.data.keys?.length ?? 0) === 0 && (
        <EmptyState title={t('dashboard.keys.emptyTitle')} body={t('dashboard.keys.emptyBody')} />
      )}
      {canViewKeys && keys.isSuccess && (keys.data.keys?.length ?? 0) > 0 && (
        <ul className={styles.list}>
          {keys.data.keys?.map((key) => {
            const tone = STATE_TONE[key.state ?? ''] ?? 'neutral';
            const labelKey = STATE_LABEL_KEY[key.state ?? ''];
            return (
              <li key={key.kid} className={styles.row}>
                <div className={styles.head}>
                  <span className={`${styles.kid} ltr-embed`}>{key.kid}</span>
                  <StatusBadge tone={tone}>{labelKey ? t(labelKey) : key.state}</StatusBadge>
                </div>
                <div className={styles.meta}>
                  <span>
                    {t('dashboard.keys.validFrom')}{' '}
                    <span className="ltr-embed">
                      {key.validFrom ? dateFormat.format(new Date(key.validFrom)) : '—'}
                    </span>
                  </span>
                  <span>
                    {t('dashboard.keys.validTo')}{' '}
                    <span className="ltr-embed">
                      {key.validTo
                        ? dateFormat.format(new Date(key.validTo))
                        : t('dashboard.keys.noExpiry')}
                    </span>
                  </span>
                </div>
                {key.state === 'RETIRING' && key.kid && (
                  <div className={styles.rowActions}>
                    <Button variant="secondary" type="button" onClick={() => setRetireTarget(key)}>
                      {t('dashboard.keys.retireCta')}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {rotateOpen && activeKid && (
        <TypeToConfirmDialog
          titleId="rotate-key-confirm-title"
          title={t('dashboard.keys.rotate.title')}
          body={t('dashboard.keys.rotate.body')}
          expectedText={activeKid}
          typePromptLabel={t('dashboard.keys.rotate.typePrompt')}
          mismatchLabel={t('dashboard.keys.rotate.mismatch')}
          confirmLabel={t('dashboard.keys.rotate.confirm')}
          busyLabel={t('dashboard.keys.rotate.rotating')}
          cancelLabel={t('dashboard.keys.rotate.cancel')}
          isBusy={rotateKey.isPending}
          errorMessage={rotateKey.isError ? resolveError(rotateKey.error) : undefined}
          onConfirm={onConfirmRotate}
          onCancel={closeRotate}
        />
      )}

      {retireTarget?.kid && (
        <RetireKeyDialog
          kid={retireTarget.kid}
          isBusy={retireKey.isPending}
          error={retireKey.isError ? retireKey.error : undefined}
          onConfirm={onConfirmRetire}
          onCancel={closeRetire}
        />
      )}
    </PanelCard>
  );
}
