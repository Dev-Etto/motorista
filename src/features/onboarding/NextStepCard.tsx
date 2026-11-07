import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dismissNextStep, NextStep } from '@application/nextStep';
import { useFormat } from '@shared/i18n/format';
import { AppText, Button, ButtonRow, Card } from '@shared/ui/primitives';
import { describeNextStep } from './describeNextStep';

export function NextStepCard({ step, onDismiss }: { step: NextStep | null; onDismiss: () => void }) {
  const router = useRouter();
  const { t } = useTranslation(['onboarding', 'common']);
  const format = useFormat();
  if (!step) return null;

  const text = describeNextStep(step.id, t, format);
  const dismiss = async () => {
    await dismissNextStep(step.id);
    onDismiss();
  };

  return (
    <Card>
      <AppText variant="caption" tone="accent" bold>
        {t('nextStep.caption')}
      </AppText>
      <AppText variant="subtitle" bold>
        {text.title}
      </AppText>
      <AppText tone="muted">{text.message}</AppText>
      <ButtonRow>
        <Button label={text.actionLabel} onPress={() => router.push(step.href)} />
        <Button label={t('common:actions.notNow')} variant="secondary" onPress={dismiss} />
      </ButtonRow>
    </Card>
  );
}
