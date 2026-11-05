import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { createBackup, parseBackup, restoreBackup } from '@/data/backup/backup';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { today } from '@/shared/utils/dates';
import { shareTextFile } from '@/shared/utils/share';

const SAFETY_COPY_NAME = 'antes-de-restaurar.json';

function writeSafetyCopy(content: string) {
  const file = new File(Paths.document, SAFETY_COPY_NAME);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
}

export function useBackup() {
  const [message, setMessage] = useState<{ tone: 'positive' | 'negative'; text: string } | null>(null);
  const lastBackup = useAsyncData(() => settingsRepository.get(SETTING_KEYS.lastBackupAt));

  const exportBackup = async () => {
    try {
      const backup = await createBackup();
      await shareTextFile(`backup-${today()}.json`, JSON.stringify(backup), 'application/json');
      await settingsRepository.set(SETTING_KEYS.lastBackupAt, String(Date.now()));
      await lastBackup.reload();
      setMessage({ tone: 'positive', text: 'Backup gerado. Guarde o arquivo em um lugar seguro.' });
    } catch {
      setMessage({ tone: 'negative', text: 'Não foi possível gerar o backup.' });
    }
  };

  const importBackup = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (picked.canceled) return;

    try {
      const parsed = parseBackup(new File(picked.assets[0].uri).textSync());
      if (!parsed.ok) return setMessage({ tone: 'negative', text: parsed.error });

      writeSafetyCopy(JSON.stringify(await createBackup()));
      await restoreBackup(parsed.backup);
      await settingsRepository.set(SETTING_KEYS.onboarded, '1');
      setMessage({ tone: 'positive', text: 'Dados restaurados com sucesso.' });
    } catch {
      setMessage({ tone: 'negative', text: 'A restauração falhou e seus dados atuais foram mantidos.' });
    }
  };

  return { message, lastBackupAt: lastBackup.data, exportBackup, importBackup };
}
