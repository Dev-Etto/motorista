import { StyleSheet, View } from 'react-native';
import { spacing } from '@/shared/theme/theme';
import { formatMonth } from '@/shared/utils/dates';
import { AppText, Button } from './primitives';

export function MonthSwitcher({ date, onPrevious, onNext }: { date: string; onPrevious: () => void; onNext: () => void }) {
  return (
    <View style={styles.row}>
      <Button label="‹" variant="secondary" onPress={onPrevious} />
      <AppText bold>{formatMonth(date)}</AppText>
      <Button label="›" variant="secondary" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
});
