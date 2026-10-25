import { Alert } from 'react-native';
import { Button, Card, ListRow, Notice, Screen } from '@/shared/ui/primitives';
import { formatDate, toISODate } from '@/shared/utils/dates';
import { useBackup } from './useBackup';

export default function BackupScreen() {
  const backup = useBackup();
  const lastLabel = backup.lastBackupAt ? formatDate(toISODate(new Date(Number(backup.lastBackupAt)))) : 'Nunca';

  const confirmRestore = () => {
    Alert.alert('Restaurar backup?', 'Os dados atuais serão substituídos pelos do arquivo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restaurar', style: 'destructive', onPress: backup.importBackup },
    ]);
  };

  return (
    <Screen>
      <Notice message="Desinstalar o app apaga seus dados. O arquivo de backup contém dados financeiros: guarde-o com cuidado." />
      <Card title="Backup">
        <ListRow title="Último backup" value={lastLabel} />
        <Button label="Fazer backup" onPress={backup.exportBackup} />
        <Button label="Restaurar de um arquivo" variant="secondary" onPress={confirmRestore} />
      </Card>
      {backup.message ? <Notice tone={backup.message.tone} message={backup.message.text} /> : null}
    </Screen>
  );
}
