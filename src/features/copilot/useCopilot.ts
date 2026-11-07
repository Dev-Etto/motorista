import { useState } from 'react';
import { useCopilotDiagnostics } from './useCopilotDiagnostics';
import { useCopilotPreferences } from './useCopilotPreferences';
import { useCopilotStatus } from './useCopilotStatus';
import { useCopilotTests } from './useCopilotTests';

export function useCopilot() {
  const [message, setMessage] = useState<string | null>(null);
  const status = useCopilotStatus();
  const preferences = useCopilotPreferences(status.refresh, setMessage);
  const tests = useCopilotTests(status.refresh, setMessage);
  const diagnostics = useCopilotDiagnostics();

  return { message, status, preferences, tests, diagnostics };
}
