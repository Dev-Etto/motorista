import { useLocalSearchParams, useRouter } from 'expo-router';
import { countsAgainstProfit, EXPENSE_LABELS } from '@/domain/expense/expense';
import { summarizeOutcomes } from '@/domain/offer/offerLog';
import { computeShift } from '@/domain/shift/shift';
import { OutcomeSummaryCard } from '@/features/offers';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { confirmAction, IRREVERSIBLE_MESSAGE } from '@/shared/platform/confirm';
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary';
import { AppText, Button, Card, EmptyState, ListRow, Screen } from '@/shared/ui/primitives';
import { formatDate, formatDuration } from '@/shared/utils/dates';
import { formatKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { loadShiftDetail, removeShift, ShiftDetail } from './shiftQueries';
import { ShiftResultCard } from './ShiftResultCard';

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shiftId = Number(id);
  const detail = useAsyncData(() => loadShiftDetail(shiftId), [shiftId]);

  return (
    <Screen>
      <AsyncBoundary state={detail} empty={<EmptyState title="Jornada não encontrada" message="Ela pode ter sido excluída." />}>
        {(data) => <ShiftDetailContent shiftId={shiftId} detail={data} />}
      </AsyncBoundary>
    </Screen>
  );
}

function ShiftDetailContent({ shiftId, detail }: { shiftId: number; detail: ShiftDetail }) {
  const router = useRouter();
  const { shift, earnings, expenses, dayOffers } = detail;
  const result = computeShift({
    grossCents: earnings.reduce((total, earning) => total + earning.cents, 0),
    km: shift.km,
    minutes: shift.minutes,
    expensesCents: expenses.filter((expense) => countsAgainstProfit(expense.category)).reduce((total, expense) => total + expense.cents, 0),
    costPerKm: shift.costPerKm,
  });

  const confirmDelete = () => {
    confirmAction({
      title: 'Excluir jornada?',
      message: IRREVERSIBLE_MESSAGE,
      actionLabel: 'Excluir',
      onConfirm: async () => {
        await removeShift(shiftId);
        router.back();
      },
    });
  };

  return (
    <>
      <AppText variant="title" bold>
        {formatDate(shift.date)}
      </AppText>
      <ShiftResultCard result={result} />
      <Card title="Detalhes">
        <ListRow title="Tempo" value={formatDuration(shift.minutes)} />
        <ListRow title="Distância" value={formatKm(shift.km)} />
        <ListRow title="Custo por km do dia" value={formatBRL(shift.costPerKm)} />
        {earnings.map((earning) => (
          <ListRow key={earning.platformId} title={earning.name} value={formatBRL(earning.cents)} />
        ))}
        {expenses.map((expense) => (
          <ListRow key={expense.id} title={EXPENSE_LABELS[expense.category]} value={formatBRL(expense.cents)} />
        ))}
      </Card>
      {dayOffers.length > 0 ? <OutcomeSummaryCard title="Ofertas do dia" summary={summarizeOutcomes(dayOffers)} /> : null}
      <Button label="Editar" variant="secondary" onPress={() => router.push({ pathname: '/shift/new', params: { id: shiftId } })} />
      <Button label="Excluir" variant="danger" onPress={confirmDelete} />
    </>
  );
}
