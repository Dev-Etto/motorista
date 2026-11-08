import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BACKUP_REMINDER_DAYS } from '@config/app';
import { isBackupDue } from '@domain/maintenance/notices';
import { TipBanner } from '@features/tips';
import { useFormat } from '@shared/i18n/format';
import { radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon } from '@shared/ui/AppIcon';
import { confirmAction } from '@shared/ui/dialog';
import { AppText, Button, Card, ListRow, Notice, Screen } from '@shared/ui/primitives';
import { isoFromMillis } from '@shared/utils/dates';
import { useBackup } from './useBackup';

export default function BackupScreen() {
  const { t } = useTranslation('settings');
  const format = useFormat();
  const backup = useBackup();
  const colors = useTheme();
  const lastAt = backup.lastBackupAt ? Number(backup.lastBackupAt) : null;
  const upToDate = lastAt !== null && !isBackupDue(String(lastAt), true, backup.loadedAt, BACKUP_REMINDER_DAYS);
  const lastLabel = backup.lastBackupAt ? format.date(isoFromMillis(Number(backup.lastBackupAt))) : t('backup.never');

  const confirmUndo = () => {
    confirmAction({
      title: t('backup.undoConfirm.title'),
      message: t('backup.undoConfirm.message'),
      actionLabel: t('backup.undoConfirm.action'),
      onConfirm: backup.undoRestore,
    });
  };

  return (
    <Screen>
      <TipBanner id="backup" message={t('backup.tip')} />
      <Card>
        <View style={styles.status}>
          <View style={[styles.statusIcon, { backgroundColor: colors.surfaceAlt }]}>
            <AppIcon name={upToDate ? 'check' : 'alert'} color={upToDate ? colors.positive : colors.warning} size={24} />
          </View>
          <View style={styles.flex}>
            <AppText bold accessibilityRole="header">
              {upToDate ? t('backup.protected') : t('backup.attention')}
            </AppText>
            <AppText variant="caption" tone="muted">
              {t('backup.lastLine', { date: lastLabel })}
            </AppText>
          </View>
        </View>
      </Card>
      <Button label={t('backup.exportButton')} busy={backup.busy} onPress={backup.exportBackup} />
      <Card title={t('backup.othersTitle')}>
        <ListRow icon="backup" title={t('backup.restoreButton')} chevron onPress={backup.importBackup} />
        {backup.canUndo ? <ListRow icon="update" title={t('backup.undoButton')} chevron onPress={confirmUndo} /> : null}
      </Card>
      <AppText variant="caption" tone="muted">
        {t('backup.intro')}
      </AppText>
      {backup.message ? <Notice tone={backup.message.tone} message={backup.message.text} /> : null}
    </Screen>
  );
}

const ICON_SIZE = 48;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
