import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { expenseRepository } from '@/data/repositories/expenseRepository';
import { buildCalendar } from '@/domain/calendar/calendar';
import { computeShift } from '@/domain/shift/shift';
import { EXPENSE_LABELS } from '@/domain/expense/expense';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { useMonthCursor } from '@/shared/hooks/useMonthCursor';
import { MonthCalendar } from '@/shared/ui/MonthCalendar';
import { MonthSwitcher } from '@/shared/ui/MonthSwitcher';
import { ActiveShiftCard, NewShiftButton } from './ActiveShift';
import { Button, Card, EmptyState, ListRow, Screen } from '@/shared/ui/primitives';
import { formatDate, formatDuration, monthBounds } from '@/shared/utils/dates';
import { profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';

async function loadMonth(date: string) {
  const { start, end } = monthBounds(date);
  const [shifts, expenses] = await Promise.all([shiftRepository.listFacts(start, end), expenseRepository.listLoose(start, end)]);
  return { shifts, expenses };
}

export default function ShiftsScreen() {
  const router = useRouter();
  const cursor = useMonthCursor();
  const { data } = useAsyncData(() => loadMonth(cursor.date), [cursor.date]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const allShifts = useMemo(() => data?.shifts ?? [], [data?.shifts]);
  const shifts = selectedDate ? allShifts.filter((shift) => shift.date === selectedDate) : allShifts;
  const calendar = useMemo(
    () => buildCalendar(cursor.date, allShifts.map((shift) => ({ date: shift.date, profitCents: computeShift(shift).profitCents }))),
    [cursor.date, allShifts],
  );
  const expenses = data?.expenses ?? [];

  return (
    <Screen>
      <MonthSwitcher date={cursor.date} onPrevious={cursor.previous} onNext={cursor.next} />
      <ActiveShiftCard />
      <NewShiftButton />
      <Button label="Lançar despesa ou abastecimento" variant="secondary" onPress={() => router.push('/expense/new')} />

      <Card>
        <MonthCalendar
          weeks={calendar}
          selectedDate={selectedDate}
          onSelect={(date) => setSelectedDate((current) => (current === date ? null : date))}
        />
      </Card>

      {shifts.length === 0 ? (
        <EmptyState
          illustration="empty"
          title={selectedDate ? 'Nenhuma jornada neste dia' : 'Nenhuma jornada neste mês'}
          message="Registre sua primeira jornada para ver seu lucro real."
        />
      ) : (
        <Card title={selectedDate ? `Jornadas de ${formatDate(selectedDate)}` : 'Jornadas'}>
          {shifts.map((shift) => {
            const { profitCents } = computeShift(shift);
            return (
              <ListRow
                key={shift.id}
                title={formatDate(shift.date)}
                subtitle={`${formatBRL(shift.grossCents)} em ${formatDuration(shift.minutes)}${shift.partial ? ' • parcial' : ''}`}
                value={formatBRL(profitCents)}
                valueTone={profitTone(profitCents)}
                onPress={() => router.push(`/shift/${shift.id}`)}
              />
            );
          })}
        </Card>
      )}

      {expenses.length === 0 ? null : (
        <Card title="Lançamentos avulsos">
          {expenses.map((expense) => (
            <ListRow
              key={expense.id}
              title={EXPENSE_LABELS[expense.category]}
              subtitle={formatDate(expense.date)}
              value={formatBRL(expense.cents)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
