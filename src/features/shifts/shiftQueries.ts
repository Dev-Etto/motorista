import { expenseRepository } from '@data/repositories/expenseRepository';
import { shiftRepository, ShiftSnapshot } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { copilot } from '@modules/copilot';
import { notifyDataChanged } from '@shared/hooks/dataChanges';
import { dayRange } from '@shared/utils/dates';

export async function loadPeriod(start: string, end: string) {
  const [shifts, expenses] = await Promise.all([shiftRepository.listFacts(start, end), expenseRepository.listLoose(start, end)]);
  return { shifts, expenses };
}

export async function loadShiftDetail(shiftId: number) {
  const detail = await shiftRepository.findById(shiftId);
  if (!detail) return null;

  const { from, to } = dayRange(detail.shift.date);
  const vehicleId = detail.shift.vehicleId;
  const [dayOffers, vehicles, vehicle] = await Promise.all([
    copilot.getOffers(from, to),
    vehicleRepository.list(),
    vehicleId ? vehicleRepository.find(vehicleId) : Promise.resolve(null),
  ]);
  return { ...detail, dayOffers, vehicleName: vehicles.length > 1 ? (vehicle?.name ?? null) : null };
}

export type ShiftDetail = NonNullable<Awaited<ReturnType<typeof loadShiftDetail>>>;

export async function removeShift(id: number): Promise<ShiftSnapshot | null> {
  const snapshot = await shiftRepository.snapshot(id);
  await shiftRepository.remove(id);
  return snapshot;
}

export async function restoreShift(snapshot: ShiftSnapshot): Promise<void> {
  await shiftRepository.restore(snapshot);
  notifyDataChanged();
}
