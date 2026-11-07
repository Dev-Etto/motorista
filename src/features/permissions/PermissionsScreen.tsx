import { useTranslation } from 'react-i18next';
import { AppText, Screen } from '@shared/ui/primitives';
import { PermissionsList } from './PermissionsList';

export default function PermissionsScreen() {
  const { t } = useTranslation('permissions');

  return (
    <Screen>
      <AppText tone="muted">{t('intro')}</AppText>
      <PermissionsList />
    </Screen>
  );
}
