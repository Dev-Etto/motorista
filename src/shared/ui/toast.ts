export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
}

export interface Toast extends ToastOptions {
  id: number;
}

const listeners = new Set<() => void>();
let current: Toast | null = null;
let nextId = 0;

const emit = () => listeners.forEach((listener) => listener());

export const currentToast = () => current;

export function subscribeToast(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showToast(options: ToastOptions): void {
  current = { ...options, id: ++nextId };
  emit();
}

export function closeToast(id?: number): void {
  if (id !== undefined && current?.id !== id) return;

  current = null;
  emit();
}
