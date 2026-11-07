import { i18n } from '@shared/i18n';

export type DialogActionTone = 'primary' | 'secondary' | 'danger';

export interface DialogAction {
  label: string;
  tone?: DialogActionTone;
  onPress?: () => void | Promise<void>;
}

export interface DialogOptions {
  title: string;
  message?: string;
  actions: DialogAction[];
}

interface ConfirmOptions {
  title: string;
  message: string;
  actionLabel: string;
  onConfirm: () => void | Promise<void>;
}

const listeners = new Set<() => void>();
let current: DialogOptions | null = null;

const emit = () => listeners.forEach((listener) => listener());

export const currentDialog = () => current;

export function subscribeDialog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showDialog(options: DialogOptions): void {
  current = options;
  emit();
}

export function closeDialog(): void {
  current = null;
  emit();
}

export function confirmAction({ title, message, actionLabel, onConfirm }: ConfirmOptions): void {
  showDialog({
    title,
    message,
    actions: [
      { label: i18n.t('actions.cancel'), tone: 'secondary' },
      { label: actionLabel, tone: 'danger', onPress: onConfirm },
    ],
  });
}
