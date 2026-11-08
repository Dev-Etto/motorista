import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { monthKey, today } from '@shared/utils/dates';
import { AppText, Button } from './primitives';

export type SwitcherPeriod = 'week' | 'month' | 'year';

interface PeriodSwitcherProps {
  label: string;
  period: SwitcherPeriod;
  onPrevious: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

export function PeriodSwitcher({ label, period, onPrevious, onNext, nextDisabled = false }: PeriodSwitcherProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <Button label="‹" accessibilityLabel={t('periodSwitcher.previous', { context: period })} variant="secondary" onPress={onPrevious} />
      <AppText bold>{label}</AppText>
      <Button label="›" accessibilityLabel={t('periodSwitcher.next', { context: period })} variant="secondary" disabled={nextDisabled} onPress={onNext} />
    </View>
  );
}

export function MonthSwitcher({ date, onPrevious, onNext }: { date: string; onPrevious: () => void; onNext: () => void }) {
  const format = useFormat();
  return (
    <PeriodSwitcher label={format.month(date)} period="month" onPrevious={onPrevious} onNext={onNext} nextDisabled={monthKey(date) >= monthKey(today())} />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
});
