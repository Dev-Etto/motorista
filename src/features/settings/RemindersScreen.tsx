import { useState } from 'react';
import { Alert } from 'react-native';
import { ReminderRow } from '@/data/repositories/reminderRepository';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { NumberField, TextField } from '@/shared/ui/fields';
import { Button, Card, EmptyState, ListRow, Notice, Screen } from '@/shared/ui/primitives';
import { formatDate, parseDisplayDate } from '@/shared/utils/dates';
import { formatKm } from '@/shared/utils/format';
import { decimalOrNull } from '@/shared/utils/parse';
import { useReminders } from './useReminders';

const INITIAL = { title: '', date: '', km: '' };

const describeDue = (reminder: ReminderRow) =>
  [reminder.due_date ? formatDate(reminder.due_date) : null, reminder.due_km ? formatKm(reminder.due_km) : null].filter(Boolean).join(' ou ');

export default function RemindersScreen() {
  const { reminders, add, complete, remove } = useReminders();
  const { values, bind, setValues } = useFormFields(INITIAL);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const dueDate = values.date.trim() ? parseDisplayDate(values.date) : null;
    const dueKm = decimalOrNull(values.km);
    if (!values.title.trim()) return setError('Informe o que precisa ser feito.');
    if (values.date.trim() && !dueDate) return setError('Informe a data no formato dd/mm/aaaa.');
    if (!dueDate && !dueKm) return setError('Informe uma data ou um km.');

    setError(null);
    await add(values.title.trim(), dueDate, dueKm);
    setValues(INITIAL);
  };

  const chooseAction = (reminder: ReminderRow) => {
    Alert.alert(reminder.title, describeDue(reminder), [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove(reminder) },
      { text: 'Concluir', onPress: () => complete(reminder) },
    ]);
  };

  const pending = reminders.filter((reminder) => !reminder.done);

  return (
    <Screen>
      <Card title="Novo lembrete">
        <TextField label="O que fazer" placeholder="Trocar o óleo" {...bind('title')} />
        <TextField label="Data (opcional)" placeholder="dd/mm/aaaa" keyboardType="numbers-and-punctuation" {...bind('date')} />
        <NumberField label="Km do odômetro (opcional)" suffix="km" hint="Avisa no início quando o odômetro registrado chegar nesse valor." {...bind('km')} />
        {error ? <Notice tone="negative" message={error} /> : null}
        <Button label="Adicionar" onPress={submit} />
      </Card>
      {pending.length === 0 ? (
        <EmptyState title="Nenhum lembrete" message="Crie lembretes para troca de óleo, pneus e revisões." />
      ) : (
        <Card title="Pendentes">
          {pending.map((reminder) => (
            <ListRow key={reminder.id} title={reminder.title} subtitle={describeDue(reminder)} onPress={() => chooseAction(reminder)} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
