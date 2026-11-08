import { Notice, Screen } from '@shared/ui/primitives';
import { CopilotDisplayOptions } from './CopilotCards';
import { useCopilot } from './useCopilot';

export default function CopilotCardScreen() {
  const copilot = useCopilot();

  return (
    <Screen>
      <CopilotDisplayOptions preferences={copilot.preferences} tests={copilot.tests} />
      {copilot.message ? <Notice tone="accent" message={copilot.message} /> : null}
    </Screen>
  );
}
