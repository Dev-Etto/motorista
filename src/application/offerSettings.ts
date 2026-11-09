import { z } from 'zod';
import { loadGoalProgress } from '@application/goalProgress';
import { SETTING_KEYS, type SettingKey, settingsRepository } from '@data/repositories/settingsRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import {
  activeTargets,
  DEFAULT_TARGETS_BY_KIND,
  OFFER_MODES,
  type OfferMode,
  type OfferSettings,
  type OfferTargets,
  offerTargetsSchema,
  withGoalTargets,
} from '@domain/offer/offer';
import type { VehicleKind } from '@domain/vehicle/costs';
import { copilot } from '@modules/copilot';
import { today } from '@shared/utils/dates';
import { vehicleInUse } from './vehicleInUse';

const TARGET_KEYS: Record<VehicleKind, Record<OfferMode, SettingKey>> = {
  car: { normal: SETTING_KEYS.offerTargets, low: SETTING_KEYS.offerLowTargets },
  motorcycle: { normal: SETTING_KEYS.offerTargetsMotorcycle, low: SETTING_KEYS.offerLowTargetsMotorcycle },
};

async function kindInUse(): Promise<VehicleKind> {
  return (await vehicleInUse())?.kind ?? 'car';
}

export async function loadOfferSettings(chosenKind?: VehicleKind): Promise<OfferSettings> {
  const kind = chosenKind ?? (await kindInUse());
  const defaults = DEFAULT_TARGETS_BY_KIND[kind];
  const [mode, normal, low, followGoal, progress] = await Promise.all([
    settingsRepository.getEnum(SETTING_KEYS.offerMode, OFFER_MODES, 'normal'),
    settingsRepository.getJson(TARGET_KEYS[kind].normal, offerTargetsSchema, defaults.normal),
    settingsRepository.getJson(TARGET_KEYS[kind].low, offerTargetsSchema, defaults.low),
    settingsRepository.getJson(SETTING_KEYS.offerFollowGoal, z.boolean(), false),
    loadGoalProgress(today()),
  ]);
  return withGoalTargets({ kind, mode, normal, low, followGoal }, progress?.suggestion ?? null);
}

export async function saveOfferMode(mode: OfferMode): Promise<void> {
  await settingsRepository.set(SETTING_KEYS.offerMode, mode);
  await syncCopilotTargets();
}

export async function saveFollowGoal(followGoal: boolean): Promise<void> {
  await settingsRepository.setJson(SETTING_KEYS.offerFollowGoal, followGoal);
  await syncCopilotTargets();
}

export async function saveModeTargets(kind: VehicleKind, mode: OfferMode, targets: OfferTargets): Promise<void> {
  await settingsRepository.setJson(TARGET_KEYS[kind][mode], targets);
  await syncCopilotTargets();
}

export async function syncCopilotTargets(): Promise<void> {
  const vehicle = await vehicleInUse();
  const [{ costs }, settings] = await Promise.all([vehicleRepository.getCostsAt(today(), vehicle?.id), loadOfferSettings(vehicle?.kind ?? 'car')]);
  const targets = activeTargets(settings);
  copilot.setTargets(costs?.fullPerKm ?? 0, targets.targetPerKmCents, targets.targetPerHourCents);
}
