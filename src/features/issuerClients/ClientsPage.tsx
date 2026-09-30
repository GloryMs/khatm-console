import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TypeToConfirmDialog } from '@/components/ui/TypeToConfirmDialog';
import { useErrorMessage } from '@/api/useErrorMessage';
import { RequireScope } from '@/features/auth/RequireScope';
import { useSchemas } from '@/features/schemas/hooks';
import { ClientList } from './components/ClientList';
import { CreateClientDialog, type CreateClientSubmitValues } from './components/CreateClientDialog';
import { RevealSecretsDialog } from './components/RevealSecretsDialog';
import { RotateDialog } from './components/RotateDialog';
import {
  useCreateIssuerClient,
  useIssuerClients,
  useResumeIssuerClient,
  useRevokeIssuerClient,
  useRotateIssuerClient,
  useSuspendIssuerClient,
} from './hooks';
import type { IssuerClientResponse } from './api';
import styles from './ClientsPage.module.css';

interface RevealState {
  keyPrefix: string;
  apiKey: string;
  holderHmacSecret?: string;
  retiringClientId?: string;
}

export function ClientsPage() {
  return (
    <RequireScope scope="key:manage">
      <ClientsPageBody />
    </RequireScope>
  );
}

/**
 * Issuer-client management for the caller's own tenant (spec FS-2.7a D10):
 * create, rotate (with a retire grace window), suspend/resume, and revoke.
 * A freshly created or rotated client's key (and, on the tenant's first
 * client, its holder HMAC secret) is held only in `revealState` — local
 * component state, never the query cache — until the operator explicitly
 * closes {@link RevealSecretsDialog}.
 */
function ClientsPageBody() {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const clients = useIssuerClients(true);
  const schemas = useSchemas();

  const createClient = useCreateIssuerClient();
  const rotateClient = useRotateIssuerClient();
  const suspendClient = useSuspendIssuerClient();
  const resumeClient = useResumeIssuerClient();
  const revokeClient = useRevokeIssuerClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<IssuerClientResponse | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<IssuerClientResponse | null>(null);
  const [resumeTarget, setResumeTarget] = useState<IssuerClientResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<IssuerClientResponse | null>(null);
  const [revealState, setRevealState] = useState<RevealState | null>(null);

  const onCreateSubmit = async (values: CreateClientSubmitValues) => {
    try {
      const result = await createClient.mutateAsync({
        name: { en: values.nameEn, ar: values.nameAr },
        allowedSchemaIds: values.allowedSchemaIds,
        ...(values.expiresAt ? { expiresAt: values.expiresAt } : {}),
      });
      setCreateOpen(false);
      createClient.reset();
      setRevealState({
        keyPrefix: result.keyPrefix ?? '',
        apiKey: result.apiKey ?? '',
        holderHmacSecret: result.holderHmacSecret,
      });
    } catch {
      // surfaced via createClient.isError/error in CreateClientDialog
    }
  };

  const onConfirmRotate = async (retireAfterHours: number) => {
    if (!rotateTarget?.id) return;
    try {
      const result = await rotateClient.mutateAsync({
        id: rotateTarget.id,
        req: { retireAfterHours },
      });
      const retiringId = rotateTarget.id;
      setRotateTarget(null);
      rotateClient.reset();
      setRevealState({
        keyPrefix: result.keyPrefix ?? '',
        apiKey: result.apiKey ?? '',
        holderHmacSecret: result.holderHmacSecret,
        retiringClientId: retiringId,
      });
    } catch {
      // surfaced via rotateClient.isError/error in RotateDialog
    }
  };

  const onConfirmSuspend = async () => {
    if (!suspendTarget?.id) return;
    try {
      await suspendClient.mutateAsync(suspendTarget.id);
      setSuspendTarget(null);
      suspendClient.reset();
    } catch {
      // surfaced via suspendClient.isError/error in the confirm dialog
    }
  };

  const onConfirmResume = async () => {
    if (!resumeTarget?.id) return;
    try {
      await resumeClient.mutateAsync(resumeTarget.id);
      setResumeTarget(null);
      resumeClient.reset();
    } catch {
      // surfaced via resumeClient.isError/error in the confirm dialog
    }
  };

  const onConfirmRevoke = async () => {
    if (!revokeTarget?.id) return;
    try {
      await revokeClient.mutateAsync(revokeTarget.id);
      setRevokeTarget(null);
      revokeClient.reset();
    } catch {
      // surfaced via revokeClient.isError/error in TypeToConfirmDialog
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.headRow}>
        <div>
          <h1 className={styles.title}>{t('clients.title')}</h1>
          <p className={styles.intro}>{t('clients.intro')}</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setCreateOpen(true)}>
          {t('clients.createCta')}
        </Button>
      </div>

      {clients.isPending && <p>{t('common.loading')}</p>}
      {clients.isError && <ApiErrorBanner error={clients.error} />}
      {clients.isSuccess && (
        <ClientList
          clients={clients.data}
          schemas={schemas.data ?? []}
          onRotate={setRotateTarget}
          onSuspend={setSuspendTarget}
          onResume={setResumeTarget}
          onRevoke={setRevokeTarget}
        />
      )}

      {createOpen && (
        <CreateClientDialog
          schemas={schemas.data ?? []}
          isSubmitting={createClient.isPending}
          error={createClient.isError ? createClient.error : undefined}
          onSubmit={onCreateSubmit}
          onCancel={() => {
            setCreateOpen(false);
            createClient.reset();
          }}
        />
      )}

      {rotateTarget?.id && (
        <RotateDialog
          keyPrefix={rotateTarget.keyPrefix ?? ''}
          isBusy={rotateClient.isPending}
          error={rotateClient.isError ? rotateClient.error : undefined}
          onConfirm={onConfirmRotate}
          onCancel={() => {
            setRotateTarget(null);
            rotateClient.reset();
          }}
        />
      )}

      {suspendTarget && (
        <ConfirmDialog
          titleId="suspend-client-confirm-title"
          title={t('clients.suspendConfirm.title')}
          body={t('clients.suspendConfirm.body')}
          confirmLabel={
            suspendClient.isPending
              ? t('clients.suspendConfirm.suspending')
              : t('clients.suspendConfirm.confirm')
          }
          cancelLabel={t('clients.suspendConfirm.cancel')}
          isBusy={suspendClient.isPending}
          errorMessage={suspendClient.isError ? resolveError(suspendClient.error) : undefined}
          onConfirm={onConfirmSuspend}
          onCancel={() => {
            setSuspendTarget(null);
            suspendClient.reset();
          }}
        />
      )}

      {resumeTarget && (
        <ConfirmDialog
          titleId="resume-client-confirm-title"
          title={t('clients.resumeConfirm.title')}
          body={t('clients.resumeConfirm.body')}
          confirmLabel={
            resumeClient.isPending
              ? t('clients.resumeConfirm.resuming')
              : t('clients.resumeConfirm.confirm')
          }
          cancelLabel={t('clients.resumeConfirm.cancel')}
          isBusy={resumeClient.isPending}
          errorMessage={resumeClient.isError ? resolveError(resumeClient.error) : undefined}
          onConfirm={onConfirmResume}
          onCancel={() => {
            setResumeTarget(null);
            resumeClient.reset();
          }}
        />
      )}

      {revokeTarget?.id && (
        <TypeToConfirmDialog
          titleId="revoke-client-confirm-title"
          title={t('clients.revokeConfirm.title')}
          body={t('clients.revokeConfirm.body')}
          expectedText={revokeTarget.keyPrefix ?? ''}
          typePromptLabel={t('clients.revokeConfirm.typePrompt')}
          mismatchLabel={t('clients.revokeConfirm.mismatch')}
          confirmLabel={t('clients.revokeConfirm.confirm')}
          busyLabel={t('clients.revokeConfirm.revoking')}
          cancelLabel={t('clients.revokeConfirm.cancel')}
          isBusy={revokeClient.isPending}
          onConfirm={onConfirmRevoke}
          onCancel={() => {
            setRevokeTarget(null);
            revokeClient.reset();
          }}
        >
          {revokeClient.isError && <ApiErrorBanner error={revokeClient.error} />}
        </TypeToConfirmDialog>
      )}

      {revealState && (
        <RevealSecretsDialog
          keyPrefix={revealState.keyPrefix}
          apiKey={revealState.apiKey}
          holderHmacSecret={revealState.holderHmacSecret}
          retiringClientId={revealState.retiringClientId}
          onClose={() => setRevealState(null)}
        />
      )}
    </section>
  );
}
