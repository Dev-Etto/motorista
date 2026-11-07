import { Alert } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  actionLabel: string;
  onConfirm: () => void | Promise<void>;
}

export function confirmAction({ title, message, actionLabel, onConfirm }: ConfirmOptions): void {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: () => void onConfirm() },
  ]);
}
