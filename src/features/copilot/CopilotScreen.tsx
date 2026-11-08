import { Screen } from '@shared/ui/primitives';
import { CopilotCardSection, CopilotChannelsCard, CopilotMoreCard, CopilotRulesNotice, CopilotStatusCard } from './CopilotCards';
import { useCopilot } from './useCopilot';

export default function CopilotScreen() {
  const copilot = useCopilot();

  return (
    <Screen>
      <CopilotStatusCard copilot={copilot.status} preferences={copilot.preferences} />
      <CopilotChannelsCard copilot={copilot.status} preferences={copilot.preferences} />
      <CopilotCardSection preferences={copilot.preferences} tests={copilot.tests} message={copilot.message} />
      <CopilotMoreCard preferences={copilot.preferences} />
      <CopilotRulesNotice />
    </Screen>
  );
}
