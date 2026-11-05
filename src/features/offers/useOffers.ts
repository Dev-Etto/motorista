import { copilot } from '@modules/copilot';
import { useMemo, useState } from 'react';
import { estimateEarnings, filterOffers, inRange, listSources, OfferRange, OutcomeFilter, summarizeOutcomes } from '@/domain/offer/offerLog';
import { addDays, dayRange, today } from '@/shared/utils/dates';
import { useOfferHistory } from './useOfferHistory';

export type OfferPeriod = 'today' | 'yesterday' | 'week';

const ALL_SOURCES = 'all';
const PAGE_SIZE = 30;
const WEEK_DAYS = 6;

function periodRange(period: OfferPeriod): OfferRange {
  const date = today();
  if (period === 'today') return dayRange(date);
  if (period === 'yesterday') return dayRange(addDays(date, -1));
  return { from: dayRange(addDays(date, -WEEK_DAYS)).from, to: dayRange(date).to };
}

export function useOffers() {
  const history = useOfferHistory();
  const [period, setPeriod] = useState<OfferPeriod>('today');
  const [outcome, setOutcome] = useState<OutcomeFilter>('all');
  const [source, setSource] = useState(ALL_SOURCES);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [estimating, setEstimating] = useState(() => copilot.getPreferences().estimateEarnings);

  const range = useMemo(() => periodRange(period), [period]);
  const sourceFilter = source === ALL_SOURCES ? null : source;
  const inPeriod = useMemo(() => filterOffers(history.entries, { ...range, outcome: 'all', source: sourceFilter }), [history.entries, range, sourceFilter]);
  const listed = useMemo(() => filterOffers(inPeriod, { ...range, outcome, source: sourceFilter }), [inPeriod, range, outcome, sourceFilter]);

  const toggleEstimating = (value: boolean) => {
    copilot.setPreferences({ ...copilot.getPreferences(), estimateEarnings: value });
    setEstimating(value);
  };

  return {
    period,
    outcome,
    source,
    sources: [ALL_SOURCES, ...listSources(inRange(history.entries, range))],
    estimate: estimateEarnings(inPeriod),
    summary: summarizeOutcomes(inPeriod),
    offers: listed.slice(0, visible),
    hasMore: listed.length > visible,
    hasHistory: history.entries.length > 0,
    estimating,
    setPeriod,
    setOutcome,
    setSource,
    showMore: () => setVisible((current) => current + PAGE_SIZE),
    setStatus: history.setStatus,
    clear: history.clear,
    toggleEstimating,
  };
}

export { ALL_SOURCES };
