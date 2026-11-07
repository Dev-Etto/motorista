import { Button, Card, ListRow, Notice, Screen } from '@/shared/ui/primitives';
import { TipBanner } from '@/features/tips';
import { confirmAction } from '@/shared/platform/confirm';
import { formatDate, toISODate } from '@/shared/utils/dates';
import { useBackup } from './useBackup';

export default function BackupScreen() {
  const backup = useBackup();
  const lastLabel = backup.lastBackupAt ? formatDate(toISODate(new Date(Number(backup.lastBackupAt)))) : 'Nunca';

  const confirmRestore = () => {
    confirmAction({
      title: 'Restaurar backup?',
      message: 'Os dados atuais serão substituídos pelos do arquivo.',
      actionLabel: 'Restaurar',
      onConfirm: backup.importBackup,
    });
  };

  const confirmUndo = () => {
    confirmAction({
      title: 'Desfazer a restauração?',
      message: 'Os dados voltam a ser os de antes da última restauração.',
      actionLabel: 'Desfazer',
      onConfirm: backup.undoRestore,
    });
  };

  return (
    <Screen>
      <TipBanner id="backup" message="Guarde o arquivo fora do celular, como no Drive ou em seu e-mail. Na troca de aparelho, use Restaurar." />
      <Notice tone="accent" message="Seus dados ficam só neste celular. Com um backup, você os leva para onde quiser, inclusive se trocar de aparelho ou reinstalar o app. O arquivo não tem senha: guarde em um lugar só seu." />
      <Card title="Backup">
        <ListRow title="Último backup" value={lastLabel} />
        <Button label="Fazer backup" busy={backup.busy} onPress={backup.exportBackup} />
        <Button label="Restaurar de um arquivo" variant="secondary" onPress={confirmRestore} />
        {backup.canUndo ? <Button label="Desfazer a última restauração" variant="secondary" onPress={confirmUndo} /> : null}
      </Card>
      {backup.message ? <Notice tone={backup.message.tone} message={backup.message.text} /> : null}
    </Screen>
  );
}
