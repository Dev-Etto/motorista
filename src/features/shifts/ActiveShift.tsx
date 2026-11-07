import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { isShiftForgotten } from '@domain/shift/forgotten';
import { useFormat } from '@shared/i18n/format';
import { AppText, Button, ButtonRow, Card, Notice } from '@shared/ui/primitives';
import { formatClock } from '@shared/utils/dates';
import { reportError } from '@shared/utils/reportError';
import { useLiveTracking } from './useLiveTracking';

const ignoreApply = () => undefined;

export function ShiftControls() {
  const router = useRouter();
  const { t } = useTranslation('shifts');
  const format = useFormat();
  const live = useLiveTracking(ignoreApply);
  const run = (action: () => Promise<void>) => () => action().catch(reportError);

  if (!live.started) {
    return (
      <>
        <Button label={t('active.start')} onPress={run(live.start)} />
        <Button label={t('active.registerPast')} variant="secondary" onPress={() => router.push('/shift/new')} />
      </>
    );
  }

  const details = [formatClock(live.elapsedMs), live.km > 0 ? format.distance(live.km) : null].filter(Boolean).join(' · ');

  return (
    <Card title={live.running ? t('bar.running') : t('bar.paused')}>
      <AppText variant="display" bold accessibilityLabel={details}>
        {details}
      </AppText>
      {isShiftForgotten(live.started, live.elapsedMs) ? <Notice message={t('active.forgotten')} /> : null}
      <ButtonRow>
        <Button label={live.running ? t('bar.pause') : t('bar.resume')} variant="secondary" onPress={run(live.running ? live.pause : live.start)} />
        <Button label={t('bar.finish')} onPress={() => router.push({ pathname: '/shift/new', params: { finish: '1' } })} />
      </ButtonRow>
    </Card>
  );
}
