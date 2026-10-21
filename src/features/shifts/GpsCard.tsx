import { AppText, Button, ButtonRow, Card, Notice } from '@/shared/ui/primitives';
import { formatKm } from '@/shared/utils/format';
import { useGpsTracking } from './useGpsTracking';

export function GpsCard({ appliedKm, onApply }: { appliedKm: number; onApply: (km: number) => void }) {
  const gps = useGpsTracking();

  const applyValue = async () => {
    await gps.pause();
    onApply(appliedKm + gps.km);
    await gps.reset();
  };

  return (
    <Card title="Medição por GPS">
      <AppText variant="title" bold>{formatKm(gps.km)}</AppText>
      <AppText variant="caption" tone="muted">Fica só no aparelho, e você revisa antes de salvar.</AppText>
      {appliedKm > 0 ? <Notice tone="positive" message={`Nesta jornada: ${formatKm(appliedKm)}.`} /> : null}
      {gps.error ? <Notice tone="negative" message={gps.error} /> : null}
      <ButtonRow>
        {gps.running ? (
          <Button label="Pausar" variant="secondary" onPress={gps.pause} />
        ) : (
          <Button label={gps.km > 0 ? 'Retomar' : 'Iniciar'} onPress={gps.start} />
        )}
        {gps.km > 0 ? <Button label="Usar estes km" variant="secondary" onPress={applyValue} /> : null}
      </ButtonRow>
    </Card>
  );
}
