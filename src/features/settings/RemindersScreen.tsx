import { useState } from 'react';
import { Alert } from 'react-native';
import { ReminderRow } from '@/data/repositories/reminderRepository';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { useSubmit } from '@/shared/hooks/useSubmit';
import { DateField } from '@/shared/ui/DateField';
import { NumberField, TextField } from '@/shared/ui/fields';
import { Button, ButtonRow, Card, EmptyState, ListRow, Notice, Screen } from '@/shared/ui/primitives';
import { formatDate } from '@/shared/utils/dates';
import { formatKm } from '@/shared/utils/format';
import { decimalOrNull, hasInvalidNumber } from '@/shared/utils/parse';
import { DailyReminderCard } from './DailyReminderCard';
import { useReminders } from './useReminders';

const INITIAL = { title: '', km: '' };

function describeKm(dueKm: number, totalKm: number) {
  const remaining = dueKm - totalKm;
  return remaining > 0 ? `faltam ${formatKm(remaining)}` : 'já chegou a hora';
}

const describeDue = (reminder: ReminderRow, totalKm: number) =>
  [reminder.due_date ? formatDate(reminder.due_date) : null, reminder.due_km ? describeKm(reminder.due_km, totalKm) : null].filter(Boolean).join(' ou ');

export default function RemindersScreen() {
  const { reminders, totalKm, profile, add, complete, remove } = useReminders();
  const { values, bind, setValues } = useFormFields(INITIAL);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const saving = useSubmit(async () => {
    const dueKm = decimalOrNull(values.km);
    if (!values.title.trim()) return setError('Informe o que precisa ser feito.');
    if (hasInvalidNumber(values.km)) return setError('Confira os km. Use só números, como 10000.');
    if (!dueDate && !dueKm) return setError('Informe uma data ou os km.');

    setError(null);
    const { notifies } = await add(values.title.trim(), dueDate, dueKm);
    setWarning(notifies ? null : 'Lembrete salvo, mas sem aviso no celular. Permita as notificações do app ou escolha uma data futura.');
    setValues(INITIAL);
    setDueDate(null);
  });

  const failure = error ?? saving.error;

  const chooseAction = (reminder: ReminderRow) => {
    Alert.alert(reminder.title, describeDue(reminder, totalKm), [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove(reminder) },
      { text: 'Concluir', onPress: () => complete(reminder) },
    ]);
  };

  const pending = reminders.filter((reminder) => !reminder.done);

  return (
    <Screen>
      {warning ? <Notice tone="accent" message={warning} /> : null}
      <Card title="Novo lembrete">
        {profile ? (
          <ButtonRow>
            <Button label="Troca de óleo" variant="secondary" onPress={() => setValues({ title: 'Trocar o óleo', km: String(profile.oilIntervalKm) })} />
            <Button label="Pneus" variant="secondary" onPress={() => setValues({ title: 'Trocar os pneus', km: String(profile.tiresLifeKm) })} />
          </ButtonRow>
        ) : null}
        <TextField label="O que fazer" placeholder="Trocar o óleo" {...bind('title')} />
        <DateField label="Data (opcional)" value={dueDate} onChange={setDueDate} minimumDate={new Date()} clearable />
        <NumberField label="Daqui a quantos km (opcional)" suffix="km" hint="O app soma os km das suas jornadas e avisa no início." {...bind('km')} />
        {failure ? <Notice tone="negative" message={failure} /> : null}
        <Button label="Adicionar" busy={saving.busy} onPress={saving.submit} />
      </Card>
      <DailyReminderCard />
      {pending.length === 0 ? (
        <EmptyState title="Nenhum lembrete" message="Crie lembretes para troca de óleo, pneus e revisões." />
      ) : (
        <Card title="Pendentes">
          {pending.map((reminder) => (
            <ListRow key={reminder.id} title={reminder.title} subtitle={describeDue(reminder, totalKm)} onPress={() => chooseAction(reminder)} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
