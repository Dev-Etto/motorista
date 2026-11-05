import { copilot } from '@modules/copilot';
import { BackupFile } from '@/data/backup/backup';
import { syncCopilotTargets } from '@/features/copilot/syncTargets';
import { rescheduleAllNotifications } from './reminderNotifications';
import { restoreThemeMode } from './themePreference';

export async function applyRestoredState(backup: BackupFile): Promise<void> {
  if (backup.copilot) copilot.importState(backup.copilot);
  await syncCopilotTargets();
  await restoreThemeMode();
  await rescheduleAllNotifications();
}
