import { StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '@/shared/theme/theme';
import { AppIcon, AppIconName } from '@/shared/ui/AppIcon';
import { LearnMore } from '@/shared/ui/LearnMore';
import { AppText, Button, Card } from '@/shared/ui/primitives';
import { usePermissions } from './usePermissions';

interface PermissionRowProps {
  icon: AppIconName;
  title: string;
  description: string;
  granted: boolean;
  onAllow: () => void;
}

function PermissionRow({ icon, title, description, granted, onAllow }: PermissionRowProps) {
  const colors = useTheme();

  return (
    <View style={styles.row}>
      <AppIcon name={granted ? 'check' : icon} color={granted ? colors.positive : colors.primary} size={28} />
      <View style={styles.content}>
        <AppText bold>{title}</AppText>
        <AppText variant="caption" tone="muted">
          {description}
        </AppText>
        {granted ? (
          <AppText variant="caption" tone="positive" bold>
            Permitido
          </AppText>
        ) : (
          <Button label="Permitir" variant="secondary" onPress={onAllow} />
        )}
      </View>
    </View>
  );
}

export function PermissionsList() {
  const permissions = usePermissions();
  const { state } = permissions;

  return (
    <Card>
      <PermissionRow
        icon="copilot"
        title="Ler as ofertas"
        description="Para avaliar as ofertas da Uber, da 99 e da inDrive. O Android chama isso de acessibilidade."
        granted={state.accessibility}
        onAllow={permissions.openAccessibility}
      />
      {state.accessibility ? null : (
        <LearnMore title="Como ativar a leitura">
          <AppText variant="caption">1. Procure Copiloto de ofertas e ligue a primeira opção. Deixe o atalho desligado.</AppText>
          <AppText variant="caption">
            2. O Android avisa sobre controle total. É o aviso padrão dessa permissão: o app lê a tela e não toca em nada por você.
          </AppText>
          <AppText variant="caption">
            3. Se a opção estiver bloqueada, abra os detalhes do app, toque nos três pontos e permita as configurações restritas.
          </AppText>
          <Button label="Abrir detalhes do app" variant="secondary" onPress={permissions.openAppSettings} />
        </LearnMore>
      )}
      <PermissionRow
        icon="layers"
        title="Mostrar sobre outros apps"
        description="Para o cronômetro aparecer enquanto você usa a Uber ou a 99."
        granted={state.overlay}
        onAllow={permissions.openOverlay}
      />
      <PermissionRow
        icon="location"
        title="Localização"
        description="Para medir os km da jornada por GPS. Escolha permitir durante o uso do app."
        granted={state.location}
        onAllow={permissions.requestLocation}
      />
      <PermissionRow
        icon="bell"
        title="Notificações"
        description="Para lembretes de manutenção e para consultar as ofertas depois."
        granted={state.notifications}
        onAllow={permissions.requestNotifications}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  content: { flex: 1, gap: spacing.xs },
});
