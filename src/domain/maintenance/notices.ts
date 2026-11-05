const MS_PER_DAY = 86400000;

export function isBackupDue(lastBackupAt: string | null, hasShifts: boolean, now: number, reminderDays: number): boolean {
  if (!hasShifts) return false;
  if (!lastBackupAt) return true;
  return now - Number(lastBackupAt) > reminderDays * MS_PER_DAY;
}

export function isUpdateDue(buildDate: string | undefined, now: number, reminderDays: number): boolean {
  if (!buildDate) return false;
  const built = Date.parse(buildDate);
  if (Number.isNaN(built)) return false;
  return now - built > reminderDays * MS_PER_DAY;
}
