import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadGoalProgress, planVehicleName } from '@application/goalProgress';
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
import { GoalFormErrors, hasGoalErrors, MAX_HOURS_PER_DAY, MIN_HOURS_PER_DAY, validateGoalForm } from './goalForm';
import { GoalPlanCard } from './GoalPlanCard';
import { GoalProgressCard } from './GoalProgressCard';
import { saveGoal } from './saveGoal';

const EXAMPLE_DAY_TARGET_CENTS = 15050;

export default function GoalScreen() {
  const router = useRouter();
  const { t } = useTranslation(['goals', 'common']);
  const format = useFormat();
  const date = today();
  const goal = useAsyncData(() => loadGoalProgress(date), [date]);
  const { data: progress, reload } = goal;
  const targets = useOfferTargets();
  const { data: vehicleName } = useAsyncData(planVehicleName, []);
  const [desired, setDesired] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(String(DEFAULT_HOURS_PER_DAY));
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WORK_WEEKDAYS);
  const [dayTarget, setDayTarget] = useState('');
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const month = monthKey(date);
  const carriedFrom = progress && progress.goal.month !== month ? progress.goal.month : null;

  useFormHydration(
    progress,
    (loaded) => {
      setDesired(format.moneyInput(loaded.goal.desiredProfitCents));
      setWeekdays(loaded.goal.workWeekdays);
      setHoursPerDay(format.decimalInput(loaded.goal.hoursPerDay));
      setDayTarget(loaded.dayOverride === null ? '' : format.moneyInput(loaded.dayOverride));
    },
    month,
  );

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) => (current.includes(weekday) ? current.filter((day) => day !== weekday) : [...current, weekday]));
  };

  const save = async (): Promise<boolean> => {
    const found = validateGoalForm({ desired, hoursPerDay, weekdays, dayTarget }, format);
    setErrors(found);
    if (hasGoalErrors(found)) return false;

    const goalInput = {
      month,
      desiredProfitCents: format.parseCents(desired) ?? 0,
      workWeekdays: weekdays,
      hoursPerDay: format.parseDecimal(hoursPerDay) ?? 0,
    };
    await saveGoal(goalInput, date, format.parseCents(dayTarget));
    await Promise.all([reload(), targets.reload()]);
    return true;
  };

  const saving = useSubmit(save);
  const finishing = useSubmit(async () => {
    if (!desired.trim() || (await save())) router.back();
  });

  return (
    <Screen>
      <AppText variant="title" bold>
        {t('screen.title', { month: format.month(date) })}
      </AppText>
      <AppText tone="muted">{t('screen.intro')}</AppText>
      {vehicleName ? <Notice tone="accent" message={t('screen.planVehicle', { name: vehicleName })} /> : null}
      {carriedFrom ? <Notice tone="accent" message={t('screen.carried', { month: format.month(`${carriedFrom}-01`) })} /> : null}
      <Card title={t('screen.goalTitle')}>
        <MoneyField label={t('screen.desired')} value={desired} onChangeText={setDesired} error={errors.desired ? t('screen.errors.desired') : null} />
        <NumberField
          label={t('screen.hoursPerDay')}
          value={hoursPerDay}
          onChangeText={setHoursPerDay}
          suffix="h"
          decimals={1}
          error={errors.hoursPerDay ? t('screen.errors.hours', { min: MIN_HOURS_PER_DAY, max: MAX_HOURS_PER_DAY }) : null}
        />
        <AppText variant="caption" tone="muted">
          {t('screen.workDays')}
        </AppText>
        <WeekdayPicker selected={weekdays} onToggle={toggleWeekday} />
        {errors.weekdays ? <Notice tone="negative" message={t('screen.errors.weekdays')} /> : null}
        {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
        <Button label={progress ? t('screen.update') : t('screen.calculate')} busy={saving.busy} onPress={saving.submit} />
      </Card>
      <AsyncBoundary state={goal}>
        {(loaded) => (
          <>
            <GoalProgressCard progress={loaded} />
            <GoalPlanCard progress={loaded} />
            <Collapsible title={t('screen.adjustToday')}>
              <MoneyField
                label={t('screen.todayProfit')}
                value={dayTarget}
                onChangeText={setDayTarget}
                hint={t('screen.todayProfitHint')}
                error={errors.dayTarget ? t('screen.errors.dayTarget', { example: format.moneyInput(EXAMPLE_DAY_TARGET_CENTS) }) : null}
              />
              <Button label={t('common:actions.save')} variant="secondary" busy={saving.busy} onPress={saving.submit} />
            </Collapsible>
          </>
        )}
      </AsyncBoundary>
      <OfferTargetsEditor targets={targets} suggestion={progress?.suggestion ?? null} />
      {finishing.error ? <Notice tone="negative" message={finishing.error} /> : null}
      <Button label={t('common:actions.done')} variant="secondary" busy={finishing.busy} onPress={finishing.submit} />
    </Screen>
  );
}
