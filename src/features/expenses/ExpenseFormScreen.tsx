import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { countsAgainstProfit } from '@domain/expense/expense';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { DateField } from '@shared/ui/DateField';
import { confirmAction } from '@shared/ui/dialog';
import { MoneyField, NumberField, TextField } from '@shared/ui/fields';
import { Button, Card, Notice, Screen, Segmented } from '@shared/ui/primitives';
import { today } from '@shared/utils/dates';
import { reportError } from '@shared/utils/reportError';
import { ExpenseField, ExpenseFieldError, expenseFormErrors } from './expenseFormErrors';
import { findExpense, removeExpense, saveExpense } from './saveExpense';

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
  const options = CATEGORIES.map((value) => ({ value, label: t(`form.option.${value}`) }));
  const [category, setCategory] = useState<LooseCategory>(() => categoryOf(params.category));
  const [date, setDate] = useState(today());
  const [value, setValue] = useState('');
  const [liters, setLiters] = useState('');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Partial<Record<ExpenseField, ExpenseFieldError>>>({});

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
    }, reportError);
  }, [expenseId, format]);

  const confirmRemove = () => {
    if (!expenseId) return;

    confirmAction({
      title: t('form.deleteConfirm.title', { label: t(`category.${category}`) }),
      message: t('form.deleteConfirm.message', { amount: format.money(format.parseCents(value) ?? 0) }),
      actionLabel: t('common:actions.delete'),
      onConfirm: async () => {
        await removeExpense(expenseId);
        router.back();
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

    await saveExpense(
      {
        date,
        category,
        cents,
        liters: category === 'fuel' ? format.parseVolume(liters) : null,
        odometer: format.parseDistance(odometer),
        note: note.trim() || null,
      },
      expenseId,
    );
    router.back();
  });

  const messageOf = (field: ExpenseField) => {
    const error = errors[field];
    if (!error) return null;
    return error === 'required' ? t('form.valueRequired') : t('common:invalidNumber', { example: format.decimalInput(EXAMPLE_VOLUME) });
  };

  return (
    <Screen>
      {expenseId ? <Stack.Screen options={{ title: t('form.editTitle') }} /> : null}
      <Segmented value={category} options={options} onChange={setCategory} />
      {countsAgainstProfit(category) ? null : (
        <Notice tone="accent" message={t('alreadyInCost', { context: format.distanceUnit, category: t(`category.${category}`) })} />
      )}
      <Card>
        <DateField label={t('form.dateLabel')} value={date} onChange={(next) => next && setDate(next)} maximumDate={new Date()} />
        <MoneyField label={t('form.valueLabel')} value={value} onChangeText={setValue} error={messageOf('value')} />
        {category === 'fuel' ? (
          <NumberField label={t('form.litersLabel', { context: format.volumeUnit })} value={liters} onChangeText={setLiters} error={messageOf('liters')} />
        ) : null}
        <NumberField label={t('form.odometerLabel')} value={odometer} onChangeText={setOdometer} suffix={format.distanceUnit} error={messageOf('odometer')} />
        <TextField label={t('form.noteLabel')} value={note} onChangeText={setNote} />
      </Card>
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label={t('common:actions.save')} busy={saving.busy} onPress={saving.submit} />
      {expenseId ? <Button label={t('common:actions.delete')} variant="danger" onPress={confirmRemove} /> : null}
    </Screen>
  );
}
