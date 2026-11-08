import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Button, Card, Notice, PillButton } from '@shared/ui/primitives';
import { usePermissions } from './usePermissions';

interface PermissionRowProps {
  title: string;
  description: string;
  granted: boolean;
  actionLabel: string;
  onAllow: () => void;
}

function PermissionRow({ title, description, granted, actionLabel, onAllow }: PermissionRowProps) {
  const { t } = useTranslation('permissions');

  return (
    <View style={styles.row}>
      <View style={styles.content}>
        <AppText bold>{title}</AppText>
        <AppText variant="caption" tone="muted">
          {description}
        </AppText>
      </View>
      {granted ? (
        <AppText variant="caption" tone="positive" bold>
          {t('granted')}
        </AppText>
      ) : (
        <PillButton label={actionLabel} accessibilityLabel={`${actionLabel}: ${title}`} onPress={onAllow} />
      )}
    </View>
  );
}

export function PermissionsList() {
  const { t } = useTranslation('permissions');
  const format = useFormat();
  const permissions = usePermissions();
  const { state } = permissions;

  return (
    <>
      <Card>
        <PermissionRow
          title={t('accessibility.title')}
          description={t('accessibility.description')}
          granted={state.accessibility}
          actionLabel={t('allow')}
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
          title={t('overlay.title')}
          description={t('overlay.description')}
          granted={state.overlay}
          actionLabel={t('allow')}
          onAllow={permissions.openOverlay}
        />
        <PermissionRow
          title={t('location.title')}
          description={t('location.description', { context: format.distanceUnit })}
          granted={state.location}
          actionLabel={t('allow')}
          onAllow={permissions.requestLocation}
        />
        <PermissionRow
          title={t('notifications.title')}
          description={t('notifications.description')}
          granted={state.notifications}
          actionLabel={t('allow')}
          onAllow={permissions.requestNotifications}
        />
        <PermissionRow
          title={t('battery.title')}
          description={t('battery.description')}
          granted={state.battery}
          actionLabel={t('adjust')}
          onAllow={permissions.openBattery}
        />
      </Card>
      {state.notifications ? null : <Notice message={t('notifications.missing')} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64 },
  content: { flex: 1, gap: 2 },
});
