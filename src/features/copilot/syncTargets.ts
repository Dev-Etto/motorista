import { copilot } from '@modules/copilot';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { DEFAULT_OFFER_TARGETS, OfferTargets } from '@/domain/offer/offer';
import { today } from '@/shared/utils/dates';

export const loadOfferTargets = () =>
  settingsRepository.getJson<OfferTargets>(SETTING_KEYS.offerTargets, DEFAULT_OFFER_TARGETS);

export async function syncCopilotTargets(): Promise<void> {
  const [{ costs }, targets] = await Promise.all([vehicleRepository.getCostsAt(today()), loadOfferTargets()]);
  copilot.setTargets(costs?.fullPerKm ?? 0, targets.targetPerKmCents, targets.targetPerHourCents);
}
