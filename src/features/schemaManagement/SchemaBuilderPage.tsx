import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { RequireScope } from '@/features/auth/RequireScope';
import type { SchemaAuthoringRequest, SchemaCreateRequest } from '@/features/schemas/api';
import { deriveSdFields, emptyRow, fromSchemaDetail, toClaimsDef } from './claimsBuilder';
import { daysHoursToIsoDuration, parseIsoDurationToDaysHours } from './duration';
import {
  SchemaBuilderForm,
  type SchemaBuilderFormValues,
  type SchemaBuilderMode,
} from './components/SchemaBuilderForm';
import {
  useCreateSchema,
  useCreateSchemaVersion,
  useManagedSchema,
  useUpdateSchema,
} from './hooks';
import styles from './SchemaBuilderPage.module.css';

interface SchemaBuilderPageProps {
  mode: SchemaBuilderMode;
}

const TITLE_KEY: Record<SchemaBuilderMode, string> = {
  create: 'schemaManagement.builder.createTitle',
  edit: 'schemaManagement.builder.editTitle',
  version: 'schemaManagement.builder.versionTitle',
};

function blankFormValues(): SchemaBuilderFormValues {
  return {
    code: '',
    nameEn: '',
    nameAr: '',
    defaultMaxUses: '',
    defaultValidityDays: '',
    defaultValidityHours: '',
    rows: [emptyRow()],
  };
}

function buildAuthoringBody(values: SchemaBuilderFormValues): SchemaAuthoringRequest {
  const maxUses = values.defaultMaxUses.trim() ? Number(values.defaultMaxUses) : undefined;
  const defaultValidity = daysHoursToIsoDuration(
    Number(values.defaultValidityDays || 0),
    Number(values.defaultValidityHours || 0),
  );
  return {
    nameI18n: { en: values.nameEn, ar: values.nameAr },
    defaultMaxUses: maxUses,
    defaultValidity,
    claimsDef: toClaimsDef(values.rows),
    sdFields: deriveSdFields(values.rows),
  };
}

export function SchemaBuilderPage({ mode }: SchemaBuilderPageProps) {
  return (
    <RequireScope scope="admin">
      <SchemaBuilderPageBody mode={mode} />
    </RequireScope>
  );
}

function SchemaBuilderPageBody({ mode }: SchemaBuilderPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const sourceId = mode === 'create' ? null : (params.id ?? null);

  const detail = useManagedSchema(sourceId);
  const createSchema = useCreateSchema();
  const updateSchema = useUpdateSchema();
  const createVersion = useCreateSchemaVersion();
  const mutation =
    mode === 'create' ? createSchema : mode === 'edit' ? updateSchema : createVersion;

  const defaultValues = useMemo<SchemaBuilderFormValues>(() => {
    if (mode === 'create' || !detail.data) return blankFormValues();
    const { days, hours } = parseIsoDurationToDaysHours(detail.data.defaultValidity);
    return {
      code: detail.data.code ?? '',
      nameEn: detail.data.nameI18n?.en ?? '',
      nameAr: detail.data.nameI18n?.ar ?? '',
      defaultMaxUses:
        detail.data.defaultMaxUses === undefined ? '' : String(detail.data.defaultMaxUses),
      defaultValidityDays: days ? String(days) : '',
      defaultValidityHours: hours ? String(hours) : '',
      rows: fromSchemaDetail(detail.data),
    };
  }, [mode, detail.data]);

  const onSubmit = async (values: SchemaBuilderFormValues) => {
    const body = buildAuthoringBody(values);
    if (mode === 'create') {
      await createSchema.mutateAsync({ ...body, code: values.code } satisfies SchemaCreateRequest);
    } else if (mode === 'edit' && sourceId) {
      await updateSchema.mutateAsync({ id: sourceId, req: body });
    } else if (mode === 'version' && sourceId) {
      await createVersion.mutateAsync({ id: sourceId, req: body });
    } else {
      return;
    }
    navigate('/schemas/manage');
  };

  if (mode !== 'create' && detail.isPending) {
    return (
      <section className={styles.page}>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  if (mode !== 'create' && detail.isError) {
    return (
      <section className={styles.page}>
        <ApiErrorBanner error={detail.error} />
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t(TITLE_KEY[mode])}</h1>
      <SchemaBuilderForm
        key={sourceId ?? 'create'}
        mode={mode}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onCancel={() => navigate('/schemas/manage')}
        isSubmitting={mutation.isPending}
        error={mutation.error}
      />
    </section>
  );
}
