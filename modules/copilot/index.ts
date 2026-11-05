import { requireOptionalNativeModule } from 'expo-modules-core';

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

export type PrimaryMetric = 'perKm' | 'profit';
export type CardLayout = 'complete' | 'summary';
export type CardSize = 'compact' | 'large' | 'extra';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface CopilotPreferences {
  voice: boolean;
  card: boolean;
  notification: boolean;
  primaryMetric: PrimaryMetric;
  cardLayout: CardLayout;
  cardSize: CardSize;
  theme: ThemeMode;
  durationSeconds: number;
  monitoredPackages: string[];
}

export interface TimerState {
  running: boolean;
  started: boolean;
  elapsedMs: number;
  startedAt: number;
}

export interface OfferHistoryEntry {
  timestamp: number;
  source: string;
  valueCents: number;
  km: number;
  minutes: number;
  perKmCents: number;
  perHourCents: number;
  profitCents?: number;
  score?: number;
  reason?: string;
  color: 'green' | 'yellow' | 'red' | 'neutral';
}

interface CopilotNativeModule {
  getStatus(): CopilotStatus;
  setEnabled(value: boolean): void;
  getPreferences(): string;
  setPreferences(json: string): void;
  setTargets(costPerKm: number, targetPerKmCents: number, targetPerHourCents: number): void;
  resetCardPosition(): void;
  getHistory(): string;
  setHistory(json: string): void;
  clearHistory(): void;
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
  getPreferences: () => JSON.parse(requireModule().getPreferences()) as CopilotPreferences,
  setPreferences: (preferences: CopilotPreferences) => requireModule().setPreferences(JSON.stringify(preferences)),
  setTargets: (costPerKm: number, targetPerKmCents: number, targetPerHourCents: number) =>
    requireModule().setTargets(costPerKm, targetPerKmCents, targetPerHourCents),
  resetCardPosition: () => requireModule().resetCardPosition(),
  getHistory: () => JSON.parse(requireModule().getHistory()) as OfferHistoryEntry[],
  clearHistory: () => requireModule().clearHistory(),
  exportState: () => ({ preferences: requireModule().getPreferences(), history: requireModule().getHistory() }),
  importState: (state: { preferences: string; history: string }) => {
    requireModule().setPreferences(state.preferences);
    requireModule().setHistory(state.history);
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
