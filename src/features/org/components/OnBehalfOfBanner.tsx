import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/ui/Banner';

/**
 * The always-visible "acting on behalf of {child}" indicator every org
 * child-scoped screen carries (spec FS-2.5 D2) — never dismissible.
 * Confusing parent and child context is called out in the spec as the
 * single most dangerous usage error on this surface, so this renders at
 * the top of every org child screen unconditionally, not just once.
 */
export function OnBehalfOfBanner({ childName }: { childName: string }) {
  const { t } = useTranslation();
  return (
    <Banner tone="info">
      <p>{t('org.child.onBehalfOfNotice', { child: childName })}</p>
    </Banner>
  );
}
