import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRegional } from '@application/useRegional';
import { saveWorkProfile, useWorkProfile } from '@application/workProfile';
import { APP_NAME } from '@config/app';
import { useCopilotStatus } from '@features/copilot';
import { OfferRow } from '@features/offers';
import { enableCopilotIfGranted, PermissionsList } from '@features/permissions';
import { WorkProfilePicker } from '@features/settings';
import { CostExample, CostHero, useVehicleForm, VehicleQuickForm } from '@features/vehicle';
import type { OfferHistoryEntry } from '@modules/copilot';
import { useSubmit } from '@shared/hooks/useSubmit';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon } from '@shared/ui/AppIcon';
import { BrandMark } from '@shared/ui/BrandMark';
import { Illustration } from '@shared/ui/illustrations/Illustration';
import { AppText, Button, Card, ListRow, Notice, Screen } from '@shared/ui/primitives';
import { reportError } from '@shared/utils/reportError';
import { markOnboarded } from './finishOnboarding';
import { StepHeader } from './StepHeader';

const BRAND_SIZE = 132;
const SAMPLE_OFFER: OfferHistoryEntry = {
  timestamp: new Date(2026, 0, 1, 14, 22).getTime(),
  source: '99',
  valueCents: 1800,
  km: 8.5,
  minutes: 22,
  perKmCents: 212,
  perHourCents: 4909,
  color: 'green',
  score: 4.2,
};

type Step = 'welcome' | 'register' | 'offers' | 'profile' | 'setup' | 'result' | 'permissions' | 'done';

export default function OnboardingScreen() {
  const router = useRouter();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const form = useVehicleForm();
  const format = useFormat();
  const regional = useRegional();
  const { t } = useTranslation(['onboarding', 'common']);
  const workProfile = useWorkProfile();
  const [step, setStep] = useState<Step>('welcome');
  const copilotReady = useCopilotStatus().current.accessibilityGranted;

  const finish = async (nextRoute: '/' | '/vehicle' | '/shift/new' | '/goal') => {
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
        <Button label={t('welcome.skipIntro')} variant="secondary" onPress={() => setStep('profile')} />
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
        <StepHeader step={step} onSkip={() => setStep('profile')} />
        <Illustration name={step} />
        <AppText variant="title" bold center>
          {content.title}
        </AppText>
        <AppText variant="subtitle" center>
          {content.body}
        </AppText>
        <Button label={t('common:actions.continue')} onPress={() => setStep(step === 'register' ? 'offers' : 'profile')} />
      </Screen>
    );
  }

  if (step === 'profile') {
    return (
      <Screen safeTop>
        <StepHeader step="profile" onSkip={() => setStep('setup')} />
        <AppText variant="title" bold center>
          {t('profile.title')}
        </AppText>
        <AppText tone="muted" center>
          {t('profile.hint')}
        </AppText>
        <WorkProfilePicker value={workProfile} onChange={(next) => saveWorkProfile(next).catch(reportError)} />
        <Button label={t('common:actions.continue')} onPress={() => setStep('setup')} />
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
        <CostHero costs={form.costs} />
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
        <Card title={t('permissions.previewTitle')}>
          <OfferRow entry={SAMPLE_OFFER} />
        </Card>
        <PermissionsList />
        <Notice tone="accent" message={t('permissions.notice', { context: workProfile })} />
        <Button label={t('common:actions.continue')} onPress={finishPermissions} />
      </Screen>
    );
  }

  return (
    <Screen safeTop>
      <AppText variant="title" bold accessibilityRole="header">
        {t('done.title')}
      </AppText>
      <AppText variant="subtitle" tone="muted">
        {t('done.message')}
      </AppText>
      <Card>
        <DoneItem done label={t('done.costItem', { cost: format.perDistance(form.costs.fullPerKm) })} />
        <DoneItem done={copilotReady} label={copilotReady ? t('done.copilotOn') : t('done.copilotOff')} />
        <ListRow icon="goal" title={t('done.goalItem')} subtitle={t('done.optional')} chevron onPress={() => finish('/goal')} />
      </Card>
      <Notice tone="accent" message={t('done.startHint')} />
      <Button label={replay ? t('done.backHome') : t('done.seeHome')} onPress={() => finish('/')} />
      <Button label={t('done.registerShift')} variant="secondary" onPress={() => finish('/shift/new')} />
    </Screen>
  );
}

function DoneItem({ done, label }: { done: boolean; label: string }) {
  const colors = useTheme();
  return (
    <View accessible accessibilityLabel={label} accessibilityState={{ checked: done }} style={styles.doneItem}>
      <AppIcon name={done ? 'check' : 'help'} color={done ? colors.positive : colors.textMuted} size={22} />
      <AppText style={styles.flex}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  terms: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  hero: { flex: 1, minHeight: BRAND_SIZE + spacing.xxl * 2, alignItems: 'center', justifyContent: 'center' },
  headline: { gap: spacing.sm, marginBottom: spacing.lg },
  flex: { flex: 1 },
  doneItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
});
