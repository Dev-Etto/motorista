import { useRouter } from 'expo-router';
import { useState } from 'react';
import { goalRepository } from '@/data/repositories/goalRepository';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { DEFAULT_WORK_WEEKDAYS } from '@/domain/goal/goal';
import { APP_NAME } from '@/config/app';
import { useVehicleForm } from '@/features/vehicle/useVehicleForm';
import { VehicleCostForm } from '@/features/vehicle/VehicleCostForm';
import { MoneyField } from '@/shared/ui/fields';
import { AppText, Button, Card, Screen } from '@/shared/ui/primitives';
import { monthKey, today } from '@/shared/utils/dates';
import { formatPerKm } from '@/shared/utils/format';
import { parseBRL } from '@/shared/utils/money';

type Step = 'welcome' | 'vehicle' | 'goal';

export default function OnboardingScreen() {
  const router = useRouter();
  const form = useVehicleForm();
  const [step, setStep] = useState<Step>('welcome');
  const [desiredProfit, setDesiredProfit] = useState('');

  const finish = async () => {
    await settingsRepository.set(SETTING_KEYS.onboarded, '1');
    router.replace('/');
  };

  const saveVehicle = async () => {
    await form.save();
    setStep('goal');
  };

  const saveGoal = async () => {
    const cents = parseBRL(desiredProfit);
    if (cents) {
      await goalRepository.save({ month: monthKey(today()), desiredProfitCents: cents, workWeekdays: DEFAULT_WORK_WEEKDAYS });
    }
    await finish();
  };

  if (step === 'welcome') {
    return (
      <Screen safeTop>
        <AppText variant="display" bold>{APP_NAME}</AppText>
        <AppText variant="subtitle">Descubra quanto você realmente lucra como motorista de aplicativo.</AppText>
        <Card>
          <AppText>Sem conta. Sem cobrança. Sem anúncios.</AppText>
          <AppText tone="muted">Seus dados ficam só no seu celular.</AppText>
        </Card>
        <Button label="Começar" onPress={() => setStep('vehicle')} />
        <Button label="Pular" variant="secondary" onPress={finish} />
      </Screen>
    );
  }

  if (step === 'vehicle') {
    return (
      <Screen safeTop>
        <AppText variant="title" bold>Seu veículo e seus custos</AppText>
        <VehicleCostForm form={form} />
        <Button label="Continuar" onPress={saveVehicle} />
        <Button label="Pular" variant="secondary" onPress={() => setStep('goal')} />
      </Screen>
    );
  }

  return (
    <Screen safeTop>
      <AppText variant="title" bold>Seu custo é {formatPerKm(form.costs.fullPerKm)}</AppText>
      <Card title="Meta do mês (opcional)">
        <MoneyField label="Quanto você quer lucrar neste mês?" value={desiredProfit} onChangeText={setDesiredProfit} />
      </Card>
      <Button label="Ir para o início" onPress={saveGoal} />
    </Screen>
  );
}
