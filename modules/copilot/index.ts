import { requireOptionalNativeModule } from 'expo-modules-core';

export interface CopilotStatus {
  enabled: boolean;
  voiceEnabled: boolean;
  accessibilityGranted: boolean;
  overlayGranted: boolean;
  floatingRunning: boolean;
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
  profitCents: number;
  color: 'green' | 'yellow' | 'red';
}

interface CopilotNativeModule {
  getStatus(): CopilotStatus;
  setEnabled(value: boolean): void;
  setVoiceEnabled(value: boolean): void;
  setTargets(costPerKm: number, targetPerKmCents: number, targetPerHourCents: number): void;
  getHistory(): string;
  clearHistory(): void;
  openAccessibilitySettings(): void;
  openAppSettings(): void;
  openOverlaySettings(): void;
  testOffer(text: string): boolean;
  setDiagnosticsEnabled(value: boolean): void;
  getDiagnostics(): string[];
  getTimer(): TimerState;
  startTimer(): TimerState;
  pauseTimer(): TimerState;
  resetTimer(): TimerState;
  startFloating(): boolean;
  stopFloating(): void;
}

const native = requireOptionalNativeModule<CopilotNativeModule>('Copilot');

function requireModule(): CopilotNativeModule {
  if (!native) throw new Error('Módulo nativo do Copiloto indisponível nesta versão.');
  return native;
}

export const copilot = {
  getStatus: () => requireModule().getStatus(),
  setEnabled: (value: boolean) => requireModule().setEnabled(value),
  setVoiceEnabled: (value: boolean) => requireModule().setVoiceEnabled(value),
  setTargets: (costPerKm: number, targetPerKmCents: number, targetPerHourCents: number) =>
    requireModule().setTargets(costPerKm, targetPerKmCents, targetPerHourCents),
  getHistory: () => JSON.parse(requireModule().getHistory()) as OfferHistoryEntry[],
  clearHistory: () => requireModule().clearHistory(),
  openAccessibilitySettings: () => requireModule().openAccessibilitySettings(),
  openAppSettings: () => requireModule().openAppSettings(),
  openOverlaySettings: () => requireModule().openOverlaySettings(),
  testOffer: (text: string) => requireModule().testOffer(text),
  setDiagnosticsEnabled: (value: boolean) => requireModule().setDiagnosticsEnabled(value),
  getDiagnostics: () => requireModule().getDiagnostics(),
  getTimer: () => requireModule().getTimer(),
  startTimer: () => requireModule().startTimer(),
  pauseTimer: () => requireModule().pauseTimer(),
  resetTimer: () => requireModule().resetTimer(),
  startFloating: () => requireModule().startFloating(),
  stopFloating: () => requireModule().stopFloating(),
};
