import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { Card, Notice, Segmented, ToggleRow } from '@shared/ui/primitives';
import { cancelDailyReminder, scheduleDailyReminder } from './reminderNotifications';
import { useDailyReminderHour } from './useDailyReminderHour';

const DEFAULT_HOUR = '20';
const HOURS = [18, 20, 22];

export function DailyReminderCard() {
  const { data: hour, reload } = useDailyReminderHour();
  const { t } = useTranslation('settings');
  const format = useFormat();
  const hourOptions = HOURS.map((value) => ({ value: String(value), label: format.hourOfDay(value) }));
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
    <Card title={t('dailyReminder.title')}>
      <ToggleRow label={t('dailyReminder.toggleLabel')} hint={t('dailyReminder.toggleHint')} value={Boolean(hour)} onChange={toggling.submit} />
      {hour ? <Segmented value={hour} options={hourOptions} onChange={scheduling.submit} /> : null}
      {failure ? <Notice tone="negative" message={failure} /> : null}
      {denied ? <Notice message={t('dailyReminder.denied')} /> : null}
    </Card>
  );
}
