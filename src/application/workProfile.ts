import { useSyncExternalStore } from 'react';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';

export const WORK_PROFILES = ['rides', 'deliveries', 'both'] as const;
export type WorkProfile = (typeof WORK_PROFILES)[number];
export const DEFAULT_WORK_PROFILE: WorkProfile = 'rides';

const listeners = new Set<() => void>();
let current: WorkProfile = DEFAULT_WORK_PROFILE;

const emit = () => listeners.forEach((listener) => listener());

export async function loadWorkProfile(): Promise<WorkProfile> {
  current = await settingsRepository.getEnum(SETTING_KEYS.workProfile, WORK_PROFILES, DEFAULT_WORK_PROFILE);
  emit();
  return current;
}

export async function saveWorkProfile(profile: WorkProfile): Promise<void> {
  current = profile;
  emit();
  await settingsRepository.set(SETTING_KEYS.workProfile, profile);
}

export const currentWorkProfile = (): WorkProfile => current;

export function resetWorkProfileCache(): void {
  current = DEFAULT_WORK_PROFILE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useWorkProfile(): WorkProfile {
  return useSyncExternalStore(subscribe, currentWorkProfile, currentWorkProfile);
}
