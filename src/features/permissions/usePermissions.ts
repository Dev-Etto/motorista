import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { syncCopilotTargets } from '@/application/offerSettings';
import { ensureLocation, hasLocationPermission } from '@/shared/platform/location';
import { ensureNotifications, hasNotificationPermission } from '@/shared/platform/notifications';
import { copilot, CopilotStatus } from '@modules/copilot';

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
  const [notifications, location] = await Promise.all([hasNotificationPermission(), hasLocationPermission()]);
  return toState(notifications, location, copilot.getStatus());
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
    await ensureNotifications();
    await refresh();
  };

  const requestLocation = async () => {
    await ensureLocation();
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
