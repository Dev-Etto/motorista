import { AppText, Button, ButtonRow, Card } from '@/shared/ui/primitives';
import { formatDuration } from '@/shared/utils/dates';
import { useShiftTimer } from './useShiftTimer';

export function TimerCard({ onApply }: { onApply: (minutes: number, startedAt: number) => void }) {
  const timer = useShiftTimer();

  const finish = () => {
    timer.pause();
    onApply(timer.minutes, timer.startedAt);
    timer.reset();
  };

  return (
    <Card title="Cronômetro">
      <AppText variant="title" bold>{formatDuration(timer.minutes)}</AppText>
      <ButtonRow>
        {timer.running ? (
          <Button label="Pausar" variant="secondary" onPress={timer.pause} />
        ) : (
          <Button label={timer.started ? 'Retomar' : 'Iniciar'} onPress={timer.start} />
        )}
        {timer.started ? <Button label="Usar este tempo" variant="secondary" onPress={finish} /> : null}
      </ButtonRow>
    </Card>
  );
}
