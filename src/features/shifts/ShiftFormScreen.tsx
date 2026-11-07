import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KmEntryMode } from '@/domain/shift/shiftForm';
import { ShiftEstimateCard } from '@/features/offers';
import { TipBanner } from '@/features/tips';
import { useSubmit } from '@/shared/hooks/useSubmit';
import { spacing } from '@/shared/theme/theme';
import { DateField } from '@/shared/ui/DateField';
import { MoneyField, NumberField } from '@/shared/ui/fields';
import { PlatformBadge } from '@/shared/ui/PlatformBadge';
import { Button, Card, Collapsible, Notice, Screen, Segmented } from '@/shared/ui/primitives';
import { dayRange } from '@/shared/utils/dates';
import { LiveTrackingCard } from './LiveTrackingCard';
import { ShiftResultCard } from './ShiftResultCard';
import { useLiveTracking } from './useLiveTracking';
import { JOURNEY_EXPENSES, useShiftForm } from './useShiftForm';

const KM_OPTIONS: { value: KmEntryMode; label: string }[] = [
  { value: 'manual', label: 'Total' },
  { value: 'odometer', label: 'Odômetro' },
];

export default function ShiftFormScreen() {
  const router = useRouter();
  const { id, finish } = useLocalSearchParams<{ id?: string; finish?: string }>();
  const form = useShiftForm(id ? Number(id) : undefined);
  const live = useLiveTracking(form.applyLive);
  const [measureError, setMeasureError] = useState<string | null>(null);

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
    if (!id && live.pending)
      return setMeasureError('Você tem uma medição em andamento. Toque em Usar no registro para levar o tempo e os km, ou descarte a medição.');

    setMeasureError(null);
    const saved = await form.save();
    if (!saved) return;

    if (!id && live.started) await live.discard();
    router.back();
  });

  return (
    <Screen>
      <TipBanner id="shift" message="Registre com o carro parado. Só ganhos, km e horas já bastam para ver o lucro." />
      {id ? null : <LiveTrackingCard live={live} />}

      <Card title="Tempo e distância">
        <NumberField label="Horas trabalhadas" {...form.bind('hours')} suffix="h" placeholder="8,5" />
        <Segmented value={form.kmMode} options={KM_OPTIONS} onChange={form.setKmMode} />
        {form.kmMode === 'manual' ? (
          <NumberField label="Km rodados" {...form.kmField} suffix="km" hint={form.kmMeasured ? 'Medido por GPS. Você pode ajustar.' : undefined} />
        ) : (
          <>
            <NumberField label="Odômetro inicial" {...form.bind('odometerStart')} suffix="km" />
            <NumberField label="Odômetro final" {...form.bind('odometerEnd')} suffix="km" />
          </>
        )}
      </Card>

      {id ? null : <ShiftEstimateCard range={estimateRange} platforms={form.platforms} onApply={form.setEarning} />}

      <Card title="Ganhos por plataforma">
        {form.platforms.map((platform) => (
          <View key={platform.id} style={styles.platform}>
            <PlatformBadge name={platform.name} />
            <MoneyField label={platform.name} hideLabel value={form.earnings[platform.id] ?? ''} onChangeText={(text) => form.setEarning(platform.id, text)} />
          </View>
        ))}
      </Card>

      <Card>
        <DateField label="Data" value={form.date} onChange={(date) => date && form.setDate(date)} maximumDate={new Date()} />
      </Card>

      <Collapsible title="Despesas do dia">
        {JOURNEY_EXPENSES.map(({ category, label }) => (
          <MoneyField key={category} label={label} value={form.expenses[category] ?? ''} onChangeText={(text) => form.setExpense(category, text)} />
        ))}
      </Collapsible>

      <Collapsible title="Mais detalhes">
        <NumberField label="Hora de início" {...form.bind('startHour')} placeholder="8" hint="Ajuda a descobrir seu melhor período." />
        <NumberField label="Corridas" {...form.bind('trips')} />
      </Collapsible>

      <ShiftResultCard result={form.preview} />
      {form.error ? <Notice tone="negative" message={form.error} /> : null}
      {measureError ? <Notice message={measureError} /> : null}
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label="Salvar jornada" busy={saving.busy} onPress={saving.submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  platform: { gap: spacing.xs },
});
