import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { countsAgainstProfit } from '@domain/expense/expense';
import { summarizeOutcomes } from '@domain/offer/offerLog';
import { computeShift } from '@domain/shift/shift';
import { OutcomeSummaryCard } from '@features/offers';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { confirmAction } from '@shared/ui/dialog';
import { AppText, Button, Card, EmptyState, ListRow, Screen } from '@shared/ui/primitives';
import { loadShiftDetail, removeShift, ShiftDetail } from './shiftQueries';
import { ShiftResultCard } from './ShiftResultCard';

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shiftId = Number(id);
  const detail = useAsyncData(() => loadShiftDetail(shiftId), [shiftId]);
  const { t } = useTranslation('shifts');

  return (
    <Screen>
      <AsyncBoundary state={detail} empty={<EmptyState title={t('detail.notFoundTitle')} message={t('detail.notFoundMessage')} />}>
        {(data) => <ShiftDetailContent shiftId={shiftId} detail={data} />}
      </AsyncBoundary>
    </Screen>
  );
}

function ShiftDetailContent({ shiftId, detail }: { shiftId: number; detail: ShiftDetail }) {
  const { t } = useTranslation(['shifts', 'expenses', 'common']);
  const format = useFormat();
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
      title: t('detail.deleteTitle'),
      message: t('common:irreversible'),
      actionLabel: t('common:actions.delete'),
      onConfirm: async () => {
        await removeShift(shiftId);
        router.back();
      },
    });
  };

  return (
    <>
      <AppText variant="title" bold>
        {format.date(shift.date)}
      </AppText>
      <ShiftResultCard result={result} />
      <Card title={t('detail.title')}>
        <ListRow title={t('detail.time')} value={format.duration(shift.minutes)} />
        <ListRow title={t('detail.distance')} value={format.distance(shift.km)} />
        <ListRow title={t('detail.costPerKm', { context: format.distanceUnit })} value={format.perDistanceAmount(shift.costPerKm)} />
        {earnings.map((earning) => (
          <ListRow key={earning.platformId} title={earning.name} value={format.money(earning.cents)} />
        ))}
        {expenses.map((expense) => (
          <ListRow key={expense.id} title={t(`expenses:category.${expense.category}`)} value={format.money(expense.cents)} />
        ))}
      </Card>
      {dayOffers.length > 0 ? <OutcomeSummaryCard title={t('detail.dayOffers')} summary={summarizeOutcomes(dayOffers)} /> : null}
      <Button label={t('detail.edit')} variant="secondary" onPress={() => router.push({ pathname: '/shift/new', params: { id: shiftId } })} />
      <Button label={t('common:actions.delete')} variant="danger" onPress={confirmDelete} />
    </>
  );
}
