import { useRouter } from 'expo-router';
import { useState } from 'react';
import { expenseRepository } from '@/data/repositories/expenseRepository';
import { countsAgainstProfit, EXPENSE_LABELS, ExpenseCategory } from '@/domain/expense/expense';
import { MoneyField, NumberField, TextField } from '@/shared/ui/fields';
import { Button, Card, Notice, Screen, Segmented } from '@/shared/ui/primitives';
import { formatDate, parseDisplayDate, today } from '@/shared/utils/dates';
import { parseBRL } from '@/shared/utils/money';
import { decimalOrNull } from '@/shared/utils/parse';

type LooseCategory = 'fuel' | 'maintenance' | 'other';

const OPTIONS: { value: LooseCategory; label: string }[] = [
  { value: 'fuel', label: 'Abastecer' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'other', label: 'Outra' },
];

export default function ExpenseFormScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [date, setDate] = useState(formatDate(today()));
  const [value, setValue] = useState('');
  const [liters, setLiters] = useState('');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const iso = parseDisplayDate(date);
    const cents = parseBRL(value);
    if (!iso) return setError('Informe a data no formato dd/mm/aaaa.');
    if (!cents) return setError('Informe um valor maior que zero.');

    await expenseRepository.add({
      date: iso,
      category,
      cents,
      liters: category === 'fuel' ? decimalOrNull(liters) : null,
      odometer: decimalOrNull(odometer),
      note: note.trim() || null,
    });
    router.back();
  };

  return (
    <Screen>
      <Segmented value={category as LooseCategory} options={OPTIONS} onChange={setCategory} />
      {countsAgainstProfit(category) ? null : (
        <Notice tone="accent" message={`${EXPENSE_LABELS[category]} já está no custo por km. O valor serve para comparar o previsto com o pago.`} />
      )}
      <Card>
        <TextField label="Data" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
        <MoneyField label="Valor" value={value} onChangeText={setValue} error={error} />
        {category === 'fuel' ? <NumberField label="Litros (opcional)" value={liters} onChangeText={setLiters} /> : null}
        <NumberField label="Odômetro (opcional)" value={odometer} onChangeText={setOdometer} suffix="km" />
        <TextField label="Observação (opcional)" value={note} onChangeText={setNote} />
      </Card>
      <Button label="Salvar" onPress={save} />
    </Screen>
  );
}
