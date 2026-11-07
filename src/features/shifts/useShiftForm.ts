import { useMemo, useState } from 'react';
import { platformRepository } from '@/data/repositories/platformRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { countsAgainstProfit, type ExpenseCategory } from '@/domain/expense/expense';
import { computeShift } from '@/domain/shift/shift';
import { KmEntryMode, kmFromEntry, ShiftFormError, validateShiftForm } from '@/domain/shift/shiftForm';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { toISODate, today } from '@/shared/utils/dates';
import { centsToInput } from '@/shared/utils/money';
import { centsOrZero, decimalOrNull, decimalToInput, hasInvalidHour, hasInvalidNumber, hoursToInput, intOrNull, parseHours } from '@/shared/utils/parse';

export const JOURNEY_EXPENSES: { category: ExpenseCategory; label: string }[] = [
  { category: 'toll', label: 'Pedágio' },
  { category: 'parking', label: 'Estacionamento' },
  { category: 'wash', label: 'Lavagem' },
  { category: 'food', label: 'Alimentação' },
  { category: 'other', label: 'Outras despesas' },
];

const MINUTES_PER_HOUR = 60;

const FORM_ERRORS: Record<ShiftFormError, string> = {
  'invalid-number': 'Confira os números digitados. Use só números, como 150,50.',
  'invalid-start-hour': 'A hora de início vai de 0 a 23.',
  'too-long': 'Uma jornada tem no máximo 24 horas. Confira as horas trabalhadas.',
  'no-earnings': 'Informe o ganho de pelo menos uma plataforma.',
  'odometer-order': 'O odômetro final precisa ser maior que o inicial.',
};

async function loadFormData(shiftId: number | undefined, date: string) {
  const [platforms, costs, existing] = await Promise.all([
    platformRepository.list(),
    vehicleRepository.getCostsAt(date),
    shiftId ? shiftRepository.findById(shiftId) : Promise.resolve(null),
  ]);
  const inactive = (existing?.earnings ?? []).filter((earning) => !platforms.some((platform) => platform.id === earning.platform_id));
  return { platforms: [...platforms, ...inactive.map((earning) => ({ id: earning.platform_id, name: earning.name }))], costs: costs.costs, existing };
}

export function useShiftForm(shiftId?: number) {
  const [date, setDate] = useState(today());
  const [hours, setHours] = useState('');
  const [startHour, setStartHour] = useState('');
  const [kmMode, setKmMode] = useState<KmEntryMode>('manual');
  const [kmMeasured, setKmMeasured] = useState(false);
  const [kmText, setKmText] = useState('');
  const [odometerStart, setOdometerStart] = useState('');
  const [odometerEnd, setOdometerEnd] = useState('');
  const [trips, setTrips] = useState('');
  const [earnings, setEarnings] = useState<Record<number, string>>({});
  const [expenses, setExpenses] = useState<Partial<Record<ExpenseCategory, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(!shiftId);

  const { data } = useAsyncData(async () => {
    const loaded = await loadFormData(shiftId, today());
    if (!loaded.existing || hydrated) return loaded;

    const { shift, earnings: savedEarnings, expenses: savedExpenses } = loaded.existing;
    setDate(shift.date);
    setHours(hoursToInput(shift.minutes));
    setStartHour(shift.start_hour === null ? '' : String(shift.start_hour));
    setKmMode(shift.km_source === 'odometer' ? 'odometer' : 'manual');
    setKmMeasured(shift.km_source === 'gps');
    setKmText(shift.km === null ? '' : decimalToInput(shift.km));
    setOdometerEnd(shift.odometer_end === null ? '' : decimalToInput(shift.odometer_end));
    setOdometerStart(shift.odometer_end === null || shift.km === null ? '' : decimalToInput(shift.odometer_end - shift.km));
    setTrips(shift.trips === null ? '' : String(shift.trips));
    setEarnings(Object.fromEntries(savedEarnings.map((earning) => [earning.platform_id, centsToInput(earning.cents)])));
    setExpenses(Object.fromEntries(savedExpenses.map((expense) => [expense.category, centsToInput(expense.cents)])));
    setHydrated(true);
    return loaded;
  }, [shiftId]);

  const km = kmFromEntry({ mode: kmMode, km: decimalOrNull(kmText), odometerStart: decimalOrNull(odometerStart), odometerEnd: decimalOrNull(odometerEnd) });
  const minutes = Math.round((parseHours(hours) ?? 0) * MINUTES_PER_HOUR);
  const grossCents = Object.values(earnings).reduce((total, text) => total + centsOrZero(text), 0);
  const expensesCents = JOURNEY_EXPENSES.filter(({ category }) => countsAgainstProfit(category)).reduce(
    (total, { category }) => total + centsOrZero(expenses[category] ?? ''),
    0,
  );

  const { data: costsAtDate } = useAsyncData(() => vehicleRepository.getCostsAt(date), [date]);
  const savedShift = data?.existing?.shift;
  const costPerKm = savedShift?.date === date ? savedShift.cost_per_km : (costsAtDate?.costs?.fullPerKm ?? 0);

  const preview = useMemo(
    () => computeShift({ grossCents, km, minutes, expensesCents, costPerKm }),
    [grossCents, km, minutes, expensesCents, costPerKm],
  );

  const applyLive = (timerMinutes: number, startedAt: number, measuredKm: number) => {
    setHours(hoursToInput(timerMinutes));
    if (startedAt > 0) {
      setStartHour(String(new Date(startedAt).getHours()));
      setDate(toISODate(new Date(startedAt)));
    }
    if (measuredKm <= 0) return;

    setKmMode('manual');
    setKmText(decimalToInput(measuredKm, 1));
    setKmMeasured(true);
  };

  const changeKmText = (text: string) => {
    setKmText(text);
    setKmMeasured(false);
  };

  const typedNumbers = [kmMode === 'manual' ? kmText : '', odometerStart, odometerEnd, trips, startHour, ...Object.values(earnings), ...Object.values(expenses).map((text) => text ?? '')];

  const save = async (): Promise<boolean> => {
    const problem = validateShiftForm({
      hasInvalidNumber: typedNumbers.some(hasInvalidNumber) || (hours.trim() !== '' && parseHours(hours) === null),
      hasInvalidHour: hasInvalidHour(startHour),
      minutes,
      grossCents,
      kmMode,
      km,
      odometerTyped: Boolean(odometerStart || odometerEnd),
    });
    if (problem) {
      setError(FORM_ERRORS[problem]);
      return false;
    }

    await shiftRepository.save({
      id: shiftId,
      date,
      startHour: intOrNull(startHour),
      minutes,
      km,
      kmSource: kmMeasured ? 'gps' : kmMode,
      odometerEnd: kmMode === 'odometer' ? decimalOrNull(odometerEnd) : null,
      trips: intOrNull(trips),
      note: null,
      earnings: Object.entries(earnings)
        .map(([platformId, text]) => ({ platformId: Number(platformId), cents: centsOrZero(text) }))
        .filter((earning) => earning.cents > 0),
      expenses: JOURNEY_EXPENSES.map(({ category }) => ({ category, cents: centsOrZero(expenses[category] ?? '') })).filter(
        (expense) => expense.cents > 0,
      ),
    });
    return true;
  };

  return {
    platforms: data?.platforms ?? [],
    date,
    setDate,
    hours,
    setHours,
    startHour,
    setStartHour,
    kmMode,
    setKmMode,
    kmText,
    setKmText: changeKmText,
    kmMeasured,
    odometerStart,
    setOdometerStart,
    odometerEnd,
    setOdometerEnd,
    trips,
    setTrips,
    earnings,
    setEarning: (platformId: number, text: string) => setEarnings((current) => ({ ...current, [platformId]: text })),
    expenses,
    setExpense: (category: ExpenseCategory, text: string) => setExpenses((current) => ({ ...current, [category]: text })),
    preview,
    error,
    applyLive,
    save,
  };
}
