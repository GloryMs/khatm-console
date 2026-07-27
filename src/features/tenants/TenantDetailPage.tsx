import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { Toast } from '@/components/ui/Toast';
import { copyToClipboard } from '@/components/ui/clipboard';
import { useErrorMessage } from '@/api/useErrorMessage';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { RequireScope } from '@/features/auth/RequireScope';
import { buildTenantJwksUrl } from './jwks';
import { useActivateTenant, useSuspendTenant, useTenant } from './hooks';
import styles from './TenantDetailPage.module.css';

export function TenantDetailPage() {
  return (
    <RequireScope scope="admin">
      <TenantDetailPageBody />
    </RequireScope>
  );
}

function TenantDetailPageBody() {
  const { t, i18n } = useTranslation();
  const resolveError = useErrorMessage();
  const localize = useLocalizedText();
  const params = useParams<{ id: string }>();
  const tenant = useTenant(params.id);
  const suspend = useSuspendTenant();
  const activate = useActivateTenant();
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | null>(null);
  const [copied, setCopied] = useState(false);

  if (tenant.isPending) return <p>{t('common.loading')}</p>;
  if (tenant.isError) return <ApiErrorBanner error={tenant.error} />;
  if (!tenant.data) return null;

  const data = tenant.data;
  const id = data.id ?? '';
  const isActive = data.status === 'ACTIVE';
  const tone: StatusTone = isActive ? 'success' : 'warning';
  const createdAt = data.createdAt
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(data.createdAt),
      )
    : '';
  const jwksUrl = data.slug ? buildTenantJwksUrl(data.slug) : '';

  const onConfirm = async () => {
    if (confirmAction === 'suspend') {
      await suspend.mutateAsync(id);
    } else if (confirmAction === 'activate') {
      await activate.mutateAsync(id);
    }
    setConfirmAction(null);
  };

  const activeMutation = confirmAction === 'suspend' ? suspend : activate;

  return (
    <section className={styles.page}>
      <Link className={styles.back} to="/tenants">
        {t('tenants.detail.backToList')}
      </Link>

      <div className={styles.headRow}>
        <h1 className={styles.title}>{localize(data.nameI18n) || data.slug}</h1>
        <StatusBadge tone={tone}>
          {isActive ? t('tenants.statusActive') : t('tenants.statusSuspended')}
        </StatusBadge>
      </div>

      <div className={styles.fieldGrid}>
        <span className={styles.fieldLabel}>{t('tenants.columnSlug')}</span>
        <span className={`${styles.fieldValue} ltr-embed`}>{data.slug}</span>

        <span className={styles.fieldLabel}>{t('tenants.detail.nameEn')}</span>
        <span className={styles.fieldValue}>{data.nameI18n?.en}</span>

        <span className={styles.fieldLabel}>{t('tenants.detail.nameAr')}</span>
        <span className={styles.fieldValue}>{data.nameI18n?.ar}</span>

        <span className={styles.fieldLabel}>{t('tenants.columnType')}</span>
        <span className={styles.fieldValue}>{data.type ? t(`tenants.type.${data.type}`) : ''}</span>

        <span className={styles.fieldLabel}>{t('tenants.detail.deployMode')}</span>
        <span className={styles.fieldValue}>
          {data.deployMode ? t(`tenants.deployMode.${data.deployMode}`) : ''}
        </span>

        <span className={styles.fieldLabel}>{t('tenants.columnCreatedAt')}</span>
        <span className={styles.fieldValue}>{createdAt}</span>
      </div>

      <div className={styles.jwksCard}>
        <h2 className={styles.fieldLabel}>{t('tenants.detail.jwksTitle')}</h2>
        <p>{t('tenants.detail.jwksHelp')}</p>
        <div className={styles.jwksRow}>
          <a
            className={`${styles.jwksLink} ltr-embed`}
            href={jwksUrl}
            target="_blank"
            rel="noreferrer"
          >
            {jwksUrl}
          </a>
          <Button
            variant="secondary"
            onClick={() => {
              void copyToClipboard(jwksUrl);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            }}
          >
            {t('common.copy')}
          </Button>
        </div>
        {copied && <Toast tone="success">{t('common.copied')}</Toast>}
      </div>

      <div className={styles.actionsRow}>
        {isActive ? (
          <Button variant="secondary" onClick={() => setConfirmAction('suspend')}>
            {t('tenants.detail.actionSuspend')}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setConfirmAction('activate')}>
            {t('tenants.detail.actionActivate')}
          </Button>
        )}
      </div>

      {confirmAction && (
        <ConfirmDialog
          titleId="tenant-status-confirm-title"
          title={
            confirmAction === 'suspend'
              ? t('tenants.suspendConfirm.title')
              : t('tenants.activateConfirm.title')
          }
          body={
            confirmAction === 'suspend'
              ? t('tenants.suspendConfirm.body')
              : t('tenants.activateConfirm.body')
          }
          confirmLabel={
            activeMutation.isPending
              ? confirmAction === 'suspend'
                ? t('tenants.suspendConfirm.suspending')
                : t('tenants.activateConfirm.activating')
              : confirmAction === 'suspend'
                ? t('tenants.suspendConfirm.confirm')
                : t('tenants.activateConfirm.confirm')
          }
          cancelLabel={
            confirmAction === 'suspend'
              ? t('tenants.suspendConfirm.cancel')
              : t('tenants.activateConfirm.cancel')
          }
          isBusy={activeMutation.isPending}
          errorMessage={activeMutation.isError ? resolveError(activeMutation.error) : undefined}
          onConfirm={onConfirm}
          onCancel={() => {
            setConfirmAction(null);
            suspend.reset();
            activate.reset();
          }}
        />
      )}
    </section>
  );
}
