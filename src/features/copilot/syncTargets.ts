import { copilot } from '@modules/copilot';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { activeTargets, DEFAULT_LOW_DEMAND_TARGETS, DEFAULT_OFFER_TARGETS, OfferMode, OfferSettings, OfferTargets, withGoalTargets } from '@/domain/offer/offer';
import { loadGoalProgress } from '@/features/goals/goalProgress';
import { today } from '@/shared/utils/dates';

export async function loadOfferSettings(): Promise<OfferSettings> {
  const [mode, normal, low, followGoal, progress] = await Promise.all([
    settingsRepository.get(SETTING_KEYS.offerMode),
    settingsRepository.getJson<OfferTargets>(SETTING_KEYS.offerTargets, DEFAULT_OFFER_TARGETS),
    settingsRepository.getJson<OfferTargets>(SETTING_KEYS.offerLowTargets, DEFAULT_LOW_DEMAND_TARGETS),
    settingsRepository.getJson<boolean>(SETTING_KEYS.offerFollowGoal, false),
    loadGoalProgress(today()),
  ]);
  return withGoalTargets({ mode: (mode as OfferMode | null) ?? 'normal', normal, low, followGoal }, progress?.suggestion ?? null);
}

export async function saveOfferMode(mode: OfferMode): Promise<void> {
  await settingsRepository.set(SETTING_KEYS.offerMode, mode);
  await syncCopilotTargets();
}

export async function saveFollowGoal(followGoal: boolean): Promise<void> {
  await settingsRepository.setJson(SETTING_KEYS.offerFollowGoal, followGoal);
  await syncCopilotTargets();
}

export async function saveModeTargets(mode: OfferMode, targets: OfferTargets): Promise<void> {
  await settingsRepository.setJson(mode === 'normal' ? SETTING_KEYS.offerTargets : SETTING_KEYS.offerLowTargets, targets);
  await syncCopilotTargets();
}

export async function syncCopilotTargets(): Promise<void> {
  const [{ costs }, settings] = await Promise.all([vehicleRepository.getCostsAt(today()), loadOfferSettings()]);
  const targets = activeTargets(settings);
  copilot.setTargets(costs?.fullPerKm ?? 0, targets.targetPerKmCents, targets.targetPerHourCents);
}
