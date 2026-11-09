import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET } from '@shared/theme/theme';
import { AppText, StepDots } from '@shared/ui/primitives';

export const ONBOARDING_STEPS = ['register', 'offers', 'profile', 'setup', 'result', 'permissions'] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function StepHeader({ step, onSkip }: { step: OnboardingStep; onSkip: () => void }) {
  const { t } = useTranslation('onboarding');
  return (
    <View style={styles.header}>
      <View style={styles.side} />
      <View style={styles.dots}>
        <StepDots total={ONBOARDING_STEPS.length} current={ONBOARDING_STEPS.indexOf(step)} />
      </View>
      <Pressable accessibilityRole="button" onPress={onSkip} style={styles.side}>
        <AppText bold>{t('intro.skip')}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  dots: { flex: 1 },
  side: { minWidth: 64, minHeight: MIN_TOUCH_TARGET, alignItems: 'flex-end', justifyContent: 'center' },
});
