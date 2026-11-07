import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { countsAgainstProfit } from '@domain/expense/expense';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { DateField } from '@shared/ui/DateField';
import { MoneyField, NumberField, TextField } from '@shared/ui/fields';
import { Button, Card, Notice, Screen, Segmented } from '@shared/ui/primitives';
import { today } from '@shared/utils/dates';
import { saveExpense } from './saveExpense';

type LooseCategory = 'fuel' | 'maintenance' | 'other';

const CATEGORIES: LooseCategory[] = ['fuel', 'maintenance', 'other'];
const EXAMPLE_VOLUME = 45.5;

export default function ExpenseFormScreen() {
  const router = useRouter();
  const { t } = useTranslation(['expenses', 'common']);
  const format = useFormat();
  const options = CATEGORIES.map((value) => ({ value, label: t(`form.option.${value}`) }));
  const [category, setCategory] = useState<LooseCategory>('fuel');
  const [date, setDate] = useState(today());
  const [value, setValue] = useState('');
  const [liters, setLiters] = useState('');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const saving = useSubmit(async () => {
    const cents = format.parseCents(value);
    if (!cents) return setError(t('form.valueRequired'));
    if (format.hasInvalidNumber(liters) || format.hasInvalidNumber(odometer))
      return setError(t('common:invalidNumber', { example: format.decimalInput(EXAMPLE_VOLUME) }));

    await saveExpense({
      date,
      category,
      cents,
      liters: category === 'fuel' ? format.parseVolume(liters) : null,
      odometer: format.parseDistance(odometer),
      note: note.trim() || null,
    });
    router.back();
  });

  return (
    <Screen>
      <Segmented value={category} options={options} onChange={setCategory} />
      {countsAgainstProfit(category) ? null : (
        <Notice tone="accent" message={t('alreadyInCost', { context: format.distanceUnit, category: t(`category.${category}`) })} />
      )}
      <Card>
        <DateField label={t('form.dateLabel')} value={date} onChange={(next) => next && setDate(next)} />
        <MoneyField label={t('form.valueLabel')} value={value} onChangeText={setValue} error={error} />
        {category === 'fuel' ? <NumberField label={t('form.litersLabel', { context: format.volumeUnit })} value={liters} onChangeText={setLiters} /> : null}
        <NumberField label={t('form.odometerLabel')} value={odometer} onChangeText={setOdometer} suffix={format.distanceUnit} />
        <TextField label={t('form.noteLabel')} value={note} onChangeText={setNote} />
      </Card>
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label={t('common:actions.save')} busy={saving.busy} onPress={saving.submit} />
    </Screen>
  );
}
