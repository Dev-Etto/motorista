import { StyleSheet, View } from 'react-native';
import { spacing } from '@/shared/theme/theme';
import { AppText, Button, ButtonRow, Card, Notice, ToggleRow } from '@/shared/ui/primitives';
import { confirmAction } from '@/shared/utils/confirm';
import { formatClock } from '@/shared/utils/dates';
import { formatNumber } from '@/shared/utils/money';
import { LiveTrackingState } from './useLiveTracking';

function cardTitle({ started, running }: LiveTrackingState) {
  if (!started) return 'Medir agora';
  return running ? 'Jornada em andamento' : 'Jornada pausada';
}

export function LiveTrackingCard({ live }: { live: LiveTrackingState }) {
  const confirmDiscard = () => {
    confirmAction({
      title: 'Descartar medição?',
      message: 'O tempo e os km medidos serão apagados.',
      actionLabel: 'Descartar',
      onConfirm: live.discard,
    });
  };

  return (
    <Card title={cardTitle(live)}>
      <View style={styles.measures}>
        <View style={styles.measure}>
          <AppText variant="caption" tone="muted" center>Tempo</AppText>
          <AppText variant="title" bold center>{formatClock(live.elapsedMs)}</AppText>
        </View>
        <View style={styles.measure}>
          <AppText variant="caption" tone="muted" center>Distância</AppText>
          <AppText variant="title" bold center>{formatNumber(live.km)} km</AppText>
        </View>
      </View>
      {live.started && !live.running ? null : (
        <ToggleRow label="Medir km por GPS" hint="A posição fica só no celular. Em deslocamentos pessoais, é só pausar." value={live.measureKm} onChange={live.toggleMeasureKm} />
      )}
      {live.gpsError ? <Notice message={live.gpsError} /> : null}
      {live.applied ? <Notice tone="positive" message="Medição levada para o registro abaixo. Ela só é apagada depois de salvar a jornada." /> : null}
      <ButtonRow>
        {live.running ? (
          <Button label="Pausar" variant="secondary" onPress={live.pause} />
        ) : (
          <Button label={live.started ? 'Retomar' : 'Iniciar'} variant={live.started ? 'secondary' : 'primary'} onPress={live.start} />
        )}
        {live.started ? <Button label="Usar no registro" onPress={live.apply} /> : null}
      </ButtonRow>
      {live.started ? <Button label="Descartar medição" variant="danger" onPress={confirmDiscard} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  measures: { flexDirection: 'row', gap: spacing.md },
  measure: { flex: 1, gap: spacing.xs },
});
