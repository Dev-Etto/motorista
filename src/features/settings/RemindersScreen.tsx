import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormFields } from '@shared/hooks/useFormFields';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { DateField } from '@shared/ui/DateField';
import { showDialog } from '@shared/ui/dialog';
import { NumberField, TextField } from '@shared/ui/fields';
import { Button, ButtonRow, Card, EmptyState, ListRow, Notice, Screen } from '@shared/ui/primitives';
import { DailyReminderCard } from './DailyReminderCard';
import { describeReminderDue } from './describeReminderDue';
import { Reminder, useReminders } from './useReminders';

const INITIAL = { title: '', km: '' };

export default function RemindersScreen() {
  const { state, reminders, kmOf, profile, add, complete, remove } = useReminders();
  const { values, bind, setValues } = useFormFields(INITIAL);
  const { t } = useTranslation(['settings', 'common']);
  const format = useFormat();
  const unitContext = { context: format.distanceUnit };
  const describeDue = (reminder: Reminder) => describeReminderDue(reminder, kmOf(reminder), t, format);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const saving = useSubmit(async () => {
    const dueKm = format.parseDistance(values.km);
    if (!values.title.trim()) return setError(t('reminders.missingTitle'));
    if (format.hasInvalidNumber(values.km)) return setError(t('reminders.invalidDistance', { ...unitContext, example: format.decimalInput(10000, 0) }));
    if (!dueDate && !dueKm) return setError(t('reminders.missingDue', unitContext));

    setError(null);
    const { notifies } = await add(values.title.trim(), dueDate, dueKm);
    setWarning(notifies ? null : t('reminders.noNotification'));
    setValues(INITIAL);
    setDueDate(null);
  });

  const failure = error ?? saving.error;

  const chooseAction = (reminder: Reminder) => {
    showDialog({
      title: reminder.title,
      message: describeDue(reminder),
      actions: [
        { label: t('common:actions.done'), onPress: () => complete(reminder) },
        { label: t('common:actions.delete'), tone: 'danger', onPress: () => remove(reminder) },
        { label: t('common:actions.cancel'), tone: 'secondary' },
      ],
    });
  };

  const pending = reminders.filter((reminder) => !reminder.done);

  return (
    <Screen>
      {warning ? <Notice tone="accent" message={warning} /> : null}
      <Card title={t('reminders.newTitle')}>
        {profile ? (
          <ButtonRow>
            <Button
              label={t('reminders.oilButton')}
              variant="secondary"
              onPress={() => setValues({ title: t('reminders.oilTask'), km: format.distanceInput(profile.oilIntervalKm, 0) })}
            />
            <Button
              label={t('reminders.tiresButton')}
              variant="secondary"
              onPress={() => setValues({ title: t('reminders.tiresTask'), km: format.distanceInput(profile.tiresLifeKm, 0) })}
            />
          </ButtonRow>
        ) : null}
        <TextField label={t('reminders.titleLabel')} placeholder={t('reminders.titlePlaceholder')} {...bind('title')} />
        <DateField label={t('reminders.dateLabel')} value={dueDate} onChange={setDueDate} minimumDate={new Date()} clearable />
        <NumberField
          label={t('reminders.distanceLabel', unitContext)}
          suffix={format.distanceUnit}
          hint={t('reminders.distanceHint', unitContext)}
          {...bind('km')}
        />
        {failure ? <Notice tone="negative" message={failure} /> : null}
        <Button label={t('common:actions.add')} busy={saving.busy} onPress={saving.submit} />
      </Card>
      <DailyReminderCard />
      <AsyncBoundary state={state}>
        {() =>
          pending.length === 0 ? (
            <EmptyState title={t('reminders.emptyTitle')} message={t('reminders.emptyMessage')} />
          ) : (
            <Card title={t('reminders.pendingTitle')}>
              {pending.map((reminder) => (
                <ListRow key={reminder.id} title={reminder.title} subtitle={describeDue(reminder)} onPress={() => chooseAction(reminder)} />
              ))}
            </Card>
          )
        }
      </AsyncBoundary>
    </Screen>
  );
}
