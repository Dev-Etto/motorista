import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { regionalStore } from '@application/regional';
import { type BackupFile, backupMarket, createBackup, parseBackup, restoreBackup } from '@data/backup/backup';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { isSameMarket } from '@domain/regional/regional';
import { copilot } from '@modules/copilot';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { shareTextFile } from '@shared/platform/share';
import { confirmAction, showDialog } from '@shared/ui/dialog';
import { isoFromMillis, today } from '@shared/utils/dates';
import { reportError } from '@shared/utils/reportError';
import { applyRestoredState } from './afterRestore';

const SAFETY_COPY_NAME = 'antes-de-restaurar.json';

type ReplaceOutcome = 'restored' | 'undone';

const safetyCopy = () => new File(Paths.document, SAFETY_COPY_NAME);

function writeSafetyCopy(content: string) {
  const file = safetyCopy();
  if (file.exists) file.delete();
  file.create();
  file.write(content);
}

async function fullBackup(): Promise<BackupFile> {
  return { ...(await createBackup()), copilot: await copilot.exportState() };
}

export function useBackup() {
  const { t } = useTranslation(['settings', 'common']);
  const format = useFormat();
  const [message, setMessage] = useState<{ tone: 'positive' | 'negative'; text: string } | null>(null);
  const [canUndo, setCanUndo] = useState(() => safetyCopy().exists === true);
  const lastBackup = useAsyncData(async () => ({ at: await settingsRepository.get(SETTING_KEYS.lastBackupAt), checkedAt: Date.now() }));

  const replaceData = async (backup: BackupFile, outcome: ReplaceOutcome) => {
    writeSafetyCopy(JSON.stringify(await fullBackup()));
    await restoreBackup(backup);
    setCanUndo(true);
    const complete = await applyRestoredState(backup).then(
      () => true,
      () => false,
    );
    setMessage({ tone: 'positive', text: complete ? t(`backup.${outcome}`) : t(`backup.${outcome}Partial`) });
  };

  const markSaved = async () => {
    await settingsRepository.set(SETTING_KEYS.lastBackupAt, String(Date.now()));
    await lastBackup.reload();
    setMessage({ tone: 'positive', text: t('backup.exported') });
  };

  const askIfSaved = () => {
    showDialog({
      title: t('backup.savedQuestion.title'),
      message: t('backup.savedQuestion.message'),
      actions: [
        { label: t('backup.savedQuestion.no'), tone: 'secondary', onPress: () => setMessage({ tone: 'negative', text: t('backup.notSaved') }) },
        { label: t('backup.savedQuestion.yes'), tone: 'primary', onPress: markSaved },
      ],
    });
  };

  const exporting = useSubmit(async () => {
    try {
      await shareTextFile(`backup-${today()}.json`, JSON.stringify(await fullBackup()), 'application/json');
      askIfSaved();
    } catch (error) {
      reportError(error);
      setMessage({ tone: 'negative', text: t('backup.exportFailed') });
    }
  });

  const importing = useSubmit(async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      const [asset] = picked.assets ?? [];
      if (picked.canceled || !asset) return;

      const parsed = parseBackup(new File(asset.uri).textSync());
      if (!parsed.ok) return setMessage({ tone: 'negative', text: t(`backup.invalid.${parsed.error}`) });

      const market = backupMarket(parsed.backup);
      const otherMarket = market !== null && !isSameMarket(market, regionalStore.current().market);
      const { tables, exportedAt } = parsed.backup;
      const preview = t('backup.preview', {
        date: format.date(isoFromMillis(Date.parse(exportedAt))),
        shifts: tables.shifts.length,
        vehicles: tables.vehicles.length,
      });
      const warning = otherMarket ? t('backup.marketConfirm.message', { country: t(`common:marketName.${market}`) }) : t('backup.restoreConfirm.message');

      confirmAction({
        title: otherMarket ? t('backup.marketConfirm.title') : t('backup.restoreConfirm.title'),
        message: `${preview}\n\n${warning}`,
        actionLabel: otherMarket ? t('backup.marketConfirm.action') : t('backup.restoreConfirm.action'),
        onConfirm: () => replaceData(parsed.backup, 'restored').catch(() => setMessage({ tone: 'negative', text: t('backup.restoreFailed') })),
      });
    } catch (error) {
      reportError(error);
      setMessage({ tone: 'negative', text: t('backup.restoreFailed') });
    }
  });

  const undoing = useSubmit(async () => {
    try {
      const parsed = parseBackup(safetyCopy().textSync());
      if (!parsed.ok) return setMessage({ tone: 'negative', text: t(`backup.invalid.${parsed.error}`) });

      await replaceData(parsed.backup, 'undone');
    } catch (error) {
      reportError(error);
      setMessage({ tone: 'negative', text: t('backup.restoreFailed') });
    }
  });

  return {
    message,
    lastBackupAt: lastBackup.data?.at ?? null,
    loadedAt: lastBackup.data?.checkedAt ?? 0,
    canUndo,
    busy: exporting.busy || importing.busy || undoing.busy,
    exportBackup: exporting.submit,
    importBackup: importing.submit,
    undoRestore: undoing.submit,
  };
}
