import { useTranslation } from 'react-i18next';
import { SchemaList } from './components/SchemaList';
import styles from './SchemasPage.module.css';

export function SchemasPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('schemas.title')}</h1>
      <SchemaList />
    </section>
  );
}
