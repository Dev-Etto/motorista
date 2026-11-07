import { useEffect, useSyncExternalStore } from 'react';
import { onDeviceLocaleMaybeChanged } from '@shared/platform/locale';
import { regionalStore } from './regional';

export const useRegional = () => useSyncExternalStore(regionalStore.subscribe, regionalStore.current);

export function useDeviceLocaleSync(): void {
  useEffect(() => onDeviceLocaleMaybeChanged(() => void regionalStore.refresh()), []);
}
