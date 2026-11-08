import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { countsAgainstProfit } from '@domain/expense/expense';
import { buildWeek, groupShiftsByDay } from '@domain/shift/days';
import { computeShift } from '@domain/shift/shift';
import { ReportSummary } from '@features/reports';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useWeekCursor } from '@shared/hooks/useWeekCursor';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { showDialog } from '@shared/ui/dialog';
import { Button, EmptyState, Screen, Segmented } from '@shared/ui/primitives';
import { ShiftDayCard } from './ShiftDayCard';
import { loadPeriod } from './shiftQueries';
import { WeekStrip } from './WeekStrip';

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
  const { t } = useTranslation(['shifts', 'common']);
  const format = useFormat();
  const week = useWeekCursor(format.profile.firstWeekday);
  const period = useAsyncData(() => loadPeriod(week.start, week.end), [week.start, week.end]);
  const [pickedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDate = pickedDate && pickedDate >= week.start && pickedDate <= week.end ? pickedDate : null;
  const allDays = useMemo(
    () =>
      groupShiftsByDay(
        (period.data?.shifts ?? []).map((shift) => ({ ...shift, profitCents: computeShift(shift).profitCents })),
        (period.data?.expenses ?? []).map((expense) => ({ ...expense, countable: countsAgainstProfit(expense.category) })),
      ),
    [period.data],
  );
  const strip = useMemo(() => buildWeek(week.start, allDays), [week.start, allDays]);
  const days = selectedDate ? allDays.filter((day) => day.date === selectedDate) : allDays;

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
      <WeekStrip
        days={strip}
        selected={selectedDate}
        onSelect={(date) => setSelectedDate((current) => (current === date ? null : date))}
        onPrevious={week.previous}
        onNext={week.next}
      />
      <AsyncBoundary state={period}>
        {() =>
          days.length === 0 ? (
            <EmptyState icon="shifts" title={selectedDate ? t('list.emptyDay') : t('week.emptyWeek')} message={t('list.emptyMessage')} />
          ) : (
            <>
              {days.map((day) => (
                <ShiftDayCard key={day.date} day={day} />
              ))}
            </>
          )
        }
      </AsyncBoundary>
      <Button label={t('list.add.button')} variant="secondary" onPress={chooseWhatToAdd} />
    </>
  );
}
