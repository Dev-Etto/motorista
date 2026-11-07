import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { confirmAction } from '@shared/ui/dialog';
import { AppText, Button, ButtonRow, Card, Notice, ToggleRow } from '@shared/ui/primitives';
import { formatClock } from '@shared/utils/dates';
import { LiveTrackingState } from './useLiveTracking';

function cardTitle({ started, running }: LiveTrackingState, t: TFunction<'shifts'>) {
  if (!started) return t('live.idleTitle');
  return running ? t('status.running') : t('status.paused');
}

export function LiveTrackingCard({ live }: { live: LiveTrackingState }) {
  const { t } = useTranslation('shifts');
  const format = useFormat();
  const confirmDiscard = () => {
    confirmAction({
      title: t('live.discard.title'),
      message: t('live.discard.message', { context: format.distanceUnit }),
      actionLabel: t('live.discard.action'),
      onConfirm: live.discard,
    });
  };

  return (
    <Card title={cardTitle(live, t)}>
      <View style={styles.measures}>
        <View style={styles.measure}>
          <AppText variant="caption" tone="muted" center>
            {t('live.time')}
          </AppText>
          <AppText variant="title" bold center>
            {formatClock(live.elapsedMs)}
          </AppText>
        </View>
        <View style={styles.measure}>
          <AppText variant="caption" tone="muted" center>
            {t('live.distance')}
          </AppText>
          <AppText variant="title" bold center>
            {format.distance(live.km)}
          </AppText>
        </View>
      </View>
      {live.started && !live.running ? null : (
        <ToggleRow
          label={t('live.measureKm', { context: format.distanceUnit })}
          hint={t('live.measureHint')}
          value={live.measureKm}
          onChange={live.toggleMeasureKm}
        />
      )}
      {live.gpsError ? <Notice message={live.gpsError} /> : null}
      {live.applied ? <Notice tone="positive" message={t('live.applied')} /> : null}
      <ButtonRow>
        {live.running ? (
          <Button label={t('live.pause')} variant="secondary" onPress={live.pause} />
        ) : (
          <Button label={live.started ? t('live.resume') : t('live.start')} variant={live.started ? 'secondary' : 'primary'} onPress={live.start} />
        )}
        {live.started ? <Button label={t('live.apply')} onPress={live.apply} /> : null}
      </ButtonRow>
      {live.started ? <Button label={t('live.discardButton')} variant="danger" onPress={confirmDiscard} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  measures: { flexDirection: 'row', gap: spacing.md },
  measure: { flex: 1, gap: spacing.xs },
});
