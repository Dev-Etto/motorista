import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRegional } from '@application/useRegional';
import { APP_NAME } from '@config/app';
import { enableCopilotIfGranted, PermissionsList } from '@features/permissions';
import { CostExample, useVehicleForm, VehicleQuickForm } from '@features/vehicle';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, spacing } from '@shared/theme/theme';
import { BrandMark } from '@shared/ui/BrandMark';
import { Illustration } from '@shared/ui/illustrations/Illustration';
import { AppText, Button, Notice, Screen } from '@shared/ui/primitives';
import { markOnboarded } from './finishOnboarding';
import { StepHeader } from './StepHeader';

const BRAND_SIZE = 132;

type Step = 'welcome' | 'register' | 'offers' | 'setup' | 'result' | 'permissions' | 'done';

export default function OnboardingScreen() {
  const router = useRouter();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const form = useVehicleForm();
  const format = useFormat();
  const regional = useRegional();
  const { t } = useTranslation(['onboarding', 'common']);
  const [step, setStep] = useState<Step>('welcome');

  const finish = async (nextRoute: '/' | '/vehicle' | '/shift/new') => {
    await markOnboarded();
    router.replace('/');
    if (nextRoute !== '/') router.push(nextRoute);
  };

  const finishPermissions = async () => {
    await enableCopilotIfGranted();
    setStep('done');
  };

  const saving = useSubmit(async () => {
    if (await form.save()) setStep('result');
  });

  if (step === 'welcome') {
    return (
      <Screen safeTop>
        <View style={styles.hero}>
          <BrandMark size={BRAND_SIZE} accessibilityLabel={APP_NAME} />
        </View>
        <View style={styles.headline}>
          <AppText variant="display" bold center>
            {t('welcome.title')}
          </AppText>
          <AppText variant="subtitle" tone="muted" center>
            {t('welcome.tagline')}
          </AppText>
        </View>
        <Button label={t('welcome.start')} onPress={() => setStep('register')} />
        <Button label={t('welcome.skipIntro')} variant="secondary" onPress={() => setStep('setup')} />
        <AppText variant="caption" tone="muted" center>
          {`${t('welcome.promise')} ${t('welcome.privacy')}`}
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => router.push('/region')} style={styles.terms}>
          <AppText variant="caption" tone="muted" center>
            {t('welcome.region', {
              language: t(`common:languageName.${regional.language}`),
              currency: format.currencySymbol,
              unit: format.distanceUnit,
            })}
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push('/terms')} style={styles.terms}>
          <AppText variant="caption" tone="muted" center>
            <Trans t={t} i18nKey="welcome.terms" components={{ bold: <AppText variant="caption" bold /> }} />
          </AppText>
        </Pressable>
      </Screen>
    );
  }

  if (step === 'register' || step === 'offers') {
    const content =
      step === 'register'
        ? { title: t('intro.registerTitle'), body: t('intro.registerBody', { context: format.distanceUnit }) }
        : { title: t('intro.offersTitle'), body: t('intro.offersBody') };
    return (
      <Screen safeTop>
        <StepHeader step={step} onSkip={() => setStep('setup')} />
        <Illustration name={step} />
        <AppText variant="title" bold center>
          {content.title}
        </AppText>
        <AppText variant="subtitle" center>
          {content.body}
        </AppText>
        <Button label={t('common:actions.continue')} onPress={() => setStep(step === 'register' ? 'offers' : 'setup')} />
      </Screen>
    );
  }

  if (step === 'setup') {
    return (
      <Screen safeTop>
        <StepHeader step="setup" onSkip={() => finish('/')} />
        <AppText variant="title" bold center>
          {t('setup.title')}
        </AppText>
        <AppText tone="muted" center>
          {t('setup.hint')}
        </AppText>
        <VehicleQuickForm form={form} />
        {form.error ? <Notice tone="negative" message={form.error} /> : null}
        {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
        <Button label={t('setup.seeCost')} busy={saving.busy} onPress={saving.submit} />
      </Screen>
    );
  }

  if (step === 'result') {
    return (
      <Screen safeTop>
        <StepHeader step="result" onSkip={() => setStep('permissions')} />
        <Illustration name="result" height={110} />
        <AppText variant="caption" tone="muted" center>
          {t('result.caption', { context: format.distanceUnit })}
        </AppText>
        <AppText variant="display" bold tone="accent" center>
          {format.perDistance(form.costs.fullPerKm)}
        </AppText>
        <CostExample costPerKm={form.costs.fullPerKm} />
        {form.costs.fixedMonthly > 0 ? null : <Notice tone="accent" message={t('result.firstEstimate')} />}
        <Button label={t('common:actions.continue')} onPress={() => setStep('permissions')} />
        <Button label={t('result.addOtherCosts')} variant="secondary" onPress={() => finish('/vehicle')} />
      </Screen>
    );
  }

  if (step === 'permissions') {
    return (
      <Screen safeTop>
        <StepHeader step="permissions" onSkip={() => setStep('done')} />
        <AppText variant="title" bold center>
          {t('permissions.title')}
        </AppText>
        <AppText tone="muted" center>
          {t('permissions.hint')}
        </AppText>
        <PermissionsList />
        <Notice tone="accent" message={t('permissions.notice')} />
        <Button label={t('common:actions.continue')} onPress={finishPermissions} />
      </Screen>
    );
  }

  return (
    <Screen safeTop centered>
      <Illustration name="welcome" />
      <AppText variant="title" bold center>
        {t('done.title')}
      </AppText>
      <AppText variant="subtitle" center>
        {t('done.message')}
      </AppText>
      <Button label={t('done.registerShift')} onPress={() => finish('/shift/new')} />
      <Button label={replay ? t('done.backHome') : t('done.seeHome')} variant="secondary" onPress={() => finish('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  terms: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  hero: { flex: 1, minHeight: BRAND_SIZE + spacing.xxl * 2, alignItems: 'center', justifyContent: 'center' },
  headline: { gap: spacing.sm, marginBottom: spacing.lg },
});
