import { syncCopilotTargets } from '@application/offerSettings';
import { goalRepository, MonthlyGoal } from '@data/repositories/goalRepository';

export async function saveGoal(goal: MonthlyGoal, date: string, dayTargetCents: number | null): Promise<void> {
  await goalRepository.save(goal);
  await goalRepository.saveDayOverride(date, dayTargetCents);
  await syncCopilotTargets();
}
