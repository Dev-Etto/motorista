import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { spacing, useTheme } from '@shared/theme/theme';
import { AppIcon, AppIconName } from '@shared/ui/AppIcon';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Button, Card } from '@shared/ui/primitives';
import { usePermissions } from './usePermissions';

interface PermissionRowProps {
  icon: AppIconName;
  title: string;
  description: string;
  granted: boolean;
  onAllow: () => void;
}

function PermissionRow({ icon, title, description, granted, onAllow }: PermissionRowProps) {
  const { t } = useTranslation('permissions');
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
            {t('granted')}
          </AppText>
        ) : (
          <Button label={t('allow')} variant="secondary" onPress={onAllow} />
        )}
      </View>
    </View>
  );
}

export function PermissionsList() {
  const { t } = useTranslation('permissions');
  const format = useFormat();
  const permissions = usePermissions();
  const { state } = permissions;

  return (
    <Card>
      <PermissionRow
        icon="copilot"
        title={t('accessibility.title')}
        description={t('accessibility.description')}
        granted={state.accessibility}
        onAllow={permissions.openAccessibility}
      />
      {state.accessibility ? null : (
        <LearnMore title={t('accessibility.howTo.title')}>
          <AppText variant="caption">{t('accessibility.howTo.step1')}</AppText>
          <AppText variant="caption">{t('accessibility.howTo.step2')}</AppText>
          <AppText variant="caption">{t('accessibility.howTo.step3')}</AppText>
          <Button label={t('accessibility.howTo.openAppSettings')} variant="secondary" onPress={permissions.openAppSettings} />
        </LearnMore>
      )}
      <PermissionRow
        icon="layers"
        title={t('overlay.title')}
        description={t('overlay.description')}
        granted={state.overlay}
        onAllow={permissions.openOverlay}
      />
      <PermissionRow
        icon="location"
        title={t('location.title')}
        description={t('location.description', { context: format.distanceUnit })}
        granted={state.location}
        onAllow={permissions.requestLocation}
      />
      <PermissionRow
        icon="bell"
        title={t('notifications.title')}
        description={t('notifications.description')}
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
