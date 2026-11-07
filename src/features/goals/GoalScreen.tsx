import { useRouter } from 'expo-router';
import { useState } from 'react';
import { goalRepository } from '@/data/repositories/goalRepository';
import { DEFAULT_HOURS_PER_DAY, DEFAULT_WORK_WEEKDAYS } from '@/domain/goal/goal';
import { OfferTargetsEditor } from '@/features/copilot/OfferTargetsCard';
import { syncCopilotTargets } from '@/features/copilot/syncTargets';
import { useOfferTargets } from '@/features/copilot/useOfferTargets';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { useFormHydration } from '@/shared/hooks/useFormHydration';
import { useSubmit } from '@/shared/hooks/useSubmit';
import { MoneyField, NumberField } from '@/shared/ui/fields';
import { AppText, Button, Card, Collapsible, Notice, Screen } from '@/shared/ui/primitives';
import { WeekdayPicker } from '@/shared/ui/WeekdayPicker';
import { formatMonth, monthKey, today } from '@/shared/utils/dates';
import { centsToInput, parseBRL, parseDecimal } from '@/shared/utils/money';
import { GoalPlanCard } from './GoalPlanCard';
import { GoalProgressCard } from './GoalProgressCard';
import { loadGoalProgress } from './goalProgress';

export default function GoalScreen() {
  const router = useRouter();
  const date = today();
  const { data: progress, reload } = useAsyncData(() => loadGoalProgress(date), [date]);
  const targets = useOfferTargets();
  const [desired, setDesired] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(String(DEFAULT_HOURS_PER_DAY));
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WORK_WEEKDAYS);
  const [dayTarget, setDayTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFormHydration(
    progress,
    (loaded) => {
      setDesired(centsToInput(loaded.goal.desiredProfitCents));
      setWeekdays(loaded.goal.workWeekdays);
      setHoursPerDay(String(loaded.goal.hoursPerDay).replace('.', ','));
      setDayTarget(loaded.dayOverride === null ? '' : centsToInput(loaded.dayOverride));
    },
    monthKey(date),
  );

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) => (current.includes(weekday) ? current.filter((day) => day !== weekday) : [...current, weekday]));
  };

  const saving = useSubmit(async () => {
    const cents = parseBRL(desired);
    const hours = parseDecimal(hoursPerDay);
    if (!cents) return setError('Informe quanto você quer lucrar.');
    if (weekdays.length === 0) return setError('Selecione pelo menos um dia de trabalho.');
    if (!hours || hours <= 0 || hours > 24) return setError('Informe as horas por dia, de 1 a 24.');

    setError(null);
    await goalRepository.save({ month: monthKey(date), desiredProfitCents: cents, workWeekdays: weekdays, hoursPerDay: hours });
    await goalRepository.saveDayOverride(date, parseBRL(dayTarget));
    await syncCopilotTargets();
    await Promise.all([reload(), targets.reload()]);
  });

  return (
    <Screen>
      <AppText variant="title" bold>Meta de {formatMonth(date)}</AppText>
      <AppText tone="muted">Diga quanto quer lucrar no mês. O app acompanha seu lucro real e mostra o que falta, hoje e até o fim do mês.</AppText>
      <Card title="Sua meta">
        <MoneyField label="Quanto quer lucrar no mês" value={desired} onChangeText={setDesired} error={error} />
        <NumberField label="Horas de trabalho por dia" value={hoursPerDay} onChangeText={setHoursPerDay} suffix="h" />
        <AppText variant="caption" tone="muted">Dias de trabalho</AppText>
        <WeekdayPicker selected={weekdays} onToggle={toggleWeekday} />
        {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
        <Button label={progress ? 'Atualizar meta' : 'Calcular meu plano'} busy={saving.busy} onPress={saving.submit} />
      </Card>
      {progress ? <GoalProgressCard progress={progress} /> : null}
      {progress ? <GoalPlanCard progress={progress} /> : null}
      {progress ? (
        <Collapsible title="Ajustar a meta de hoje">
          <MoneyField label="Lucro que quer fazer hoje" value={dayTarget} onChangeText={setDayTarget} hint="Vale só para hoje. Em branco, o app calcula." />
          <Button label="Salvar" variant="secondary" busy={saving.busy} onPress={saving.submit} />
        </Collapsible>
      ) : null}
      <OfferTargetsEditor targets={targets} suggestion={progress?.suggestion ?? null} />
      <Button label="Concluir" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
