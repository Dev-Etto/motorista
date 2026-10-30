import { useRouter } from 'expo-router';
import { Button, Notice, Screen } from '@/shared/ui/primitives';
import {
  CopilotAppsCard,
  CopilotCalibrationCard,
  CopilotChannelsCard,
  CopilotDisplayCard,
  CopilotHistoryCard,
  CopilotStatusCard,
} from './CopilotCards';
import { OfferTargetsCard } from './OfferTargetsCard';
import { useCopilot } from './useCopilot';
import { useOfferTargets } from './useOfferTargets';

export default function CopilotScreen() {
  const router = useRouter();
  const copilot = useCopilot();
  const targets = useOfferTargets();

  return (
    <Screen>
      <CopilotStatusCard copilot={copilot} />
      <Notice tone="accent" message="Você no controle: o Copiloto só lê e informa, e quem aceita ou recusa é sempre você. Dirigindo, a voz avisa: toque no celular só com o carro parado. Cada plataforma tem suas regras sobre apps de apoio, e vale conhecê-las." />
      <CopilotChannelsCard copilot={copilot} />
      <OfferTargetsCard targets={targets} />
      <CopilotDisplayCard copilot={copilot} />
      <CopilotAppsCard copilot={copilot} />
      <CopilotHistoryCard copilot={copilot} />
      <CopilotCalibrationCard copilot={copilot} />
      <Button label="Rever a configuração guiada" variant="secondary" onPress={() => router.push('/copilot-setup')} />
    </Screen>
  );
}
