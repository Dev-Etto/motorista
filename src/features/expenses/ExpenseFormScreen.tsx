import { useRouter } from 'expo-router';
import { useState } from 'react';
import { expenseRepository } from '@/data/repositories/expenseRepository';
import { countsAgainstProfit, EXPENSE_LABELS, type ExpenseCategory } from '@/domain/expense/expense';
import { useSubmit } from '@/shared/hooks/useSubmit';
import { DateField } from '@/shared/ui/DateField';
import { MoneyField, NumberField, TextField } from '@/shared/ui/fields';
import { Button, Card, Notice, Screen, Segmented } from '@/shared/ui/primitives';
import { today } from '@/shared/utils/dates';
import { centsOrNull, decimalOrNull, hasInvalidNumber } from '@/shared/utils/parse';

type LooseCategory = 'fuel' | 'maintenance' | 'other';

const OPTIONS: { value: LooseCategory; label: string }[] = [
  { value: 'fuel', label: 'Abastecer' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'other', label: 'Outra' },
];

export default function ExpenseFormScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [date, setDate] = useState(today());
  const [value, setValue] = useState('');
  const [liters, setLiters] = useState('');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const saving = useSubmit(async () => {
    const cents = centsOrNull(value);
    if (!cents) return setError('Informe um valor maior que zero.');
    if (hasInvalidNumber(liters) || hasInvalidNumber(odometer)) return setError('Confira os números digitados. Use só números, como 45,5.');

    await expenseRepository.add({
      date,
      category,
      cents,
      liters: category === 'fuel' ? decimalOrNull(liters) : null,
      odometer: decimalOrNull(odometer),
      note: note.trim() || null,
    });
    router.back();
  });

  return (
    <Screen>
      <Segmented value={category as LooseCategory} options={OPTIONS} onChange={setCategory} />
      {countsAgainstProfit(category) ? null : (
        <Notice tone="accent" message={`${EXPENSE_LABELS[category]} já está no custo por km. O valor serve para comparar o previsto com o pago.`} />
      )}
      <Card>
        <DateField label="Data" value={date} onChange={(next) => next && setDate(next)} />
        <MoneyField label="Valor" value={value} onChangeText={setValue} error={error} />
        {category === 'fuel' ? <NumberField label="Litros (opcional)" value={liters} onChangeText={setLiters} /> : null}
        <NumberField label="Odômetro (opcional)" value={odometer} onChangeText={setOdometer} suffix="km" />
        <TextField label="Observação (opcional)" value={note} onChangeText={setNote} />
      </Card>
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label="Salvar" busy={saving.busy} onPress={saving.submit} />
    </Screen>
  );
}
