import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { goalRepository } from '@/data/repositories/goalRepository';
import { DEFAULT_WORK_WEEKDAYS } from '@/domain/goal/goal';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { MoneyField } from '@/shared/ui/fields';
import { AppText, Button, Card, Screen, ToggleRow } from '@/shared/ui/primitives';
import { formatMonth, monthKey, today, weekdayName } from '@/shared/utils/dates';
import { centsToInput, parseBRL } from '@/shared/utils/money';
import { GoalProgressCard } from './GoalProgressCard';
import { loadGoalProgress } from './goalProgress';

const WEEKDAY_INDEXES = [1, 2, 3, 4, 5, 6, 0];

export default function GoalScreen() {
  const router = useRouter();
  const date = today();
  const { data: progress } = useAsyncData(() => loadGoalProgress(date), [date]);
  const [desired, setDesired] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WORK_WEEKDAYS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!progress) return;
    setDesired(centsToInput(progress.goal.desiredProfitCents));
    setWeekdays(progress.goal.workWeekdays);
  }, [progress]);

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) => (current.includes(weekday) ? current.filter((day) => day !== weekday) : [...current, weekday]));
  };

  const save = async () => {
    const cents = parseBRL(desired);
    if (!cents) return setError('Informe um lucro maior que zero.');
    if (weekdays.length === 0) return setError('Selecione pelo menos um dia de trabalho.');

    await goalRepository.save({ month: monthKey(date), desiredProfitCents: cents, workWeekdays: weekdays });
    router.back();
  };

  return (
    <Screen>
      <AppText variant="title" bold>Meta de {formatMonth(date)}</AppText>
      {progress ? <GoalProgressCard progress={progress} /> : null}
      <Card title="Quanto você quer lucrar?">
        <MoneyField label="Lucro desejado no mês" value={desired} onChangeText={setDesired} error={error} />
      </Card>
      <Card title="Dias de trabalho">
        {WEEKDAY_INDEXES.map((weekday) => (
          <ToggleRow key={weekday} label={weekdayName(weekday)} value={weekdays.includes(weekday)} onChange={() => toggleWeekday(weekday)} />
        ))}
      </Card>
      <Button label="Salvar meta" onPress={save} />
    </Screen>
  );
}
