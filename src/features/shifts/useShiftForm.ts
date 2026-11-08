import type { TFunction } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { vehicleInUse } from '@application/vehicleInUse';
import { platformRepository } from '@data/repositories/platformRepository';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { countsAgainstProfit, type ExpenseCategory } from '@domain/expense/expense';
import { computeShift } from '@domain/shift/shift';
import { fieldOfError, KmEntryMode, kmFromEntry, ShiftFormError, ShiftFormField, validateShiftForm } from '@domain/shift/shiftForm';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useFormFields } from '@shared/hooks/useFormFields';
import { useFormHydration } from '@shared/hooks/useFormHydration';
import { Formatter, useFormat } from '@shared/i18n/format';
import { hourOfMillis, isoFromMillis, today } from '@shared/utils/dates';
import { hoursToInput } from '@shared/utils/parse';
import { MINUTES_PER_HOUR } from '@shared/utils/time';

export const JOURNEY_EXPENSES: ExpenseCategory[] = ['toll', 'parking', 'wash', 'food', 'other'];

const EXAMPLE_CENTS = 15050;

export function describeFormError(error: ShiftFormError, t: TFunction<['shifts', 'common']>, format: Formatter): string {
  const messages: Record<ShiftFormError, string> = {
    'invalid-number': t('common:invalidNumber', { example: format.moneyInput(EXAMPLE_CENTS) }),
    'invalid-hours': t('form.errors.invalidHours'),
    'invalid-start-hour': t('form.errors.invalidStartHour'),
    'too-long': t('form.errors.tooLong'),
    'no-earnings': t('form.errors.noEarnings'),
    'odometer-order': t('form.errors.odometerOrder'),
  };
  return messages[error];
}

async function loadFormData(shiftId: number | undefined) {
  const [platforms, vehicles, current, existing] = await Promise.all([
    platformRepository.list(),
    vehicleRepository.list(),
    vehicleInUse(),
    shiftId ? shiftRepository.findById(shiftId) : Promise.resolve(null),
  ]);
  const lastOdometer = shiftId ? null : await shiftRepository.lastOdometerEnd(current?.id ?? null);
  const inactive = (existing?.earnings ?? []).filter((earning) => !platforms.some((platform) => platform.id === earning.platformId));
  const shiftVehicle = existing?.shift.vehicleId ? await vehicleRepository.find(existing.shift.vehicleId) : null;
  const archived = shiftVehicle && !vehicles.some((vehicle) => vehicle.id === shiftVehicle.id) ? [shiftVehicle] : [];
  return {
    platforms: [...platforms, ...inactive.map((earning) => ({ id: earning.platformId, name: earning.name }))],
    vehicles: [...vehicles, ...archived],
    currentVehicleId: current?.id ?? null,
    lastOdometer,
    existing,
  };
}

const EMPTY_FIELDS = { hours: '', startHour: '', km: '', odometerStart: '', odometerEnd: '', trips: '' };

type ShiftFormData = Awaited<ReturnType<typeof loadFormData>>;

function fieldsFrom(shift: NonNullable<ShiftFormData['existing']>['shift'], format: Formatter) {
  const hasOdometer = shift.odometerEnd !== null && shift.km !== null;
  return {
    hours: hoursToInput(shift.minutes),
    startHour: shift.startHour === null ? '' : String(shift.startHour),
    km: shift.km === null ? '' : format.distanceInput(shift.km),
    odometerEnd: shift.odometerEnd === null ? '' : format.distanceInput(shift.odometerEnd),
    odometerStart: hasOdometer ? format.distanceInput((shift.odometerEnd ?? 0) - (shift.km ?? 0)) : '',
    trips: shift.trips === null ? '' : String(shift.trips),
  };
}

export function useShiftForm(shiftId?: number) {
  const { t } = useTranslation(['shifts', 'common']);
  const format = useFormat();
  const [date, setDate] = useState(today());
  const [kmMode, setKmMode] = useState<KmEntryMode>('manual');
  const [kmMeasured, setKmMeasured] = useState(false);
  const { values: fields, setValues: setFields, setField, bind } = useFormFields(EMPTY_FIELDS);
  const [earnings, setEarnings] = useState<Record<number, string>>({});
  const [expenses, setExpenses] = useState<Partial<Record<ExpenseCategory, string>>>({});
  const [problem, setProblem] = useState<ShiftFormError | null>(null);
  const [touched, setTouched] = useState(false);

  const [chosenVehicleId, setVehicleId] = useState<number | null>(null);
  const { data } = useAsyncData(() => loadFormData(shiftId), [shiftId]);
  const vehicleId = chosenVehicleId ?? data?.currentVehicleId ?? null;

  useFormHydration(
    data?.existing,
    ({ shift, earnings: savedEarnings, expenses: savedExpenses }) => {
      setDate(shift.date);
      setVehicleId(shift.vehicleId);
      setFields(fieldsFrom(shift, format));
      setKmMode(shift.kmSource === 'odometer' ? 'odometer' : 'manual');
      setKmMeasured(shift.kmSource === 'gps');
      setEarnings(Object.fromEntries(savedEarnings.map((earning) => [earning.platformId, format.moneyInput(earning.cents)])));
      setExpenses(Object.fromEntries(savedExpenses.map((expense) => [expense.category, format.moneyInput(expense.cents)])));
    },
    shiftId ?? 'new',
  );

  useEffect(() => {
    if (!data?.lastOdometer) return;
    setFields((current) => (current.odometerStart ? current : { ...current, odometerStart: format.distanceInput(data.lastOdometer ?? 0, 0) }));
  }, [data?.lastOdometer, format, setFields]);

  const touching =
    <Args extends unknown[]>(action: (...args: Args) => void) =>
    (...args: Args) => {
      setTouched(true);
      action(...args);
    };
  const touchedBind = (key: keyof typeof EMPTY_FIELDS) => {
    const binding = bind(key);
    return { ...binding, onChangeText: touching(binding.onChangeText) };
  };

  const km = kmFromEntry({
    mode: kmMode,
    km: format.parseDistance(fields.km),
    odometerStart: format.parseDistance(fields.odometerStart),
    odometerEnd: format.parseDistance(fields.odometerEnd),
  });
  const minutes = Math.round((format.parseHours(fields.hours) ?? 0) * MINUTES_PER_HOUR);
  const grossCents = Object.values(earnings).reduce((total, text) => total + format.centsOrZero(text), 0);
  const expensesCents = JOURNEY_EXPENSES.filter((category) => countsAgainstProfit(category)).reduce(
    (total, category) => total + format.centsOrZero(expenses[category] ?? ''),
    0,
  );

  const { data: costsAtDate } = useAsyncData(() => vehicleRepository.getCostsAt(date, vehicleId), [date, vehicleId]);
  const savedShift = data?.existing?.shift;
  const keepsSavedCost = savedShift?.date === date && savedShift.vehicleId === vehicleId && savedShift.costPerKm > 0;
  const costPerKm = keepsSavedCost ? savedShift.costPerKm : (costsAtDate?.costs?.fullPerKm ?? 0);

  const preview = useMemo(() => computeShift({ grossCents, km, minutes, expensesCents, costPerKm }), [grossCents, km, minutes, expensesCents, costPerKm]);

  const applyLive = (timerMinutes: number, startedAt: number, measuredKm: number) => {
    setField('hours', hoursToInput(timerMinutes));
    if (startedAt > 0) {
      setField('startHour', String(hourOfMillis(startedAt)));
      setDate(isoFromMillis(startedAt));
    }
    if (measuredKm <= 0) return;

    setKmMode('manual');
    setField('km', format.distanceInput(measuredKm, 1));
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

  const validate = (): ShiftFormError | null =>
    validateShiftForm({
      hasInvalidNumber: typedNumbers.some(format.hasInvalidNumber),
      hasInvalidHours: fields.hours.trim() !== '' && format.parseHours(fields.hours) === null,
      hasInvalidHour: format.hasInvalidHour(fields.startHour),
      minutes,
      grossCents,
      kmMode,
      km,
      odometerTyped: Boolean(fields.odometerStart || fields.odometerEnd),
    });

  const save = async (): Promise<number | null> => {
    const found = validate();
    setProblem(found);
    if (found) return null;

    return shiftRepository.save({
      id: shiftId,
      vehicleId,
      date,
      startHour: format.parseInt(fields.startHour),
      minutes,
      km,
      kmSource: kmMeasured ? 'gps' : kmMode,
      odometerEnd: kmMode === 'odometer' ? format.parseDistance(fields.odometerEnd) : null,
      trips: format.parseInt(fields.trips),
      note: null,
      earnings: Object.entries(earnings)
        .map(([platformId, text]) => ({ platformId: Number(platformId), cents: format.centsOrZero(text) }))
        .filter((earning) => earning.cents > 0),
      expenses: JOURNEY_EXPENSES.map((category) => ({ category, cents: format.centsOrZero(expenses[category] ?? '') })).filter((expense) => expense.cents > 0),
    });
  };

  return {
    platforms: data?.platforms ?? [],
    vehicles: data?.vehicles ?? [],
    vehicleId,
    setVehicleId: touching(setVehicleId),
    date,
    setDate: touching(setDate),
    bind: touchedBind,
    kmField: { ...kmField, onChangeText: touching(kmField.onChangeText) },
    kmMode,
    setKmMode: touching(setKmMode),
    kmMeasured,
    earnings,
    setEarning: touching((platformId: number, text: string) => setEarnings((current) => ({ ...current, [platformId]: text }))),
    expenses,
    setExpense: touching((category: ExpenseCategory, text: string) => setExpenses((current) => ({ ...current, [category]: text }))),
    dirty: touched,
    preview,
    minutes,
    startHour: format.parseInt(fields.startHour),
    error: problem && !fieldOfError(problem) ? describeFormError(problem, t, format) : null,
    fieldError: (field: ShiftFormField) => (problem && fieldOfError(problem) === field ? describeFormError(problem, t, format) : null),
    applyLive,
    validate,
    showProblem: setProblem,
    save,
  };
}
