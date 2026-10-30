import { copilot } from '@modules/copilot';
import { useEffect } from 'react';
import { AppState } from 'react-native';

export function useFloatingVisibility(): void {
  useEffect(() => {
    copilot.setAppInForeground(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      copilot.setAppInForeground(state === 'active');
    });
    return () => subscription.remove();
  }, []);
}
