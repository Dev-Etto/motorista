import { useEffect } from 'react';
import { AppState } from 'react-native';
import { copilot } from '@modules/copilot';
import { shouldStartFloating } from './floatingStart';

function startFloatingIfNeeded(): void {
  const { overlayGranted, floatingRunning } = copilot.getStatus();
  const { floatingButton } = copilot.getPreferences();
  if (shouldStartFloating({ floatingButton, overlayGranted, floatingRunning })) copilot.startFloating();
}

export function useFloatingVisibility(): void {
  useEffect(() => {
    const active = AppState.currentState === 'active';
    copilot.setAppInForeground(active);
    if (active) startFloatingIfNeeded();
    const subscription = AppState.addEventListener('change', (state) => {
      copilot.setAppInForeground(state === 'active');
      if (state === 'active') startFloatingIfNeeded();
    });
    return () => subscription.remove();
  }, []);
}
