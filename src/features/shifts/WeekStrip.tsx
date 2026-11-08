import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { WeekDay } from '@domain/shift/days';
import { useFormat } from '@shared/i18n/format';
import { fonts, MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon } from '@shared/ui/AppIcon';
import { AppText } from '@shared/ui/primitives';
import { today, weekdayOf } from '@shared/utils/dates';

const SHORT_WEEKDAY = 3;
const DOT = 6;
const DAY_HEIGHT = 60;
const DAY_MAX_FONT_SCALE = 1.3;

interface WeekStripProps {
  days: WeekDay[];
  selected: string | null;
  onSelect: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function WeekStrip({ days, selected, onSelect, onPrevious, onNext }: WeekStripProps) {
  const colors = useTheme();
  const format = useFormat();
  const { t } = useTranslation('shifts');
  const now = today();
  const first = days[0]?.date ?? now;
  const last = days[days.length - 1]?.date ?? now;
  const nextDisabled = last >= now;

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('week.previousWeek')} onPress={onPrevious} style={[styles.arrow, styles.back]}>
          <AppIcon name="chevron" color={colors.text} size={20} />
        </Pressable>
        <AppText bold>{t('week.weekRange', { start: format.dayMonth(first), end: format.dayMonth(last) })}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('week.nextWeek')}
          accessibilityState={{ disabled: nextDisabled }}
          disabled={nextDisabled}
          onPress={onNext}
          style={[styles.arrow, nextDisabled && styles.disabled]}
        >
          <AppIcon name="chevron" color={colors.text} size={20} />
        </Pressable>
      </View>
      <View style={styles.days}>
        {days.map((day) => {
          const isToday = day.date === now;
          const future = day.date > now;
          const chosen = selected === day.date;
          const dark = chosen || (isToday && selected === null);
          const name = format.weekday(weekdayOf(day.date));
          const label =
            day.profitCents === null
              ? t('week.dayEmpty', { day: format.date(day.date) })
              : t('week.dayProfit', { day: format.date(day.date), profit: format.money(day.profitCents) });
          const dot = day.profitCents === null ? null : day.profitCents < 0 ? colors.negative : colors.positive;
          return (
            <Pressable
              key={day.date}
              accessibilityRole="button"
              accessibilityLabel={`${name}, ${label}`}
              accessibilityState={{ selected: chosen, disabled: future }}
              disabled={future}
              onPress={() => onSelect(day.date)}
              style={[styles.day, { backgroundColor: dark ? colors.primary : future ? 'transparent' : colors.surface }]}
            >
              <AppText variant="caption" maxFontSizeMultiplier={DAY_MAX_FONT_SCALE} style={{ color: dark ? colors.onPrimary : colors.textMuted }}>
                {isToday ? t('week.today') : name.slice(0, SHORT_WEEKDAY).toLocaleLowerCase()}
              </AppText>
              <AppText
                bold
                maxFontSizeMultiplier={DAY_MAX_FONT_SCALE}
                style={[styles.number, { color: dark ? colors.onPrimary : future ? colors.textMuted : colors.text }]}
              >
                {Number(day.date.slice(-2))}
              </AppText>
              <View style={[styles.dot, dot ? { backgroundColor: dark && dot === colors.positive ? colors.onPrimary : dot } : null]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: MIN_TOUCH_TARGET, height: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  back: { transform: [{ scaleX: -1 }] },
  disabled: { opacity: 0.35 },
  days: { flexDirection: 'row', gap: spacing.xs },
  day: { flex: 1, minHeight: DAY_HEIGHT, paddingVertical: spacing.sm, borderRadius: radius.md - 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  number: { fontFamily: fonts.bold },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill },
});
