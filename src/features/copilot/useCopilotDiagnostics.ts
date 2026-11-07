import { useState } from 'react';
import { copilot } from '@modules/copilot';
import { useInterval } from '@shared/hooks/useInterval';

const DIAGNOSTICS_REFRESH_MS = 2000;

export function useCopilotDiagnostics() {
  const [enabled, setEnabled] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useInterval(() => setLines(copilot.getDiagnostics()), enabled ? DIAGNOSTICS_REFRESH_MS : null);

  const toggle = (value: boolean) => {
    copilot.setDiagnosticsEnabled(value);
    setEnabled(value);
    if (!value) setLines([]);
  };

  return { enabled, lines, toggle };
}

export type CopilotDiagnosticsState = ReturnType<typeof useCopilotDiagnostics>;
