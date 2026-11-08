import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ExpenseCategory } from '@domain/expense/expense';
import { isShiftForgotten } from '@domain/shift/forgotten';
import { KmEntryMode, SHIFT_FORM_STEPS, ShiftFormStep, stepOfError } from '@domain/shift/shiftForm';
import { ShiftEstimateCard } from '@features/offers';
import { TipBanner } from '@features/tips';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useUnsavedChangesGuard } from '@shared/hooks/useUnsavedChangesGuard';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { DateField } from '@shared/ui/DateField';
import { DurationField, IntegerField, MoneyField, NumberField } from '@shared/ui/fields';
import { FilterChips } from '@shared/ui/FilterChips';
import { PlatformBadge } from '@shared/ui/PlatformBadge';
import { AppText, Button, ButtonRow, Card, Collapsible, ListRow, Notice, Screen, Segmented, StepDots } from '@shared/ui/primitives';
import { showToast } from '@shared/ui/toast';
import { clockAfter, dayRange } from '@shared/utils/dates';
import { LiveTrackingCard } from './LiveTrackingCard';
import { ShiftResultCard } from './ShiftResultCard';
import { useLiveTracking } from './useLiveTracking';
import { JOURNEY_EXPENSES, useShiftForm } from './useShiftForm';

const KM_MODES: KmEntryMode[] = ['manual', 'odometer'];

export default function ShiftFormScreen() {
  const router = useRouter();
  const { t } = useTranslation(['shifts', 'expenses', 'common']);
  const format = useFormat();
  const colors = useTheme();
  const { id, finish } = useLocalSearchParams<{ id?: string; finish?: string }>();
  const form = useShiftForm(id ? Number(id) : undefined);
  const live = useLiveTracking(form.applyLive);
  const [measureError, setMeasureError] = useState<string | null>(null);

  const kmOptions = KM_MODES.map((value) => ({ value, label: t(`form.kmMode.${value}`) }));
  const expenseLabel = (category: ExpenseCategory) => (category === 'other' ? t('form.otherExpenses') : t(`expenses:category.${category}`));
  const finishApplied = useRef(false);
  const estimateRange = useMemo(
    () => (live.started && live.startedAt > 0 ? { from: live.startedAt, to: Number.POSITIVE_INFINITY } : dayRange(form.date)),
    [live.started, live.startedAt, form.date],
  );

  useEffect(() => {
    if (!finish || finishApplied.current || !live.started || isShiftForgotten(live.started, live.elapsedMs)) return;

    finishApplied.current = true;
    void live.apply();
  }, [finish, live]);

  const leave = useUnsavedChangesGuard(form.dirty);
  const [step, setStep] = useState<ShiftFormStep>('time');
  const [shownExpenses, setShownExpenses] = useState<ExpenseCategory[]>([]);
  const toggleExpense = (category: ExpenseCategory) =>
    setShownExpenses((current) => (current.includes(category) ? current.filter((item) => item !== category) : [...current, category]));
  const stepIndex = SHIFT_FORM_STEPS.indexOf(step);
  const moveBy = (delta: number) => setStep(SHIFT_FORM_STEPS[stepIndex + delta] ?? step);

  const showStepOfProblem = () => {
    const problem = form.validate();
    const problemStep = problem ? stepOfError(problem) : null;
    if (problemStep) setStep(problemStep);
  };

  const endsAround = form.startHour === null || form.minutes <= 0 ? null : clockAfter(form.startHour, form.minutes);

  const goNext = () => {
    const problem = form.validate();
    if (problem && stepOfError(problem) === step) return form.showProblem(problem);

    form.showProblem(null);
    moveBy(1);
  };

  const saving = useSubmit(async () => {
    if (!id && live.pending) return setMeasureError(t('form.measurePending', { context: format.distanceUnit }));

    setMeasureError(null);
    const savedId = await form.save();
    if (!savedId) return showStepOfProblem();

    showToast({ message: t('form.saved') });
    if (id) return leave(() => router.back());
    if (live.started) await live.discard();
    leave(() => router.replace(`/shift/${savedId}`));
  });

  const timeSection = (
    <>
      {id ? null : <LiveTrackingCard live={live} />}
      <Card>
        <DateField label={t('form.dateLabel')} value={form.date} onChange={(date) => date && form.setDate(date)} maximumDate={new Date()} />
        {form.vehicles.length > 1 ? (
          <FilterChips
            label={t('form.vehicleLabel')}
            value={String(form.vehicleId)}
            options={form.vehicles.map((vehicle) => ({ value: String(vehicle.id), label: vehicle.name }))}
            onChange={(vehicleId) => form.setVehicleId(Number(vehicleId))}
          />
        ) : null}
      </Card>

      <Card title={t('form.timeAndDistance')}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <IntegerField
              label={t('form.startedLabel')}
              {...form.bind('startHour')}
              maxDigits={2}
              placeholder="8"
              suffix="h"
              error={form.fieldError('startHour')}
            />
          </View>
          <View style={styles.flex}>
            <DurationField label={t('form.hoursLabel')} {...form.bind('hours')} error={form.fieldError('hours')} />
          </View>
        </View>
        <AppText variant="caption" tone="muted">
          {endsAround === null ? t('form.hoursHint') : t('form.endsAround', { time: endsAround })}
        </AppText>
        <Segmented value={form.kmMode} options={kmOptions} onChange={form.setKmMode} />
        {form.kmMode === 'manual' ? (
          <NumberField
            label={t('form.kmLabel', { context: format.distanceUnit })}
            {...form.kmField}
            suffix={format.distanceUnit}
            hint={form.kmMeasured ? t('form.kmMeasured') : undefined}
          />
        ) : (
          <>
            <NumberField label={t('form.odometerStart')} {...form.bind('odometerStart')} suffix={format.distanceUnit} />
            <NumberField label={t('form.odometerEnd')} {...form.bind('odometerEnd')} suffix={format.distanceUnit} error={form.fieldError('odometerEnd')} />
          </>
        )}
      </Card>

      <Collapsible title={t('form.moreDetails')}>
        <IntegerField label={t('form.tripsLabel')} {...form.bind('trips')} />
      </Collapsible>
    </>
  );

  const earningsSection = (
    <>
      {id ? null : <ShiftEstimateCard range={estimateRange} platforms={form.platforms} onApply={form.setEarning} />}
      <Card title={t('form.earningsTitle')}>
        {form.platforms.map((platform) => (
          <View key={platform.id} style={styles.platform}>
            <PlatformBadge name={platform.name} />
            <MoneyField label={platform.name} hideLabel value={form.earnings[platform.id] ?? ''} onChangeText={(text) => form.setEarning(platform.id, text)} />
          </View>
        ))}
        {form.preview.grossCents > 0 ? <ListRow title={t('form.earnedTotal')} value={format.money(form.preview.grossCents)} /> : null}
      </Card>
    </>
  );

  const visibleExpenses = JOURNEY_EXPENSES.filter((category) => id || shownExpenses.includes(category) || (form.expenses[category] ?? '') !== '');
  const expenseFields = visibleExpenses.map((category) => (
    <MoneyField key={category} label={expenseLabel(category)} value={form.expenses[category] ?? ''} onChangeText={(text) => form.setExpense(category, text)} />
  ));
  const expenseChips = (
    <View style={styles.chips}>
      {JOURNEY_EXPENSES.map((category) => {
        const selected = visibleExpenses.includes(category);
        return (
          <Pressable
            key={category}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => toggleExpense(category)}
            style={[styles.chip, selected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.borderStrong }]}
          >
            <AppText bold style={{ color: selected ? colors.onPrimary : colors.text }}>
              {expenseLabel(category)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
  const resultMath = t('form.resultMath', {
    gross: format.money(form.preview.grossCents),
    vehicle: format.money(form.preview.vehicleCostCents),
    expenses: format.money(form.preview.expensesCents),
  });

  const resultSection = (
    <>
      {id ? (
        <Collapsible title={t('form.expensesTitle')}>{expenseFields}</Collapsible>
      ) : (
        <Card>
          {expenseChips}
          {expenseFields}
          <AppText variant="caption" tone="muted">
            {t('form.inCostHint', { context: format.distanceUnit })}
          </AppText>
        </Card>
      )}
      {id ? null : (
        <AppText tone="muted" accessibilityLabel={resultMath}>
          {resultMath}
        </AppText>
      )}
      <ShiftResultCard result={form.preview} />
      {form.error ? <Notice tone="negative" message={form.error} /> : null}
      {measureError ? <Notice message={measureError} /> : null}
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
    </>
  );

  if (id) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t('form.editTitle') }} />
        {timeSection}
        {earningsSection}
        {resultSection}
        <Button label={t('form.saveButton')} busy={saving.busy} onPress={saving.submit} />
      </Screen>
    );
  }

  const isLast = stepIndex === SHIFT_FORM_STEPS.length - 1;

  return (
    <Screen>
      <Stack.Screen options={{ title: t('form.newTitle') }} />
      {step === 'time' ? <TipBanner id="shift" message={t('form.tip', { context: format.distanceUnit })} /> : null}
      <StepDots total={SHIFT_FORM_STEPS.length} current={stepIndex} />
      <AppText variant="caption" tone="muted">
        {t('form.stepOf', { current: stepIndex + 1, total: SHIFT_FORM_STEPS.length })}
      </AppText>
      <AppText variant="title" bold accessibilityRole="header">
        {t(`form.step.${step}`)}
      </AppText>
      {step === 'time' ? timeSection : null}
      {step === 'earnings' ? earningsSection : null}
      {step === 'result' ? resultSection : null}
      <ButtonRow>
        {stepIndex > 0 ? <Button label={t('common:actions.back')} variant="secondary" onPress={() => moveBy(-1)} /> : null}
        {isLast ? (
          <Button label={t('form.saveButton')} busy={saving.busy} onPress={saving.submit} />
        ) : (
          <Button label={t('common:actions.continue')} onPress={goNext} />
        )}
      </ButtonRow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  platform: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: MIN_TOUCH_TARGET - spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1 },
});
