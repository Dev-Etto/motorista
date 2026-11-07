import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { isTimerForgotten } from '@domain/shift/forgotten';
import { AppText, Button, Card } from '@shared/ui/primitives';
import { formatClock } from '@shared/utils/dates';
import { useShiftTimer } from './useShiftTimer';

export function ActiveShiftCard() {
  const router = useRouter();
  const { t } = useTranslation('shifts');
  const timer = useShiftTimer();
  if (!timer.started) return null;

  const message = isTimerForgotten(timer.running, timer.elapsedMs) ? t('active.forgotten') : t('active.onePerTime');

  return (
    <Card title={timer.running ? t('status.running') : t('status.paused')}>
      <AppText variant="display" bold>
        {formatClock(timer.elapsedMs)}
      </AppText>
      <AppText variant="caption" tone="muted">
        {message}
      </AppText>
      <Button label={t('active.finish')} onPress={() => router.push({ pathname: '/shift/new', params: { finish: '1' } })} />
      <Button label={t('active.continue')} variant="secondary" onPress={() => router.push('/shift/new')} />
    </Card>
  );
}

export function NewShiftButton() {
  const router = useRouter();
  const { t } = useTranslation('shifts');
  const timer = useShiftTimer();
  if (timer.started) return null;

  return <Button label={t('active.new')} onPress={() => router.push('/shift/new')} />;
}
