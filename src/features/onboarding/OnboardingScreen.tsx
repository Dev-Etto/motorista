import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MIN_TOUCH_TARGET } from '@/shared/theme/theme';
import { APP_NAME } from '@/config/app';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { PermissionsList } from '@/features/permissions/PermissionsList';
import { enableCopilotIfGranted } from '@/features/permissions/usePermissions';
import { CostExample } from '@/features/vehicle/CostExample';
import { useVehicleForm } from '@/features/vehicle/useVehicleForm';
import { VehicleQuickForm } from '@/features/vehicle/VehicleQuickForm';
import { useSubmit } from '@/shared/hooks/useSubmit';
import { Illustration } from '@/shared/ui/illustrations/Illustration';
import { AppText, Button, Card, Notice, Screen, StepDots } from '@/shared/ui/primitives';
import { formatPerKm } from '@/shared/utils/format';

type Step = 'welcome' | 'register' | 'offers' | 'setup' | 'result' | 'permissions' | 'done';

const INTRO_STEPS: Record<'register' | 'offers', { title: string; body: string; illustration: 'register' | 'offers' }> = {
  register: {
    title: 'Registre o dia em menos de um minuto',
    body: 'Informe o que ganhou, os km e as horas. O app desconta seus custos e mostra quanto sobrou de verdade.',
    illustration: 'register',
  },
  offers: {
    title: 'Avalie as ofertas com seus números',
    body: 'Veja de onde vem cada oferta, quanto sobra e uma nota de 0 a 10. Você decide com mais clareza.',
    illustration: 'offers',
  },
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const form = useVehicleForm();
  const [step, setStep] = useState<Step>('welcome');

  const finish = async (nextRoute: '/' | '/vehicle' | '/shift/new') => {
    await settingsRepository.set(SETTING_KEYS.onboarded, '1');
    router.replace('/');
    if (nextRoute !== '/') router.push(nextRoute);
  };

  const finishPermissions = async () => {
    await enableCopilotIfGranted();
    setStep('done');
  };

  const saving = useSubmit(async () => {
    await form.save();
    setStep('result');
  });

  if (step === 'welcome') {
    return (
      <Screen safeTop centered>
        <Illustration name="welcome" />
        <AppText variant="display" bold center>{APP_NAME}</AppText>
        <AppText variant="subtitle" center>Descubra quanto sobra de verdade no seu trabalho como motorista de aplicativo.</AppText>
        <Card>
          <AppText center>Sem conta. Sem cobrança. Sem anúncios.</AppText>
          <AppText tone="muted" center>Seus dados ficam só no seu celular.</AppText>
        </Card>
        <Button label="Começar" onPress={() => setStep('register')} />
        <Button label="Pular introdução" variant="secondary" onPress={() => setStep('setup')} />
        <Pressable accessibilityRole="link" onPress={() => router.push('/terms')} style={styles.terms}>
          <AppText variant="caption" tone="muted" center>Ao continuar, você concorda com os <AppText variant="caption" bold>Termos de uso</AppText>.</AppText>
        </Pressable>
      </Screen>
    );
  }

  if (step === 'register' || step === 'offers') {
    const content = INTRO_STEPS[step];
    return (
      <Screen safeTop centered>
        <Illustration name={content.illustration} />
        <StepDots total={2} current={step === 'register' ? 0 : 1} />
        <AppText variant="title" bold center>{content.title}</AppText>
        <AppText variant="subtitle" center>{content.body}</AppText>
        <Button label="Continuar" onPress={() => setStep(step === 'register' ? 'offers' : 'setup')} />
        <Button label="Pular" variant="secondary" onPress={() => setStep('setup')} />
      </Screen>
    );
  }

  if (step === 'setup') {
    return (
      <Screen safeTop>
        <AppText variant="title" bold center>Seu custo em poucos dados</AppText>
        <AppText tone="muted" center>Óleo, pneus e manutenção começam com estimativas. Seguro, IPVA e parcela você inclui depois.</AppText>
        <VehicleQuickForm form={form} />
        <Button label="Ver meu custo" busy={saving.busy} onPress={saving.submit} />
        <Button label="Fazer isso depois" variant="secondary" onPress={() => finish('/')} />
      </Screen>
    );
  }

  if (step === 'result') {
    return (
      <Screen safeTop centered>
        <Illustration name="result" height={110} />
        <AppText variant="caption" tone="muted" center>Cada km custa para você</AppText>
        <AppText variant="display" bold tone="accent" center>{formatPerKm(form.costs.fullPerKm)}</AppText>
        <CostExample costPerKm={form.costs.fullPerKm} />
        {form.costs.fixedMonthly > 0 ? null : (
          <Notice tone="accent" message="É uma primeira conta. Inclua seguro, IPVA, parcela ou aluguel para ver o valor completo." />
        )}
        <Button label="Continuar" onPress={() => setStep('permissions')} />
        <Button label="Incluir os outros custos" variant="secondary" onPress={() => finish('/vehicle')} />
      </Screen>
    );
  }

  if (step === 'permissions') {
    return (
      <Screen safeTop>
        <AppText variant="title" bold center>Deixe tudo pronto para usar</AppText>
        <AppText tone="muted" center>Assim você não precisa parar no meio da jornada. Tudo fica no seu celular, e você pode mudar depois.</AppText>
        <PermissionsList />
        <Notice tone="accent" message="Quem decide as corridas é sempre você: o app não toca na tela. Cada plataforma tem suas regras sobre apps de apoio, e vale conhecê-las. Dirigindo, a voz avisa: toque no celular só com o carro parado." />
        <Button label="Continuar" onPress={finishPermissions} />
      </Screen>
    );
  }

  return (
    <Screen safeTop centered>
      <Illustration name="welcome" />
      <AppText variant="title" bold center>Tudo pronto</AppText>
      <AppText variant="subtitle" center>Registre sua primeira jornada e veja quanto sobrou de verdade.</AppText>
      <Button label="Registrar uma jornada" onPress={() => finish('/shift/new')} />
      <Button label={replay ? 'Voltar ao início' : 'Ver o início'} variant="secondary" onPress={() => finish('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  terms: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
});
