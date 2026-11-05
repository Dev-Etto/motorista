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

export async function saveOfferSettings(settings: OfferSettings): Promise<void> {
  await Promise.all([
    settingsRepository.set(SETTING_KEYS.offerMode, settings.mode),
    settingsRepository.setJson(SETTING_KEYS.offerTargets, settings.normal),
    settingsRepository.setJson(SETTING_KEYS.offerLowTargets, settings.low),
    settingsRepository.setJson(SETTING_KEYS.offerFollowGoal, settings.followGoal),
  ]);
  await syncCopilotTargets();
}

export async function syncCopilotTargets(): Promise<void> {
  const [{ costs }, settings] = await Promise.all([vehicleRepository.getCostsAt(today()), loadOfferSettings()]);
  const targets = activeTargets(settings);
  copilot.setTargets(costs?.fullPerKm ?? 0, targets.targetPerKmCents, targets.targetPerHourCents);
}
