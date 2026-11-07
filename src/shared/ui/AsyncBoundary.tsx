import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AsyncData } from '@/shared/hooks/useAsyncData';
import { spacing, useTheme } from '@/shared/theme/theme';
import { Button, Card, Notice } from './primitives';

interface AsyncBoundaryProps<T> {
  state: AsyncData<T>;
  children: (data: NonNullable<T>) => ReactNode;
  empty?: ReactNode;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <Card>
      <Notice tone="negative" message={message} />
      <Button label="Tentar de novo" variant="secondary" onPress={onRetry} />
    </Card>
  );
}

export function AsyncBoundary<T>({ state, children, empty = null }: AsyncBoundaryProps<T>) {
  const colors = useTheme();
  const { data } = state;
  const pending = data === null || data === undefined;

  if (pending && state.error) return <LoadError message={state.error} onRetry={state.reload} />;
  if (pending && state.loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Carregando" color={colors.textMuted} />
      </View>
    );
  }
  if (pending) return <>{empty}</>;

  return (
    <>
      {state.error ? <LoadError message={state.error} onRetry={state.reload} /> : null}
      {children(data)}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
});
