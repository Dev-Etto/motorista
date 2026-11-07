import { useState } from 'react';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { useSubmit } from '@/shared/hooks/useSubmit';
import { Card, Notice, Segmented, ToggleRow } from '@/shared/ui/primitives';
import { cancelDailyReminder, scheduleDailyReminder } from './reminderNotifications';

const DEFAULT_HOUR = '20';
const HOUR_OPTIONS = [
  { value: '18', label: '18h' },
  { value: '20', label: '20h' },
  { value: '22', label: '22h' },
];

export function DailyReminderCard() {
  const { data: hour, reload } = useAsyncData(() => settingsRepository.get(SETTING_KEYS.dailyReminderHour));
  const [denied, setDenied] = useState(false);

  const schedule = async (value: string) => {
    setDenied(!(await scheduleDailyReminder(Number(value))));
    await reload();
  };

  const scheduling = useSubmit(schedule);

  const toggling = useSubmit(async (enabled: boolean) => {
    if (enabled) return schedule(DEFAULT_HOUR);

    await cancelDailyReminder();
    setDenied(false);
    await reload();
  });

  const failure = toggling.error ?? scheduling.error;

  return (
    <Card title="Fim do dia">
      <ToggleRow label="Lembrar de registrar a jornada" hint="Um aviso por dia, no horário que você escolher." value={Boolean(hour)} onChange={toggling.submit} />
      {hour ? <Segmented value={hour} options={HOUR_OPTIONS} onChange={scheduling.submit} /> : null}
      {failure ? <Notice tone="negative" message={failure} /> : null}
      {denied ? <Notice message="Permita as notificações do app para receber o lembrete." /> : null}
    </Card>
  );
}
