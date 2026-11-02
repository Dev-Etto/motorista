import { useRouter } from 'expo-router';
import { AppText, Button, ButtonRow, Card } from '@/shared/ui/primitives';
import { dismissNextStep, NextStep } from './nextStep';

export function NextStepCard({ step, onDismiss }: { step: NextStep | null; onDismiss: () => void }) {
  const router = useRouter();
  if (!step) return null;

  const dismiss = async () => {
    await dismissNextStep(step.id);
    onDismiss();
  };

  return (
    <Card>
      <AppText variant="caption" tone="accent" bold>Seu próximo passo</AppText>
      <AppText variant="subtitle" bold>{step.title}</AppText>
      <AppText tone="muted">{step.message}</AppText>
      <ButtonRow>
        <Button label={step.actionLabel} onPress={() => router.push(step.href)} />
        <Button label="Agora não" variant="secondary" onPress={dismiss} />
      </ButtonRow>
    </Card>
  );
}
