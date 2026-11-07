import { copilot } from '@modules/copilot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { countsAgainstProfit, EXPENSE_LABELS } from '@/domain/expense/expense';
import { summarizeOutcomes } from '@/domain/offer/offerLog';
import { computeShift } from '@/domain/shift/shift';
import { OutcomeSummaryCard } from '@/features/offers/OutcomeSummaryCard';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary';
import { AppText, Button, Card, EmptyState, ListRow, Screen } from '@/shared/ui/primitives';
import { dayRange, formatDate, formatDuration } from '@/shared/utils/dates';
import { confirmAction } from '@/shared/utils/confirm';
import { formatKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { ShiftResultCard } from './ShiftResultCard';

async function loadShiftDetail(shiftId: number) {
  const detail = await shiftRepository.findById(shiftId);
  if (!detail) return null;

  const { from, to } = dayRange(detail.shift.date);
  return { ...detail, dayOffers: await copilot.getOffers(from, to) };
}

type ShiftDetail = NonNullable<Awaited<ReturnType<typeof loadShiftDetail>>>;

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
    costPerKm: shift.cost_per_km,
  });

  const confirmDelete = () => {
    confirmAction({
      title: 'Excluir jornada?',
      message: 'Essa ação não pode ser desfeita.',
      actionLabel: 'Excluir',
      onConfirm: async () => {
        await shiftRepository.remove(shiftId);
        router.back();
      },
    });
  };

  return (
    <>
      <AppText variant="title" bold>{formatDate(shift.date)}</AppText>
      <ShiftResultCard result={result} />
      <Card title="Detalhes">
        <ListRow title="Tempo" value={formatDuration(shift.minutes)} />
        <ListRow title="Distância" value={formatKm(shift.km)} />
        <ListRow title="Custo por km do dia" value={formatBRL(shift.cost_per_km)} />
        {earnings.map((earning) => (
          <ListRow key={earning.platform_id} title={earning.name} value={formatBRL(earning.cents)} />
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
