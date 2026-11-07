import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { plannedHoursPerDay } from '@application/goalProgress';
import { isShiftForgotten, suggestedStopAt } from '@domain/shift/forgotten';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { confirmAction } from '@shared/ui/dialog';
import { DurationField } from '@shared/ui/fields';
import { AppText, Button, ButtonRow, Card, Notice, ToggleRow } from '@shared/ui/primitives';
import { clockOfMillis, formatClock, nextClockTime, today } from '@shared/utils/dates';
import { MINUTES_PER_HOUR } from '@shared/utils/time';
import { LiveTrackingState } from './useLiveTracking';

function cardTitle({ started, running }: LiveTrackingState, t: TFunction<'shifts'>) {
  if (!started) return t('live.idleTitle');
  return running ? t('status.running') : t('status.paused');
}

export function LiveTrackingCard({ live }: { live: LiveTrackingState }) {
  const { t } = useTranslation('shifts');
  const format = useFormat();
  const forgotten = isShiftForgotten(live.started, live.elapsedMs);
  const { data: plannedHours } = useAsyncData(() => plannedHoursPerDay(today()), []);
  const [stopText, setStopText] = useState<string | null>(null);
  const stopValue = stopText ?? clockOfMillis(suggestedStopAt(live.startedAt, plannedHours ?? null));
  const stopHours = format.parseHours(stopValue);
  const stopInvalid = stopHours === null || stopHours >= HOURS_PER_DAY;

  const applyMeasure = () => {
    if (!forgotten) return live.apply();
    if (stopInvalid) return;
    return live.apply(nextClockTime(live.startedAt, stopHours * MINUTES_PER_HOUR));
  };

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
      {forgotten && !live.applied ? (
        <>
          <Notice message={t('live.forgotten.message')} />
          <DurationField
            label={t('live.forgotten.stopLabel')}
            value={stopValue}
            onChangeText={setStopText}
            error={stopInvalid ? t('live.forgotten.stopInvalid') : null}
          />
        </>
      ) : null}
      {live.applied ? <Notice tone="positive" message={t('live.applied')} /> : null}
      {live.applied && forgotten ? <Notice message={t('live.forgotten.checkKm', { context: format.distanceUnit })} /> : null}
      <ButtonRow>
        {live.running ? (
          <Button label={t('live.pause')} variant="secondary" onPress={live.pause} />
        ) : (
          <Button label={live.started ? t('live.resume') : t('live.start')} variant={live.started ? 'secondary' : 'primary'} onPress={live.start} />
        )}
        {live.started ? <Button label={t('live.apply')} onPress={applyMeasure} /> : null}
      </ButtonRow>
      {live.started ? <Button label={t('live.discardButton')} variant="danger" onPress={confirmDiscard} /> : null}
    </Card>
  );
}

const HOURS_PER_DAY = 24;

const styles = StyleSheet.create({
  measures: { flexDirection: 'row', gap: spacing.md },
  measure: { flex: 1, gap: spacing.xs },
});
