import { useTranslation } from 'react-i18next';
import { TipBanner } from '@features/tips';
import { useFormat } from '@shared/i18n/format';
import { confirmAction } from '@shared/ui/dialog';
import { Button, Card, ListRow, Notice, Screen } from '@shared/ui/primitives';
import { isoFromMillis } from '@shared/utils/dates';
import { useBackup } from './useBackup';

export default function BackupScreen() {
  const { t } = useTranslation('settings');
  const format = useFormat();
  const backup = useBackup();
  const lastLabel = backup.lastBackupAt ? format.date(isoFromMillis(Number(backup.lastBackupAt))) : t('backup.never');

  const confirmRestore = () => {
    confirmAction({
      title: t('backup.restoreConfirm.title'),
      message: t('backup.restoreConfirm.message'),
      actionLabel: t('backup.restoreConfirm.action'),
      onConfirm: backup.importBackup,
    });
  };

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
      <Notice tone="accent" message={t('backup.intro')} />
      <Card title={t('backup.cardTitle')}>
        <ListRow title={t('backup.lastBackup')} value={lastLabel} />
        <Button label={t('backup.exportButton')} busy={backup.busy} onPress={backup.exportBackup} />
        <Button label={t('backup.restoreButton')} variant="secondary" onPress={confirmRestore} />
        {backup.canUndo ? <Button label={t('backup.undoButton')} variant="secondary" onPress={confirmUndo} /> : null}
      </Card>
      {backup.message ? <Notice tone={backup.message.tone} message={backup.message.text} /> : null}
    </Screen>
  );
}
