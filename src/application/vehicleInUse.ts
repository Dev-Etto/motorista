import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { type Vehicle, vehicleRepository } from '@data/repositories/vehicleRepository';
import { copilot } from '@modules/copilot';

async function pinnedVehicle(): Promise<Vehicle | null> {
  const stored = await settingsRepository.get(SETTING_KEYS.shiftVehicle);
  return stored ? vehicleRepository.find(Number(stored)) : null;
}

export async function shiftVehicle(): Promise<Vehicle | null> {
  if (!copilot.getTimer().started) {
    await settingsRepository.remove(SETTING_KEYS.shiftVehicle);
    return null;
  }

  const pinned = await pinnedVehicle();
  if (pinned) return pinned;

  const current = await vehicleRepository.getCurrent();
  if (current) await settingsRepository.set(SETTING_KEYS.shiftVehicle, String(current.id));
  return current;
}

export async function vehicleInUse(): Promise<Vehicle | null> {
  return (await shiftVehicle()) ?? vehicleRepository.getCurrent();
}

export async function releaseShiftVehicle(): Promise<void> {
  await settingsRepository.remove(SETTING_KEYS.shiftVehicle);
}
