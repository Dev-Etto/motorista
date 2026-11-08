import { useTranslation } from 'react-i18next';
import { OutcomeFilter } from '@domain/offer/offerLog';
import { DateField } from '@shared/ui/DateField';
import { confirmAction } from '@shared/ui/dialog';
import { FilterChips } from '@shared/ui/FilterChips';
import { Button, Card, EmptyState, Notice, Screen, ToggleRow } from '@shared/ui/primitives';
import { toJsDate } from '@shared/utils/dates';
import { EstimateCard } from './EstimateCard';
import { OFFER_PERIODS } from './offerPeriod';
import { OfferRow } from './OfferRow';
import { OutcomeSummaryCard } from './OutcomeSummaryCard';
import { ALL_SOURCES, useOffers } from './useOffers';

const OUTCOMES: OutcomeFilter[] = ['accepted', 'notAccepted', 'all'];

export default function OffersScreen() {
  const { t } = useTranslation(['offers', 'common']);
  const offers = useOffers();
  const periodOptions = OFFER_PERIODS.map((value) => ({ value, label: t(`screen.period.${value}`) }));
  const outcomeOptions = OUTCOMES.map((value) => ({ value, label: t(`screen.outcome.${value}`) }));
  const sourceOptions = [{ value: ALL_SOURCES, label: t('screen.allSources') }, ...offers.sources.map((source) => ({ value: source, label: source }))];

  const confirmClear = () => {
    confirmAction({
      title: t('screen.clearConfirm.title'),
      message: t('screen.clearConfirm.message'),
      actionLabel: t('common:actions.clear'),
      onConfirm: offers.clear,
    });
  };

  return (
    <Screen>
      <Card>
        <FilterChips label={t('screen.periodLabel')} value={offers.period} options={periodOptions} onChange={offers.setPeriod} />
        {offers.period === 'custom' ? (
          <>
            <DateField
              label={t('screen.from')}
              value={offers.custom.start}
              maximumDate={toJsDate(offers.custom.end)}
              onChange={(start) => start && offers.setCustom({ ...offers.custom, start })}
            />
            <DateField
              label={t('screen.to')}
              value={offers.custom.end}
              minimumDate={toJsDate(offers.custom.start)}
              maximumDate={new Date()}
              onChange={(end) => end && offers.setCustom({ ...offers.custom, end })}
            />
          </>
        ) : null}
        {offers.sources.length > 1 ? (
          <FilterChips label={t('screen.appLabel')} value={offers.source} options={sourceOptions} onChange={offers.setSource} />
        ) : null}
      </Card>
      {offers.estimating ? <EstimateCard estimate={offers.estimate} /> : null}
      {offers.estimating ? <OutcomeSummaryCard title={t('screen.outcomeTitle')} summary={offers.summary} /> : null}
      <Card title={t('screen.listTitle')}>
        <FilterChips label={t('screen.outcomeLabel')} value={offers.outcome} options={outcomeOptions} onChange={offers.setOutcome} />
        {offers.offers.map((entry) => (
          <OfferRow key={entry.timestamp} entry={entry} onCorrected={offers.reload} />
        ))}
        {offers.hasMore ? <Button label={t('screen.seeMore')} variant="secondary" onPress={offers.showMore} /> : null}
      </Card>
      {offers.offers.length === 0 ? <EmptyState title={t('screen.emptyTitle')} message={t('screen.emptyMessage')} /> : null}
      <Notice tone="accent" message={t('screen.autoRecord')} />
      <Card title={t('screen.settingsTitle')}>
        <ToggleRow label={t('screen.estimating')} hint={t('screen.estimatingHint')} value={offers.estimating} onChange={offers.toggleEstimating} />
        <Button label={t('screen.clearButton')} variant="danger" onPress={confirmClear} />
      </Card>
    </Screen>
  );
}
