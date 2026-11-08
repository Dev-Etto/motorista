import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildCalendar } from '@domain/calendar/calendar';
import { groupShiftsByDay } from '@domain/shift/days';
import { computeShift } from '@domain/shift/shift';
import { ReportSummary } from '@features/reports';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useMonthCursor } from '@shared/hooks/useMonthCursor';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { showDialog } from '@shared/ui/dialog';
import { MonthCalendar } from '@shared/ui/MonthCalendar';
import { MonthSwitcher } from '@shared/ui/MonthSwitcher';
import { AppText, Button, Card, EmptyState, ListRow, Screen, Segmented } from '@shared/ui/primitives';
import { monthKey } from '@shared/utils/dates';
import { ShiftDayCard } from './ShiftDayCard';
import { loadMonth } from './shiftQueries';

type ShiftsView = 'list' | 'summary';

export default function ShiftsScreen() {
  const { t } = useTranslation('shifts');
  const [view, setView] = useState<ShiftsView>('list');
  const views = [
    { value: 'list' as const, label: t('view.list') },
    { value: 'summary' as const, label: t('view.summary') },
  ];

  return (
    <Screen>
      <Segmented label={t('view.label')} value={view} options={views} onChange={setView} />
      {view === 'list' ? <ShiftList /> : <ReportSummary />}
    </Screen>
  );
}

function ShiftList() {
  const router = useRouter();
  const { t } = useTranslation(['shifts', 'expenses', 'common']);
  const format = useFormat();
  const cursor = useMonthCursor();
  const month = useAsyncData(() => loadMonth(cursor.date), [cursor.date]);
  const { data } = month;
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
  const days = useMemo(() => groupShiftsByDay(shifts.map((shift) => ({ ...shift, profitCents: computeShift(shift).profitCents }))), [shifts]);
  const allExpenses = data?.expenses ?? [];
  const expenses = selectedDate ? allExpenses.filter((expense) => expense.date === selectedDate) : allExpenses;

  const chooseWhatToAdd = () => {
    showDialog({
      title: t('list.add.title'),
      actions: [
        { label: t('list.add.shift'), tone: 'primary', onPress: () => router.push('/shift/new') },
        { label: t('list.add.fuel'), tone: 'secondary', onPress: () => router.push({ pathname: '/expense/new', params: { category: 'fuel' } }) },
        { label: t('list.add.other'), tone: 'secondary', onPress: () => router.push({ pathname: '/expense/new', params: { category: 'other' } }) },
        { label: t('common:actions.cancel'), tone: 'secondary' },
      ],
    });
  };

  return (
    <>
      <MonthSwitcher date={cursor.date} onPrevious={cursor.previous} onNext={cursor.next} />
      <Button label={t('list.add.button')} onPress={chooseWhatToAdd} />

      <Card>
        <MonthCalendar weeks={calendar} selectedDate={selectedDate} onSelect={(date) => setSelectedDate((current) => (current === date ? null : date))} />
      </Card>

      <AsyncBoundary state={month}>
        {() => (
          <>
            {shifts.length === 0 ? (
              <EmptyState icon="shifts" title={selectedDate ? t('list.emptyDay') : t('list.emptyMonth')} message={t('list.emptyMessage')} />
            ) : (
              days.map((day) => <ShiftDayCard key={day.date} day={day} />)
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
                    chevron
                    onPress={() => router.push({ pathname: '/expense/new', params: { id: String(expense.id) } })}
                  />
                ))}
              </Card>
            )}
          </>
        )}
      </AsyncBoundary>
    </>
  );
}
