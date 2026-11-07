import { syncCopilotTargets } from '@application/offerSettings';
import { regionalStore } from '@application/regional';
import { BackupFile } from '@data/backup/backup';
import { copilot } from '@modules/copilot';
import { rescheduleAllNotifications } from './reminderNotifications';
import { restoreThemeMode } from './themePreference';

export async function applyRestoredState(backup: BackupFile): Promise<void> {
  if (backup.copilot) await copilot.importState(backup.copilot);
  await regionalStore.load();
  await syncCopilotTargets();
  await restoreThemeMode();
  await rescheduleAllNotifications();
}
