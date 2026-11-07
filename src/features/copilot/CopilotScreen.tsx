import { useRouter } from 'expo-router';
import { Button, Notice, Screen } from '@/shared/ui/primitives';
import { CopilotAppsCard, CopilotCalibrationCard, CopilotChannelsCard, CopilotDisplayCard, CopilotHistoryCard, CopilotStatusCard } from './CopilotCards';
import { OfferTargetsSummary } from './OfferTargetsCard';
import { useCopilot } from './useCopilot';
import { useOfferTargets } from './useOfferTargets';

export default function CopilotScreen() {
  const router = useRouter();
  const copilot = useCopilot();
  const targets = useOfferTargets();

  return (
    <Screen>
      <CopilotStatusCard copilot={copilot.status} preferences={copilot.preferences} />
      <Notice
        tone="accent"
        message="Você no controle: o Copiloto só lê e informa, e quem aceita ou recusa é sempre você. Dirigindo, a voz avisa: toque no celular só com o carro parado. Cada plataforma tem suas regras sobre apps de apoio, e vale conhecê-las."
      />
      <CopilotChannelsCard copilot={copilot.status} preferences={copilot.preferences} tests={copilot.tests} message={copilot.message} />
      <OfferTargetsSummary targets={targets} />
      <CopilotDisplayCard preferences={copilot.preferences} />
      <CopilotAppsCard preferences={copilot.preferences} />
      <CopilotHistoryCard history={copilot.status.history} />
      <CopilotCalibrationCard diagnostics={copilot.diagnostics} />
      <Button label="Rever a configuração guiada" variant="secondary" onPress={() => router.push('/copilot-setup')} />
    </Screen>
  );
}
