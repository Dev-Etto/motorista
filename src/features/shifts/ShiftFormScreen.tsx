import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { ExpenseCategory } from '@domain/expense/expense';
import { KmEntryMode } from '@domain/shift/shiftForm';
import { ShiftEstimateCard } from '@features/offers';
import { TipBanner } from '@features/tips';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { DateField } from '@shared/ui/DateField';
import { DurationField, IntegerField, MoneyField, NumberField } from '@shared/ui/fields';
import { FilterChips } from '@shared/ui/FilterChips';
import { PlatformBadge } from '@shared/ui/PlatformBadge';
import { Button, Card, Collapsible, Notice, Screen, Segmented } from '@shared/ui/primitives';
import { dayRange } from '@shared/utils/dates';
import { LiveTrackingCard } from './LiveTrackingCard';
import { ShiftResultCard } from './ShiftResultCard';
import { useLiveTracking } from './useLiveTracking';
import { JOURNEY_EXPENSES, useShiftForm } from './useShiftForm';

const KM_MODES: KmEntryMode[] = ['manual', 'odometer'];

export default function ShiftFormScreen() {
  const router = useRouter();
  const { t } = useTranslation(['shifts', 'expenses']);
  const format = useFormat();
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
    if (!finish || finishApplied.current || !live.started) return;

    finishApplied.current = true;
    void live.apply();
  }, [finish, live]);

  const saving = useSubmit(async () => {
    if (!id && live.pending) return setMeasureError(t('form.measurePending', { context: format.distanceUnit }));

    setMeasureError(null);
    const saved = await form.save();
    if (!saved) return;

    if (!id && live.started) await live.discard();
    router.back();
  });

  return (
    <Screen>
      <TipBanner id="shift" message={t('form.tip', { context: format.distanceUnit })} />
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
        <DurationField label={t('form.hoursLabel')} {...form.bind('hours')} hint={t('form.hoursHint')} />
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
            <NumberField label={t('form.odometerEnd')} {...form.bind('odometerEnd')} suffix={format.distanceUnit} />
          </>
        )}
      </Card>

      {id ? null : <ShiftEstimateCard range={estimateRange} platforms={form.platforms} onApply={form.setEarning} />}

      <Card title={t('form.earningsTitle')}>
        {form.platforms.map((platform) => (
          <View key={platform.id} style={styles.platform}>
            <PlatformBadge name={platform.name} />
            <MoneyField label={platform.name} hideLabel value={form.earnings[platform.id] ?? ''} onChangeText={(text) => form.setEarning(platform.id, text)} />
          </View>
        ))}
      </Card>

      <Collapsible title={t('form.expensesTitle')}>
        {JOURNEY_EXPENSES.map((category) => (
          <MoneyField
            key={category}
            label={expenseLabel(category)}
            value={form.expenses[category] ?? ''}
            onChangeText={(text) => form.setExpense(category, text)}
          />
        ))}
      </Collapsible>

      <Collapsible title={t('form.moreDetails')}>
        <IntegerField label={t('form.startHourLabel')} {...form.bind('startHour')} maxDigits={2} placeholder="8" hint={t('form.startHourHint')} />
        <IntegerField label={t('form.tripsLabel')} {...form.bind('trips')} />
      </Collapsible>

      <ShiftResultCard result={form.preview} />
      {form.error ? <Notice tone="negative" message={form.error} /> : null}
      {measureError ? <Notice message={measureError} /> : null}
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label={t('form.saveButton')} busy={saving.busy} onPress={saving.submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  platform: { gap: spacing.xs },
});
