import { useLocalSearchParams, useRouter } from 'expo-router';
import { KmSource } from '@/data/repositories/shiftRepository';
import { MoneyField, NumberField, TextField } from '@/shared/ui/fields';
import { Button, Card, Notice, Screen, Segmented } from '@/shared/ui/primitives';
import { GpsCard } from './GpsCard';
import { ShiftResultCard } from './ShiftResultCard';
import { TimerCard } from './TimerCard';
import { JOURNEY_EXPENSES, useShiftForm } from './useShiftForm';

const KM_OPTIONS: { value: KmSource; label: string }[] = [
  { value: 'manual', label: 'Total' },
  { value: 'odometer', label: 'Odômetro' },
  { value: 'gps', label: 'GPS' },
];

export default function ShiftFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const form = useShiftForm(id ? Number(id) : undefined);

  const handleSave = async () => {
    const saved = await form.save();
    if (saved) router.back();
  };

  return (
    <Screen>
      <TimerCard onApply={form.applyTimer} />

      <Card title="Quando">
        <TextField label="Data" value={form.date} onChangeText={form.setDate} placeholder="dd/mm/aaaa" keyboardType="numbers-and-punctuation" />
        <NumberField label="Horas trabalhadas" value={form.hours} onChangeText={form.setHours} suffix="h" placeholder="8,5" />
        <NumberField label="Hora de início (opcional)" value={form.startHour} onChangeText={form.setStartHour} placeholder="8" hint="Ajuda a descobrir seu melhor período." />
      </Card>

      <Card title="Ganhos por plataforma">
        {form.platforms.map((platform) => (
          <MoneyField
            key={platform.id}
            label={platform.name}
            value={form.earnings[platform.id] ?? ''}
            onChangeText={(text) => form.setEarning(platform.id, text)}
          />
        ))}
        <NumberField label="Corridas (opcional)" value={form.trips} onChangeText={form.setTrips} />
      </Card>

      <Card title="Quilômetros">
        <Segmented value={form.kmMode} options={KM_OPTIONS} onChange={form.setKmMode} />
        {form.kmMode === 'manual' ? (
          <NumberField label="Km rodados" value={form.kmText} onChangeText={form.setKmText} suffix="km" />
        ) : null}
        {form.kmMode === 'odometer' ? (
          <>
            <NumberField label="Odômetro inicial" value={form.odometerStart} onChangeText={form.setOdometerStart} suffix="km" />
            <NumberField label="Odômetro final" value={form.odometerEnd} onChangeText={form.setOdometerEnd} suffix="km" />
          </>
        ) : null}
      </Card>
      {form.kmMode === 'gps' ? <GpsCard appliedKm={form.gpsKm} onApply={form.applyGpsKm} /> : null}

      <Card title="Despesas do dia">
        {JOURNEY_EXPENSES.map(({ category, label }) => (
          <MoneyField key={category} label={label} value={form.expenses[category] ?? ''} onChangeText={(text) => form.setExpense(category, text)} />
        ))}
      </Card>

      <ShiftResultCard result={form.preview} />
      {form.error ? <Notice tone="negative" message={form.error} /> : null}
      <Button label="Salvar jornada" onPress={handleSave} />
    </Screen>
  );
}
