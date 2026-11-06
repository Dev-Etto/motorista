interface FloatingStartState {
  floatingButton: boolean;
  overlayGranted: boolean;
  floatingRunning: boolean;
}

export function shouldStartFloating({ floatingButton, overlayGranted, floatingRunning }: FloatingStartState): boolean {
  return floatingButton && overlayGranted && !floatingRunning;
}
