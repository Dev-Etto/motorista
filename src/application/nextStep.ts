import { z } from 'zod';
import { goalRepository } from '@data/repositories/goalRepository';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { copilot } from '@modules/copilot';
import { monthKey, today } from '@shared/utils/dates';

const STEP_IDS = ['vehicle', 'copilot', 'first-shift', 'goal', 'first-backup'] as const;
const dismissedSchema = z.array(z.enum(STEP_IDS));

export type NextStepId = (typeof STEP_IDS)[number];

export interface NextStep {
  id: NextStepId;
  href: '/vehicle' | '/copilot-setup' | '/shift/new' | '/goal' | '/backup';
}

const STEPS: Record<NextStepId, NextStep> = {
  vehicle: { id: 'vehicle', href: '/vehicle' },
  copilot: { id: 'copilot', href: '/copilot-setup' },
  'first-shift': { id: 'first-shift', href: '/shift/new' },
  goal: { id: 'goal', href: '/goal' },
  'first-backup': { id: 'first-backup', href: '/backup' },
};

export async function loadNextStep(): Promise<NextStep | null> {
  const date = today();
  const [{ costs }, stats, goal, lastBackup, dismissed] = await Promise.all([
    vehicleRepository.getCostsAt(date),
    shiftRepository.usageStats(),
    goalRepository.findInEffect(monthKey(date)),
    settingsRepository.get(SETTING_KEYS.lastBackupAt),
    settingsRepository.getJson(SETTING_KEYS.nextStepsDismissed, dismissedSchema, []),
  ]);

  const pending: (NextStepId | null)[] = [
    costs ? null : 'vehicle',
    copilot.getStatus().accessibilityGranted ? null : 'copilot',
    stats.total > 0 || copilot.getTimer().started ? null : 'first-shift',
    goal ? null : 'goal',
    lastBackup || stats.total === 0 ? null : 'first-backup',
  ];
  const next = pending.find((id) => id !== null && !dismissed.includes(id));
  return next ? STEPS[next] : null;
}

export async function dismissNextStep(id: NextStepId): Promise<void> {
  const dismissed = await settingsRepository.getJson(SETTING_KEYS.nextStepsDismissed, dismissedSchema, []);
  await settingsRepository.setJson(SETTING_KEYS.nextStepsDismissed, [...dismissed, id]);
}
