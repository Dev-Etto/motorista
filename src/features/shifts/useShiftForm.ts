import { useMemo, useState } from 'react';
import { platformRepository } from '@/data/repositories/platformRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { countsAgainstProfit, type ExpenseCategory } from '@/domain/expense/expense';
import { computeShift } from '@/domain/shift/shift';
import { KmEntryMode, kmFromEntry, ShiftFormError, validateShiftForm } from '@/domain/shift/shiftForm';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { useFormHydration } from '@/shared/hooks/useFormHydration';
import { toISODate, today } from '@/shared/utils/dates';
import { centsToInput } from '@/shared/utils/money';
import { centsOrZero, decimalOrNull, decimalToInput, hasInvalidHour, hasInvalidNumber, hoursToInput, intOrNull, parseHours } from '@/shared/utils/parse';
import { MINUTES_PER_HOUR } from '@/shared/utils/time';

export const JOURNEY_EXPENSES: { category: ExpenseCategory; label: string }[] = [
  { category: 'toll', label: 'Pedágio' },
  { category: 'parking', label: 'Estacionamento' },
  { category: 'wash', label: 'Lavagem' },
  { category: 'food', label: 'Alimentação' },
  { category: 'other', label: 'Outras despesas' },
];

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
  const inactive = (existing?.earnings ?? []).filter((earning) => !platforms.some((platform) => platform.id === earning.platformId));
  return { platforms: [...platforms, ...inactive.map((earning) => ({ id: earning.platformId, name: earning.name }))], costs: costs.costs, existing };
}

const EMPTY_FIELDS = { hours: '', startHour: '', km: '', odometerStart: '', odometerEnd: '', trips: '' };

type ShiftFormData = Awaited<ReturnType<typeof loadFormData>>;

function fieldsFrom(shift: NonNullable<ShiftFormData['existing']>['shift']) {
  const hasOdometer = shift.odometerEnd !== null && shift.km !== null;
  return {
    hours: hoursToInput(shift.minutes),
    startHour: shift.startHour === null ? '' : String(shift.startHour),
    km: shift.km === null ? '' : decimalToInput(shift.km),
    odometerEnd: shift.odometerEnd === null ? '' : decimalToInput(shift.odometerEnd),
    odometerStart: hasOdometer ? decimalToInput((shift.odometerEnd ?? 0) - (shift.km ?? 0)) : '',
    trips: shift.trips === null ? '' : String(shift.trips),
  };
}

export function useShiftForm(shiftId?: number) {
  const [date, setDate] = useState(today());
  const [kmMode, setKmMode] = useState<KmEntryMode>('manual');
  const [kmMeasured, setKmMeasured] = useState(false);
  const { values: fields, setValues: setFields, setField, bind } = useFormFields(EMPTY_FIELDS);
  const [earnings, setEarnings] = useState<Record<number, string>>({});
  const [expenses, setExpenses] = useState<Partial<Record<ExpenseCategory, string>>>({});
  const [error, setError] = useState<string | null>(null);

  const { data } = useAsyncData(() => loadFormData(shiftId, today()), [shiftId]);

  useFormHydration(
    data?.existing,
    ({ shift, earnings: savedEarnings, expenses: savedExpenses }) => {
      setDate(shift.date);
      setFields(fieldsFrom(shift));
      setKmMode(shift.kmSource === 'odometer' ? 'odometer' : 'manual');
      setKmMeasured(shift.kmSource === 'gps');
      setEarnings(Object.fromEntries(savedEarnings.map((earning) => [earning.platformId, centsToInput(earning.cents)])));
      setExpenses(Object.fromEntries(savedExpenses.map((expense) => [expense.category, centsToInput(expense.cents)])));
    },
    shiftId ?? 'new',
  );

  const km = kmFromEntry({
    mode: kmMode,
    km: decimalOrNull(fields.km),
    odometerStart: decimalOrNull(fields.odometerStart),
    odometerEnd: decimalOrNull(fields.odometerEnd),
  });
  const minutes = Math.round((parseHours(fields.hours) ?? 0) * MINUTES_PER_HOUR);
  const grossCents = Object.values(earnings).reduce((total, text) => total + centsOrZero(text), 0);
  const expensesCents = JOURNEY_EXPENSES.filter(({ category }) => countsAgainstProfit(category)).reduce(
    (total, { category }) => total + centsOrZero(expenses[category] ?? ''),
    0,
  );

  const { data: costsAtDate } = useAsyncData(() => vehicleRepository.getCostsAt(date), [date]);
  const savedShift = data?.existing?.shift;
  const costPerKm = savedShift?.date === date ? savedShift.costPerKm : (costsAtDate?.costs?.fullPerKm ?? 0);

  const preview = useMemo(() => computeShift({ grossCents, km, minutes, expensesCents, costPerKm }), [grossCents, km, minutes, expensesCents, costPerKm]);

  const applyLive = (timerMinutes: number, startedAt: number, measuredKm: number) => {
    setField('hours', hoursToInput(timerMinutes));
    if (startedAt > 0) {
      setField('startHour', String(new Date(startedAt).getHours()));
      setDate(toISODate(new Date(startedAt)));
    }
    if (measuredKm <= 0) return;

    setKmMode('manual');
    setField('km', decimalToInput(measuredKm, 1));
    setKmMeasured(true);
  };

  const kmField = {
    value: fields.km,
    onChangeText: (text: string) => {
      setField('km', text);
      setKmMeasured(false);
    },
  };

  const typedNumbers = [
    kmMode === 'manual' ? fields.km : '',
    fields.odometerStart,
    fields.odometerEnd,
    fields.trips,
    fields.startHour,
    ...Object.values(earnings),
    ...Object.values(expenses).map((text) => text ?? ''),
  ];

  const save = async (): Promise<boolean> => {
    const problem = validateShiftForm({
      hasInvalidNumber: typedNumbers.some(hasInvalidNumber) || (fields.hours.trim() !== '' && parseHours(fields.hours) === null),
      hasInvalidHour: hasInvalidHour(fields.startHour),
      minutes,
      grossCents,
      kmMode,
      km,
      odometerTyped: Boolean(fields.odometerStart || fields.odometerEnd),
    });
    if (problem) {
      setError(FORM_ERRORS[problem]);
      return false;
    }

    await shiftRepository.save({
      id: shiftId,
      date,
      startHour: intOrNull(fields.startHour),
      minutes,
      km,
      kmSource: kmMeasured ? 'gps' : kmMode,
      odometerEnd: kmMode === 'odometer' ? decimalOrNull(fields.odometerEnd) : null,
      trips: intOrNull(fields.trips),
      note: null,
      earnings: Object.entries(earnings)
        .map(([platformId, text]) => ({ platformId: Number(platformId), cents: centsOrZero(text) }))
        .filter((earning) => earning.cents > 0),
      expenses: JOURNEY_EXPENSES.map(({ category }) => ({ category, cents: centsOrZero(expenses[category] ?? '') })).filter((expense) => expense.cents > 0),
    });
    return true;
  };

  return {
    platforms: data?.platforms ?? [],
    date,
    setDate,
    bind,
    kmField,
    kmMode,
    setKmMode,
    kmMeasured,
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
