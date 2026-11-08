import { useMemo, useState } from 'react';
import { averageScore, estimateEarnings, filterOffers, listSources, OutcomeFilter, summarizeOutcomes } from '@domain/offer/offerLog';
import { copilot } from '@modules/copilot';
import { today } from '@shared/utils/dates';
import { CustomDates, defaultCustomDates, OfferPeriod, periodRange } from './offerPeriod';
import { useOfferHistory } from './useOfferHistory';

export const ALL_SOURCES = 'all';
const PAGE_SIZE = 30;

export function useOffers() {
  const [period, setPeriodState] = useState<OfferPeriod>('today');
  const [custom, setCustom] = useState<CustomDates>(() => defaultCustomDates(today()));
  const [outcome, setOutcomeState] = useState<OutcomeFilter>('accepted');
  const [selectedSource, setSourceState] = useState(ALL_SOURCES);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [estimating, setEstimating] = useState(() => copilot.getPreferences().estimateEarnings);

  const range = useMemo(() => periodRange(period, today(), custom), [period, custom]);
  const history = useOfferHistory(range);
  const sources = useMemo(() => listSources(history.entries), [history.entries]);
  const source = sources.includes(selectedSource) ? selectedSource : ALL_SOURCES;
  const sourceFilter = source === ALL_SOURCES ? null : source;

  const inSource = useMemo(() => filterOffers(history.entries, { ...range, outcome: 'all', source: sourceFilter }), [history.entries, range, sourceFilter]);
  const listed = useMemo(() => filterOffers(inSource, { ...range, outcome, source: sourceFilter }), [inSource, range, outcome, sourceFilter]);

  const resettingList =
    <T>(apply: (value: T) => void) =>
    (value: T) => {
      apply(value);
      setVisible(PAGE_SIZE);
    };

  const toggleEstimating = (value: boolean) => {
    copilot.setPreferences({ ...copilot.getPreferences(), estimateEarnings: value });
    setEstimating(value);
  };

  return {
    period,
    custom,
    outcome,
    source,
    sources,
    estimate: estimateEarnings(inSource),
    summary: summarizeOutcomes(inSource),
    averageScore: averageScore(inSource),
    offers: listed.slice(0, visible),
    hasMore: listed.length > visible,
    estimating,
    setPeriod: resettingList(setPeriodState),
    setCustom: resettingList(setCustom),
    setOutcome: resettingList(setOutcomeState),
    setSource: resettingList(setSourceState),
    showMore: () => setVisible((current) => current + PAGE_SIZE),
    clear: history.clear,
    reload: history.reload,
    toggleEstimating,
  };
}
