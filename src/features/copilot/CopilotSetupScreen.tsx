import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Illustration } from '@shared/ui/illustrations/Illustration';
import { AppText, Button, Card, Notice, Screen, StepDots } from '@shared/ui/primitives';
import { useCopilot } from './useCopilot';

export default function CopilotSetupScreen() {
  const { t } = useTranslation(['copilot', 'common']);
  const router = useRouter();
  const copilot = useCopilot();
  const status = copilot.status.current;

  const activate = async () => {
    copilot.preferences.update({ voice: true, card: true });
    await copilot.status.setEnabled(true);
    copilot.tests.test();
  };

  if (!status.accessibilityGranted) {
    return (
      <Screen>
        <Illustration name="copilot" height={120} />
        <StepDots total={2} current={0} />
        <AppText variant="title" bold center>
          {t('setup.permission.title')}
        </AppText>
        <Card>
          <AppText>{t('setup.permission.explanation')}</AppText>
          <AppText tone="muted">{t('setup.permission.privacy')}</AppText>
        </Card>
        <Button label={t('setup.permission.openAccessibility')} onPress={copilot.status.openAccessibility} />
        <Card title={t('setup.permission.stepsTitle')}>
          <AppText>{t('setup.permission.step1')}</AppText>
          <AppText>{t('setup.permission.step2')}</AppText>
          <AppText>{t('setup.permission.step3')}</AppText>
        </Card>
        <Card title={t('setup.permission.fullControlTitle')}>
          <AppText>{t('setup.permission.fullControl')}</AppText>
          <AppText tone="muted">{t('setup.permission.shortcut')}</AppText>
        </Card>
        <Card title={t('setup.permission.blockedTitle')}>
          <AppText>{t('setup.permission.blocked')}</AppText>
          <Button label={t('setup.permission.openAppSettings')} variant="secondary" onPress={copilot.status.openAppSettings} />
        </Card>
        <Button label={t('common:actions.later')} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!status.enabled) {
    return (
      <Screen>
        <Illustration name="copilot" height={120} />
        <StepDots total={2} current={1} />
        <AppText variant="title" bold center>
          {t('setup.ready.title')}
        </AppText>
        <AppText center>{t('setup.ready.explanation')}</AppText>
        <Button label={t('setup.ready.activate')} onPress={activate} />
        <Button label={t('common:actions.later')} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Illustration name="welcome" height={120} />
      <AppText variant="title" bold center>
        {t('setup.active.title')}
      </AppText>
      <AppText center>{t('setup.active.explanation')}</AppText>
      <Notice tone="accent" message={t('setup.active.driving')} />
      <Button label={t('setup.active.testAgain')} variant="secondary" onPress={copilot.tests.test} />
      {copilot.message ? <Notice tone="accent" message={copilot.message} /> : null}
      <Button label={t('common:actions.done')} onPress={() => router.back()} />
    </Screen>
  );
}
