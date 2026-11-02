import { AppText, Screen } from '@/shared/ui/primitives';
import { PermissionsList } from './PermissionsList';

export default function PermissionsScreen() {
  return (
    <Screen>
      <AppText tone="muted">Tudo é processado no seu celular. Nada é enviado para fora.</AppText>
      <PermissionsList />
    </Screen>
  );
}
