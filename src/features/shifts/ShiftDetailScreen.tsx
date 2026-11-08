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
import { PlatformBadge } from '@shared/ui/PlatformBadge';
import { AppText, Button, Card, EmptyState, ListRow, Notice, Screen, Stat, StatGrid } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';
import { loadShiftDetail, removeShift, ShiftDetail } from './shiftQueries';

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
  const { shift, earnings, expenses, dayOffers, vehicleName } = detail;
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
      message: t('detail.deleteMessage', { date: format.date(shift.date), value: format.money(result.grossCents) }),
      actionLabel: t('common:actions.delete'),
      onConfirm: async () => {
        await removeShift(shiftId);
        router.back();
      },
    });
  };

  const heading = [t('detail.profitLabel'), shift.startHour === null ? null : format.hourOfDay(shift.startHour), vehicleName].filter(Boolean).join(' · ');
  const minus = (cents: number) => `− ${format.money(cents)}`;

  return (
    <>
      <AppText tone="muted">{format.longDay(shift.date)}</AppText>
      <Card>
        <AppText bold tone="muted" accessibilityRole="header">
          {heading}
        </AppText>
        <AppText variant="display" bold tone={profitTone(result.profitCents)}>
          {format.money(result.profitCents)}
        </AppText>
        <StatGrid columns={3}>
          <Stat label={t('detail.time')} value={format.duration(shift.minutes)} />
          <Stat label={t('detail.distance')} value={format.distance(shift.km)} />
          <Stat label={t('result.profitPerHour')} value={format.perHour(result.profitPerHour)} />
        </StatGrid>
        {result.partial ? <Notice message={t('result.partial', { context: format.distanceUnit })} /> : null}
      </Card>
      <Card title={t('detail.math')}>
        <ListRow title={t('detail.earnings')} value={format.money(result.grossCents)} />
        <ListRow
          title={t('detail.vehicleCost', { context: format.distanceUnit, cost: format.perDistanceAmount(shift.costPerKm) })}
          value={minus(result.vehicleCostCents)}
          valueTone="muted"
        />
        {expenses.map((expense) => (
          <ListRow key={expense.id} title={t(`expenses:category.${expense.category}`)} value={minus(expense.cents)} valueTone="muted" />
        ))}
      </Card>
      {earnings.length > 0 ? (
        <Card title={t('detail.byPlatform')}>
          {earnings.map((earning) => (
            <ListRow
              key={earning.platformId}
              leading={<PlatformBadge name={earning.name} />}
              value={format.money(earning.cents)}
              accessibilityLabel={`${earning.name}, ${format.money(earning.cents)}`}
            />
          ))}
        </Card>
      ) : null}
      {dayOffers.length > 0 ? <OutcomeSummaryCard title={t('detail.dayOffers')} summary={summarizeOutcomes(dayOffers)} /> : null}
      <Button label={t('detail.edit')} variant="secondary" onPress={() => router.push({ pathname: '/shift/new', params: { id: shiftId } })} />
      <Button label={t('common:actions.delete')} variant="danger" onPress={confirmDelete} />
    </>
  );
}
