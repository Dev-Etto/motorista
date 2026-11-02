import { copilot, CopilotStatus } from '@modules/copilot';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { syncCopilotTargets } from '@/features/copilot/syncTargets';

export interface PermissionsState {
  notifications: boolean;
  location: boolean;
  overlay: boolean;
  accessibility: boolean;
}

const toState = (notifications: boolean, location: boolean, status: CopilotStatus): PermissionsState => ({
  notifications,
  location,
  overlay: status.overlayGranted,
  accessibility: status.accessibilityGranted,
});

async function readPermissions(): Promise<PermissionsState> {
  const [notifications, location] = await Promise.all([Notifications.getPermissionsAsync(), Location.getForegroundPermissionsAsync()]);
  return toState(notifications.granted, location.granted, copilot.getStatus());
}

export async function enableCopilotIfGranted(): Promise<void> {
  const status = copilot.getStatus();
  if (!status.accessibilityGranted || status.enabled) return;

  await syncCopilotTargets();
  copilot.setEnabled(true);
}

export function usePermissions() {
  const [state, setState] = useState<PermissionsState>({ notifications: false, location: false, overlay: false, accessibility: false });

  const refresh = useCallback(async () => {
    setState(await readPermissions());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const requestNotifications = async () => {
    await Notifications.requestPermissionsAsync();
    await refresh();
  };

  const requestLocation = async () => {
    await Location.requestForegroundPermissionsAsync();
    await refresh();
  };

  return {
    state,
    requestNotifications,
    requestLocation,
    openOverlay: copilot.openOverlaySettings,
    openAccessibility: copilot.openAccessibilitySettings,
    openAppSettings: copilot.openAppSettings,
  };
}
