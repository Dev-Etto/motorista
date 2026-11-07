import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Notice, Screen } from '@shared/ui/primitives';
import { CopilotAppsCard, CopilotCalibrationCard, CopilotChannelsCard, CopilotDisplayCard, CopilotHistoryCard, CopilotStatusCard } from './CopilotCards';
import { OfferTargetsSummary } from './OfferTargetsCard';
import { useCopilot } from './useCopilot';
import { useOfferTargets } from './useOfferTargets';

export default function CopilotScreen() {
  const { t } = useTranslation('copilot');
  const router = useRouter();
  const copilot = useCopilot();
  const targets = useOfferTargets();

  return (
    <Screen>
      <CopilotStatusCard copilot={copilot.status} preferences={copilot.preferences} />
      <Notice tone="accent" message={t('screen.inControl')} />
      <CopilotChannelsCard copilot={copilot.status} preferences={copilot.preferences} tests={copilot.tests} message={copilot.message} />
      <OfferTargetsSummary targets={targets} />
      <CopilotDisplayCard preferences={copilot.preferences} />
      <CopilotAppsCard preferences={copilot.preferences} />
      <CopilotHistoryCard history={copilot.status.history} />
      <CopilotCalibrationCard diagnostics={copilot.diagnostics} />
      <Button label={t('screen.reviewSetup')} variant="secondary" onPress={() => router.push('/copilot-setup')} />
    </Screen>
  );
}
