import { copilot } from '@modules/copilot';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { BackupFile, createBackup, parseBackup, restoreBackup } from '@/data/backup/backup';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { today } from '@/shared/utils/dates';
import { shareTextFile } from '@/shared/utils/share';
import { applyRestoredState } from './afterRestore';

const SAFETY_COPY_NAME = 'antes-de-restaurar.json';
const RESTORE_FAILED = 'A restauração falhou e seus dados atuais foram mantidos.';

const safetyCopy = () => new File(Paths.document, SAFETY_COPY_NAME);

function writeSafetyCopy(content: string) {
  const file = safetyCopy();
  if (file.exists) file.delete();
  file.create();
  file.write(content);
}

async function fullBackup(): Promise<BackupFile> {
  return { ...(await createBackup()), copilot: copilot.exportState() };
}

export function useBackup() {
  const [message, setMessage] = useState<{ tone: 'positive' | 'negative'; text: string } | null>(null);
  const [canUndo, setCanUndo] = useState(() => safetyCopy().exists === true);
  const lastBackup = useAsyncData(() => settingsRepository.get(SETTING_KEYS.lastBackupAt));

  const replaceData = async (backup: BackupFile, doneText: string) => {
    writeSafetyCopy(JSON.stringify(await fullBackup()));
    await restoreBackup(backup);
    await settingsRepository.set(SETTING_KEYS.onboarded, '1');
    setCanUndo(true);
    const complete = await applyRestoredState(backup).then(() => true, () => false);
    setMessage({ tone: 'positive', text: complete ? doneText : `${doneText} Confira os lembretes e o Copiloto.` });
  };

  const exportBackup = async () => {
    try {
      await shareTextFile(`backup-${today()}.json`, JSON.stringify(await fullBackup()), 'application/json');
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

      await replaceData(parsed.backup, 'Dados restaurados com sucesso.');
    } catch {
      setMessage({ tone: 'negative', text: RESTORE_FAILED });
    }
  };

  const undoRestore = async () => {
    try {
      const parsed = parseBackup(safetyCopy().textSync());
      if (!parsed.ok) return setMessage({ tone: 'negative', text: parsed.error });

      await replaceData(parsed.backup, 'Restauração desfeita. Seus dados anteriores voltaram.');
    } catch {
      setMessage({ tone: 'negative', text: RESTORE_FAILED });
    }
  };

  return { message, lastBackupAt: lastBackup.data, canUndo, exportBackup, importBackup, undoRestore };
}
