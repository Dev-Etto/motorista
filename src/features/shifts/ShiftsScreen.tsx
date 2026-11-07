import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildCalendar } from '@domain/calendar/calendar';
import { computeShift } from '@domain/shift/shift';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useMonthCursor } from '@shared/hooks/useMonthCursor';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { confirmAction } from '@shared/ui/dialog';
import { MonthCalendar } from '@shared/ui/MonthCalendar';
import { MonthSwitcher } from '@shared/ui/MonthSwitcher';
import { AppText, Button, Card, EmptyState, ListRow, Screen } from '@shared/ui/primitives';
import { monthKey } from '@shared/utils/dates';
import { profitTone } from '@shared/utils/format';
import { ActiveShiftCard, NewShiftButton } from './ActiveShift';
import { loadMonth, removeLooseExpense } from './shiftQueries';

export default function ShiftsScreen() {
  const router = useRouter();
  const { t } = useTranslation(['shifts', 'expenses', 'common']);
  const format = useFormat();
  const cursor = useMonthCursor();
  const month = useAsyncData(() => loadMonth(cursor.date), [cursor.date]);
  const { data, reload } = month;
  const [pickedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDate = pickedDate?.startsWith(monthKey(cursor.date)) ? pickedDate : null;
  const allShifts = useMemo(() => data?.shifts ?? [], [data?.shifts]);
  const shifts = selectedDate ? allShifts.filter((shift) => shift.date === selectedDate) : allShifts;
  const calendar = useMemo(
    () =>
      buildCalendar(
        cursor.date,
        allShifts.map((shift) => ({ date: shift.date, profitCents: computeShift(shift).profitCents })),
        format.profile.firstWeekday,
      ),
    [cursor.date, allShifts, format.profile.firstWeekday],
  );
  const expenses = data?.expenses ?? [];

  const confirmDeleteExpense = (id: number, label: string, cents: number) => {
    confirmAction({
      title: t('list.deleteExpense.title', { label }),
      message: t('list.deleteExpense.message', { amount: format.money(cents) }),
      actionLabel: t('common:actions.delete'),
      onConfirm: async () => {
        await removeLooseExpense(id);
        await reload();
      },
    });
  };

  return (
    <Screen>
      <MonthSwitcher date={cursor.date} onPrevious={cursor.previous} onNext={cursor.next} />
      <ActiveShiftCard />
      <NewShiftButton />
      <Button label={t('list.addExpense')} variant="secondary" onPress={() => router.push('/expense/new')} />

      <Card>
        <MonthCalendar weeks={calendar} selectedDate={selectedDate} onSelect={(date) => setSelectedDate((current) => (current === date ? null : date))} />
      </Card>

      <AsyncBoundary state={month}>
        {() => (
          <>
            {shifts.length === 0 ? (
              <EmptyState illustration="empty" title={selectedDate ? t('list.emptyDay') : t('list.emptyMonth')} message={t('list.emptyMessage')} />
            ) : (
              <Card title={selectedDate ? t('list.dayTitle', { date: format.date(selectedDate) }) : t('list.title')}>
                {shifts.map((shift) => {
                  const { profitCents } = computeShift(shift);
                  const subtitle = { gross: format.money(shift.grossCents), duration: format.duration(shift.minutes) };
                  return (
                    <ListRow
                      key={shift.id}
                      title={format.date(shift.date)}
                      subtitle={shift.partial ? t('list.shiftSubtitlePartial', subtitle) : t('list.shiftSubtitle', subtitle)}
                      value={format.money(profitCents)}
                      valueTone={profitTone(profitCents)}
                      onPress={() => router.push(`/shift/${shift.id}`)}
                    />
                  );
                })}
              </Card>
            )}

            {expenses.length === 0 ? null : (
              <Card title={t('list.looseTitle')}>
                <AppText variant="caption" tone="muted">
                  {t('list.looseHint')}
                </AppText>
                {expenses.map((expense) => (
                  <ListRow
                    key={expense.id}
                    title={t(`expenses:category.${expense.category}`)}
                    subtitle={format.date(expense.date)}
                    value={format.money(expense.cents)}
                    onPress={() => confirmDeleteExpense(expense.id, t(`expenses:category.${expense.category}`), expense.cents)}
                  />
                ))}
              </Card>
            )}
          </>
        )}
      </AsyncBoundary>
    </Screen>
  );
}
