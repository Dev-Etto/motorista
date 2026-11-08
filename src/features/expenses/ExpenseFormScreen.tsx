import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { fuelPriceSuggestion, updateFuelPrice } from '@application/vehicles';
import { countsAgainstProfit } from '@domain/expense/expense';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useUnsavedChangesGuard } from '@shared/hooks/useUnsavedChangesGuard';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { DateField } from '@shared/ui/DateField';
import { confirmAction, showDialog } from '@shared/ui/dialog';
import { MoneyField, NumberField, TextField } from '@shared/ui/fields';
import { FilterChips } from '@shared/ui/FilterChips';
import { AppText, Button, Card, Collapsible, Notice, Screen } from '@shared/ui/primitives';
import { today } from '@shared/utils/dates';
import { reportError } from '@shared/utils/reportError';
import { ExpenseField, ExpenseFieldError, expenseFormErrors } from './expenseFormErrors';
import { findExpense, removeExpense, saveExpense } from './saveExpense';
import { useExpenseVehicles } from './useExpenseVehicles';

type LooseCategory = 'fuel' | 'maintenance' | 'other';

const CATEGORIES: LooseCategory[] = ['fuel', 'maintenance', 'other'];
const EXAMPLE_VOLUME = 45.5;

const categoryOf = (value: string | undefined): LooseCategory => CATEGORIES.find((category) => category === value) ?? 'fuel';

export default function ExpenseFormScreen() {
  const router = useRouter();
  const { t } = useTranslation(['expenses', 'common']);
  const format = useFormat();
  const params = useLocalSearchParams<{ id?: string; category?: string }>();
  const expenseId = params.id ? Number(params.id) : undefined;
  const colors = useTheme();
  const options = CATEGORIES.map((value) => ({ value, label: t(`form.option.${value}`) }));
  const [category, setCategory] = useState<LooseCategory>(() => categoryOf(params.category));
  const [date, setDate] = useState(today());
  const [value, setValue] = useState('');
  const [liters, setLiters] = useState('');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Partial<Record<ExpenseField, ExpenseFieldError>>>({});
  const [chosenVehicleId, setVehicleId] = useState<number | null>(null);
  const { vehicles, inUseId } = useExpenseVehicles();
  const vehicleId = chosenVehicleId ?? inUseId;
  const snapshot = JSON.stringify([category, date, value, liters, odometer, note]);
  const [baseline, setBaseline] = useState<string | null>(expenseId ? null : snapshot);
  const leave = useUnsavedChangesGuard(baseline !== null && snapshot !== baseline);

  useEffect(() => {
    if (!expenseId) return;

    findExpense(expenseId).then((expense) => {
      if (!expense) return;
      setCategory(categoryOf(expense.category));
      setDate(expense.date);
      setValue(format.moneyInput(expense.cents));
      setLiters(expense.liters === null ? '' : format.volumeInput(expense.liters));
      setOdometer(expense.odometer === null ? '' : format.distanceInput(expense.odometer, 0));
      setNote(expense.note ?? '');
      setBaseline(
        JSON.stringify([
          categoryOf(expense.category),
          expense.date,
          format.moneyInput(expense.cents),
          expense.liters === null ? '' : format.volumeInput(expense.liters),
          expense.odometer === null ? '' : format.distanceInput(expense.odometer, 0),
          expense.note ?? '',
        ]),
      );
      if (expense.vehicle_id) setVehicleId(expense.vehicle_id);
    }, reportError);
  }, [expenseId, format]);

  const vehicleName = vehicles.length > 1 ? (vehicles.find((vehicle) => vehicle.id === vehicleId)?.name ?? null) : null;

  const confirmRemove = () => {
    if (!expenseId) return;

    confirmAction({
      title: t('form.deleteConfirm.title', { label: t(`category.${category}`) }),
      message: t('form.deleteConfirm.message', { amount: format.money(format.parseCents(value) ?? 0) }),
      actionLabel: t('common:actions.delete'),
      onConfirm: async () => {
        await removeExpense(expenseId);
        leave(() => router.back());
      },
    });
  };

  const saving = useSubmit(async () => {
    const cents = format.parseCents(value);
    const found = expenseFormErrors({
      cents,
      litersInvalid: category === 'fuel' && format.hasInvalidNumber(liters),
      odometerInvalid: format.hasInvalidNumber(odometer),
    });
    setErrors(found);
    if (!cents || Object.keys(found).length > 0) return;

    const savedLiters = category === 'fuel' ? format.parseVolume(liters) : null;
    await saveExpense(
      {
        date,
        category,
        cents,
        liters: savedLiters,
        odometer: format.parseDistance(odometer),
        note: note.trim() || null,
        vehicle_id: vehicleId,
      },
      expenseId,
    );
    const suggestion = category === 'fuel' ? await fuelPriceSuggestion(vehicleId, cents, savedLiters) : null;
    leave(() => router.back());
    if (!suggestion) return;

    showDialog({
      title: t('fuelPrice.title', { name: suggestion.vehicle.name }),
      message: t('fuelPrice.message', { price: `${format.currencySymbol} ${format.perVolumeInput(suggestion.priceCents)}`, unit: format.volumeUnit }),
      actions: [
        { label: t('fuelPrice.keep'), tone: 'secondary' },
        { label: t('fuelPrice.update'), tone: 'primary', onPress: () => updateFuelPrice(suggestion.vehicle.id, suggestion.priceCents) },
      ],
    });
  });

  const messageOf = (field: ExpenseField) => {
    const error = errors[field];
    if (!error) return null;
    return error === 'required' ? t('form.valueRequired') : t('common:invalidNumber', { example: format.decimalInput(EXAMPLE_VOLUME) });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: expenseId ? t('form.editTitle') : t(`category.${category}`) }} />
      {countsAgainstProfit(category) ? null : (
        <Notice tone="accent" message={t('alreadyInCost', { context: format.distanceUnit, category: t(`category.${category}`) })} />
      )}
      <Card>
        <MoneyField label={t('form.valueLabel')} value={value} onChangeText={setValue} error={messageOf('value')} />
        {category === 'fuel' ? (
          <NumberField label={t('form.litersLabel', { context: format.volumeUnit })} value={liters} onChangeText={setLiters} error={messageOf('liters')} />
        ) : null}
        <NumberField label={t('form.odometerLabel')} value={odometer} onChangeText={setOdometer} suffix={format.distanceUnit} error={messageOf('odometer')} />
        <TextField label={t('form.noteLabel')} value={note} onChangeText={setNote} />
      </Card>
      <Collapsible title={[date === today() ? t('form.today') : format.date(date), vehicleName].filter(Boolean).join(' · ')}>
        <DateField label={t('form.dateLabel')} value={date} onChange={(next) => next && setDate(next)} maximumDate={new Date()} />
        {vehicles.length > 1 ? (
          <FilterChips
            label={t('form.vehicleLabel')}
            value={String(vehicleId)}
            options={vehicles.map((vehicle) => ({ value: String(vehicle.id), label: vehicle.name }))}
            onChange={(id) => setVehicleId(Number(id))}
          />
        ) : null}
      </Collapsible>
      <View style={styles.also}>
        <AppText tone="muted">{t('form.also')}</AppText>
        {options
          .filter((option) => option.value !== category)
          .map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={t('form.switchTo', { category: t(`category.${option.value}`) })}
              onPress={() => setCategory(option.value)}
              style={[styles.chip, { borderColor: colors.borderStrong }]}
            >
              <AppText bold>{t(`category.${option.value}`)}</AppText>
            </Pressable>
          ))}
      </View>
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label={t('common:actions.save')} busy={saving.busy} onPress={saving.submit} />
      {expenseId ? <Button label={t('common:actions.delete')} variant="danger" onPress={confirmRemove} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  also: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  chip: { minHeight: MIN_TOUCH_TARGET - spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1 },
});
