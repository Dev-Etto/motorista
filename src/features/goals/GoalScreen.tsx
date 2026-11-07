import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadGoalProgress } from '@application/goalProgress';
import { DEFAULT_HOURS_PER_DAY, DEFAULT_WORK_WEEKDAYS } from '@domain/goal/goal';
import { OfferTargetsEditor, useOfferTargets } from '@features/copilot';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useFormHydration } from '@shared/hooks/useFormHydration';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { MoneyField, NumberField } from '@shared/ui/fields';
import { AppText, Button, Card, Collapsible, Notice, Screen } from '@shared/ui/primitives';
import { WeekdayPicker } from '@shared/ui/WeekdayPicker';
import { monthKey, today } from '@shared/utils/dates';
import { GoalPlanCard } from './GoalPlanCard';
import { GoalProgressCard } from './GoalProgressCard';
import { saveGoal } from './saveGoal';

const MIN_HOURS_PER_DAY = 1;
const MAX_HOURS_PER_DAY = 24;
const EXAMPLE_DAY_TARGET_CENTS = 15050;

export default function GoalScreen() {
  const router = useRouter();
  const { t } = useTranslation(['goals', 'common']);
  const format = useFormat();
  const date = today();
  const goal = useAsyncData(() => loadGoalProgress(date), [date]);
  const { data: progress, reload } = goal;
  const targets = useOfferTargets();
  const [desired, setDesired] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(String(DEFAULT_HOURS_PER_DAY));
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WORK_WEEKDAYS);
  const [dayTarget, setDayTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFormHydration(
    progress,
    (loaded) => {
      setDesired(format.moneyInput(loaded.goal.desiredProfitCents));
      setWeekdays(loaded.goal.workWeekdays);
      setHoursPerDay(format.decimalInput(loaded.goal.hoursPerDay));
      setDayTarget(loaded.dayOverride === null ? '' : format.moneyInput(loaded.dayOverride));
    },
    monthKey(date),
  );

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) => (current.includes(weekday) ? current.filter((day) => day !== weekday) : [...current, weekday]));
  };

  const saving = useSubmit(async () => {
    const cents = format.parseCents(desired);
    const hours = format.parseDecimal(hoursPerDay);
    if (!cents) return setError(t('screen.errors.desired'));
    if (weekdays.length === 0) return setError(t('screen.errors.weekdays'));
    if (!hours || hours <= 0 || hours > MAX_HOURS_PER_DAY) return setError(t('screen.errors.hours', { min: MIN_HOURS_PER_DAY, max: MAX_HOURS_PER_DAY }));
    if (format.hasInvalidNumber(dayTarget)) return setError(t('screen.errors.dayTarget', { example: format.moneyInput(EXAMPLE_DAY_TARGET_CENTS) }));

    setError(null);
    await saveGoal({ month: monthKey(date), desiredProfitCents: cents, workWeekdays: weekdays, hoursPerDay: hours }, date, format.parseCents(dayTarget));
    await Promise.all([reload(), targets.reload()]);
  });

  return (
    <Screen>
      <AppText variant="title" bold>
        {t('screen.title', { month: format.month(date) })}
      </AppText>
      <AppText tone="muted">{t('screen.intro')}</AppText>
      <Card title={t('screen.goalTitle')}>
        <MoneyField label={t('screen.desired')} value={desired} onChangeText={setDesired} error={error} />
        <NumberField label={t('screen.hoursPerDay')} value={hoursPerDay} onChangeText={setHoursPerDay} suffix="h" decimals={1} />
        <AppText variant="caption" tone="muted">
          {t('screen.workDays')}
        </AppText>
        <WeekdayPicker selected={weekdays} onToggle={toggleWeekday} />
        {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
        <Button label={progress ? t('screen.update') : t('screen.calculate')} busy={saving.busy} onPress={saving.submit} />
      </Card>
      <AsyncBoundary state={goal}>
        {(loaded) => (
          <>
            <GoalProgressCard progress={loaded} />
            <GoalPlanCard progress={loaded} />
            <Collapsible title={t('screen.adjustToday')}>
              <MoneyField label={t('screen.todayProfit')} value={dayTarget} onChangeText={setDayTarget} hint={t('screen.todayProfitHint')} />
              <Button label={t('common:actions.save')} variant="secondary" busy={saving.busy} onPress={saving.submit} />
            </Collapsible>
          </>
        )}
      </AsyncBoundary>
      <OfferTargetsEditor targets={targets} suggestion={progress?.suggestion ?? null} />
      <Button label={t('common:actions.done')} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
