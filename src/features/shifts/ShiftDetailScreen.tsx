import { useLocalSearchParams, useRouter } from 'expo-router';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { countsAgainstProfit, EXPENSE_LABELS } from '@/domain/expense/expense';
import { computeShift } from '@/domain/shift/shift';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { AppText, Button, Card, ListRow, Screen } from '@/shared/ui/primitives';
import { formatDate, formatDuration } from '@/shared/utils/dates';
import { confirmAction } from '@/shared/utils/confirm';
import { formatKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { ShiftResultCard } from './ShiftResultCard';

export default function ShiftDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shiftId = Number(id);
  const { data } = useAsyncData(() => shiftRepository.findById(shiftId), [shiftId]);

  if (!data) return <Screen>{null}</Screen>;

  const { shift, earnings, expenses } = data;
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
    <Screen>
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
      <Button label="Editar" variant="secondary" onPress={() => router.push({ pathname: '/shift/new', params: { id: shiftId } })} />
      <Button label="Excluir" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}
