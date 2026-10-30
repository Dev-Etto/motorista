import { copilot } from '@modules/copilot';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { activeTargets, DEFAULT_LOW_DEMAND_TARGETS, DEFAULT_OFFER_TARGETS, OfferMode, OfferSettings, OfferTargets } from '@/domain/offer/offer';
import { today } from '@/shared/utils/dates';

export async function loadOfferSettings(): Promise<OfferSettings> {
  const [mode, normal, low] = await Promise.all([
    settingsRepository.get(SETTING_KEYS.offerMode),
    settingsRepository.getJson<OfferTargets>(SETTING_KEYS.offerTargets, DEFAULT_OFFER_TARGETS),
    settingsRepository.getJson<OfferTargets>(SETTING_KEYS.offerLowTargets, DEFAULT_LOW_DEMAND_TARGETS),
  ]);
  return { mode: (mode as OfferMode | null) ?? 'normal', normal, low };
}

export async function saveOfferSettings(settings: OfferSettings): Promise<void> {
  await Promise.all([
    settingsRepository.set(SETTING_KEYS.offerMode, settings.mode),
    settingsRepository.setJson(SETTING_KEYS.offerTargets, settings.normal),
    settingsRepository.setJson(SETTING_KEYS.offerLowTargets, settings.low),
  ]);
  await syncCopilotTargets();
}

export async function syncCopilotTargets(): Promise<void> {
  const [{ costs }, settings] = await Promise.all([vehicleRepository.getCostsAt(today()), loadOfferSettings()]);
  const targets = activeTargets(settings);
  copilot.setTargets(costs?.fullPerKm ?? 0, targets.targetPerKmCents, targets.targetPerHourCents);
}
