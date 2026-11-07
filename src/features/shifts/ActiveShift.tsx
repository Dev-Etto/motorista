import { useRouter } from 'expo-router';
import { isTimerForgotten } from '@/domain/shift/forgotten';
import { AppText, Button, Card } from '@/shared/ui/primitives';
import { formatClock } from '@/shared/utils/dates';
import { useShiftTimer } from './useShiftTimer';

export function ActiveShiftCard() {
  const router = useRouter();
  const timer = useShiftTimer();
  if (!timer.started) return null;

  const message = isTimerForgotten(timer.running, timer.elapsedMs)
    ? 'O cronômetro está ligado há bastante tempo. Se você já terminou, é só revisar as horas.'
    : 'É uma jornada por vez. Finalize esta para começar outra.';

  return (
    <Card title={timer.running ? 'Jornada em andamento' : 'Jornada pausada'}>
      <AppText variant="display" bold>
        {formatClock(timer.elapsedMs)}
      </AppText>
      <AppText variant="caption" tone="muted">
        {message}
      </AppText>
      <Button label="Encerrar e registrar" onPress={() => router.push({ pathname: '/shift/new', params: { finish: '1' } })} />
      <Button label="Continuar jornada" variant="secondary" onPress={() => router.push('/shift/new')} />
    </Card>
  );
}

export function NewShiftButton() {
  const router = useRouter();
  const timer = useShiftTimer();
  if (timer.started) return null;

  return <Button label="Nova jornada" onPress={() => router.push('/shift/new')} />;
}
