import { expenseRepository } from '@data/repositories/expenseRepository';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { copilot } from '@modules/copilot';
import { dayRange, monthBounds } from '@shared/utils/dates';

export async function loadMonth(date: string) {
  const { start, end } = monthBounds(date);
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

export const removeShift = (id: number) => shiftRepository.remove(id);
export const removeLooseExpense = (id: number) => expenseRepository.remove(id);
