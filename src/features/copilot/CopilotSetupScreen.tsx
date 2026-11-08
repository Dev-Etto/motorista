import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET, spacing } from '@shared/theme/theme';
import { Illustration } from '@shared/ui/illustrations/Illustration';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Button, Card, Notice, Screen, StepDots } from '@shared/ui/primitives';
import { AccessibilityDisclosure } from './AccessibilityDisclosure';
import { useAccessibilityConsent } from './useAccessibilityConsent';
import { useCopilot } from './useCopilot';

const SETUP_STEPS = 2;
const PERMISSION_STEPS = ['step1', 'step2', 'step3'] as const;

function StepTitle({ current, title, explanation }: { current: number; title: string; explanation: string }) {
  const { t } = useTranslation('copilot');
  return (
    <View style={styles.title}>
      <StepDots total={SETUP_STEPS} current={current} />
      <AppText variant="caption" bold tone="muted">
        {t('setup.stepOf', { current: current + 1, total: SETUP_STEPS })}
      </AppText>
      <AppText variant="title" bold accessibilityRole="header">
        {title}
      </AppText>
      <AppText tone="muted">{explanation}</AppText>
    </View>
  );
}

export default function CopilotSetupScreen() {
  const { t } = useTranslation(['copilot', 'common']);
  const router = useRouter();
  const copilot = useCopilot();
  const consent = useAccessibilityConsent();
  const status = copilot.status.current;

  const activate = async () => {
    copilot.preferences.update({ voice: true, card: true });
    await copilot.status.setEnabled(true);
    copilot.tests.test();
  };

  if (!status.accessibilityGranted && consent.accepted === null) return null;

  if (!status.accessibilityGranted && !consent.accepted) {
    return <AccessibilityDisclosure onAccept={consent.accept} onDecline={() => router.back()} />;
  }

  if (!status.accessibilityGranted) {
    return (
      <Screen>
        <StepTitle current={0} title={t('setup.permission.title')} explanation={t('setup.permission.explanation')} />
        <Card>
          {PERMISSION_STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <AppText bold>{`${index + 1}.`}</AppText>
              <AppText style={styles.flex}>{t(`setup.permission.${step}`)}</AppText>
            </View>
          ))}
        </Card>
        <Card>
          <Notice message={t('setup.permission.blocked')} />
          <Pressable accessibilityRole="button" onPress={copilot.status.openAppSettings} style={styles.link}>
            <AppText bold>{t('setup.permission.openAppSettings')}</AppText>
          </Pressable>
        </Card>
        <LearnMore title={t('setup.permission.fullControlTitle')}>
          <AppText variant="caption">{t('setup.permission.fullControl')}</AppText>
          <AppText variant="caption">{t('setup.permission.shortcut')}</AppText>
        </LearnMore>
        <Button label={t('setup.permission.openAccessibility')} onPress={copilot.status.openAccessibility} />
        <Button label={t('setup.later')} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!status.enabled) {
    return (
      <Screen>
        <StepTitle current={1} title={t('setup.ready.title')} explanation={t('setup.ready.explanation')} />
        <Illustration name="copilot" height={120} />
        <Button label={t('setup.ready.activate')} onPress={activate} />
        <Button label={t('setup.later')} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Illustration name="welcome" height={120} />
      <AppText variant="title" bold center accessibilityRole="header">
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { gap: spacing.sm },
  step: { flexDirection: 'row', gap: spacing.sm },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
});
