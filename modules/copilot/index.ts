import { requireOptionalNativeModule } from 'expo-modules-core';
import { type CopilotPreferences, type CopilotRegional, copilotRegionalSchema, parseHistory, parsePreferences } from './schemas';

export type { CardLayout, CardSize, CopilotPreferences, CopilotRegional, OfferHistoryEntry, PrimaryMetric, ThemeMode } from './schemas';

export interface CopilotStatus {
  enabled: boolean;
  accessibilityGranted: boolean;
  overlayGranted: boolean;
  floatingRunning: boolean;
  voiceAvailable: boolean;
  failedReads: number;
  shortcutEnabled: boolean;
  batteryRestricted: boolean;
}

export interface TimerState {
  running: boolean;
  started: boolean;
  elapsedMs: number;
  startedAt: number;
}

interface CopilotNativeModule {
  getStatus(): CopilotStatus;
  setEnabled(value: boolean): void;
  getPreferences(): string;
  setPreferences(json: string): void;
  setRegional(json: string): void;
  getAppLanguage(): string | null;
  setAppLanguage(tag: string | null): boolean;
  setTargets(costPerKm: number, targetPerKmCents: number, targetPerHourCents: number): void;
  resetCardPosition(): void;
  getHistory(): Promise<string>;
  setHistory(json: string): Promise<void>;
  clearHistory(): Promise<void>;
  getOffers(from: number, to: number): Promise<string>;
  getRecentOffers(limit: number): Promise<string>;
  setOfferStatus(timestamp: number, status: string): Promise<void>;
  openAccessibilitySettings(): void;
  openAppSettings(): void;
  openOverlaySettings(): void;
  openVoiceSettings(): void;
  openBatterySettings(): void;
  openShortcutSettings(): void;
  testOffer(text: string, source: string, delayMs: number): boolean;
  testNotification(text: string, source: string): boolean;
  setDiagnosticsEnabled(value: boolean): void;
  getDiagnostics(): string[];
  getTimer(): TimerState;
  startTimer(): TimerState;
  pauseTimer(): TimerState;
  resetTimer(): TimerState;
  startFloating(): boolean;
  stopFloating(): void;
  setAppInForeground(value: boolean): void;
}

const native = requireOptionalNativeModule<CopilotNativeModule>('Copilot');

function requireModule(): CopilotNativeModule {
  if (!native) throw new Error('Módulo nativo do Copiloto indisponível nesta versão.');
  return native;
}

export const copilot = {
  getStatus: () => requireModule().getStatus(),
  setEnabled: (value: boolean) => requireModule().setEnabled(value),
  getPreferences: () => parsePreferences(requireModule().getPreferences()),
  setPreferences: (preferences: CopilotPreferences) => requireModule().setPreferences(JSON.stringify(preferences)),
  getAppLanguage: () => native?.getAppLanguage() ?? null,
  setAppLanguage: (tag: string | null) => native?.setAppLanguage(tag) ?? false,
  setRegional: (regional: CopilotRegional) => requireModule().setRegional(JSON.stringify(copilotRegionalSchema.parse(regional))),
  setTargets: (costPerKm: number, targetPerKmCents: number, targetPerHourCents: number) =>
    requireModule().setTargets(costPerKm, targetPerKmCents, targetPerHourCents),
  resetCardPosition: () => requireModule().resetCardPosition(),
  getOffers: async (from: number, to: number) => parseHistory(await requireModule().getOffers(from, Math.min(to, Number.MAX_SAFE_INTEGER))),
  getRecentOffers: async (limit: number) => parseHistory(await requireModule().getRecentOffers(limit)),
  clearHistory: () => requireModule().clearHistory(),
  setOfferStatus: (timestamp: number, status: 'accepted' | 'declined') => requireModule().setOfferStatus(timestamp, status),
  exportState: async () => ({ preferences: requireModule().getPreferences(), history: await requireModule().getHistory() }),
  importState: async (state: { preferences: string; history: string }) => {
    requireModule().setPreferences(state.preferences);
    await requireModule().setHistory(state.history);
  },
  openAccessibilitySettings: () => requireModule().openAccessibilitySettings(),
  openAppSettings: () => requireModule().openAppSettings(),
  openOverlaySettings: () => requireModule().openOverlaySettings(),
  openVoiceSettings: () => requireModule().openVoiceSettings(),
  openBatterySettings: () => requireModule().openBatterySettings(),
  openShortcutSettings: () => requireModule().openShortcutSettings(),
  testOffer: (text: string, source: string, delayMs = 0) => requireModule().testOffer(text, source, delayMs),
  testNotification: (text: string, source: string) => requireModule().testNotification(text, source),
  setDiagnosticsEnabled: (value: boolean) => requireModule().setDiagnosticsEnabled(value),
  getDiagnostics: () => requireModule().getDiagnostics(),
  getTimer: () => requireModule().getTimer(),
  startTimer: () => requireModule().startTimer(),
  pauseTimer: () => requireModule().pauseTimer(),
  resetTimer: () => requireModule().resetTimer(),
  startFloating: () => requireModule().startFloating(),
  stopFloating: () => requireModule().stopFloating(),
  setAppInForeground: (value: boolean) => requireModule().setAppInForeground(value),
};
