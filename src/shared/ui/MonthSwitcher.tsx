import { StyleSheet, View } from 'react-native';
import { spacing } from '@/shared/theme/theme';
import { formatMonth } from '@/shared/utils/dates';
import { AppText, Button } from './primitives';

interface PeriodSwitcherProps {
  label: string;
  noun: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function PeriodSwitcher({ label, noun, onPrevious, onNext }: PeriodSwitcherProps) {
  return (
    <View style={styles.row}>
      <Button label="‹" accessibilityLabel={`${noun} anterior`} variant="secondary" onPress={onPrevious} />
      <AppText bold>{label}</AppText>
      <Button label="›" accessibilityLabel={`Próximo período: ${noun.toLowerCase()}`} variant="secondary" onPress={onNext} />
    </View>
  );
}

export function MonthSwitcher({ date, onPrevious, onNext }: { date: string; onPrevious: () => void; onNext: () => void }) {
  return <PeriodSwitcher label={formatMonth(date)} noun="Mês" onPrevious={onPrevious} onNext={onNext} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
});
