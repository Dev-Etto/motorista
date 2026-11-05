export type OfferStatus = 'accepted' | 'declined' | 'countered' | 'unanswered';
export type OutcomeFilter = 'all' | 'accepted' | 'notAccepted';

export interface OfferLogEntry {
  timestamp: number;
  source: string;
  valueCents: number;
  km: number;
  status?: OfferStatus;
}

export interface OfferRange {
  from: number;
  to: number;
}

export interface OfferFilters extends OfferRange {
  outcome: OutcomeFilter;
  source: string | null;
}

export interface PlatformEstimate {
  source: string;
  cents: number;
  trips: number;
}

export interface EarningsEstimate {
  totalCents: number;
  trips: number;
  byPlatform: PlatformEstimate[];
}

export interface OutcomeSummary {
  received: number;
  accepted: number;
  notAccepted: number;
  acceptedPerKmCents: number | null;
  notAcceptedPerKmCents: number | null;
}

export const statusOf = (entry: OfferLogEntry): OfferStatus => entry.status ?? 'unanswered';

const isAccepted = (entry: OfferLogEntry) => statusOf(entry) === 'accepted';

export const inRange = (entries: OfferLogEntry[], { from, to }: OfferRange) =>
  entries.filter((entry) => entry.timestamp >= from && entry.timestamp < to);

export function filterOffers<T extends OfferLogEntry>(entries: T[], filters: OfferFilters): T[] {
  return entries.filter((entry) => {
    if (entry.timestamp < filters.from || entry.timestamp >= filters.to) return false;
    if (filters.source && entry.source !== filters.source) return false;
    if (filters.outcome === 'accepted') return isAccepted(entry);
    if (filters.outcome === 'notAccepted') return !isAccepted(entry);
    return true;
  });
}

export const listSources = (entries: OfferLogEntry[]) => [...new Set(entries.map((entry) => entry.source))].sort();

export function estimateEarnings(entries: OfferLogEntry[]): EarningsEstimate {
  const totals = new Map<string, PlatformEstimate>();
  for (const entry of entries.filter(isAccepted)) {
    const current = totals.get(entry.source) ?? { source: entry.source, cents: 0, trips: 0 };
    totals.set(entry.source, { ...current, cents: current.cents + entry.valueCents, trips: current.trips + 1 });
  }
  const byPlatform = [...totals.values()].sort((a, b) => b.cents - a.cents);
  return {
    totalCents: byPlatform.reduce((total, platform) => total + platform.cents, 0),
    trips: byPlatform.reduce((total, platform) => total + platform.trips, 0),
    byPlatform,
  };
}

function averagePerKm(entries: OfferLogEntry[]): number | null {
  const km = entries.reduce((total, entry) => total + entry.km, 0);
  if (km <= 0) return null;
  return entries.reduce((total, entry) => total + entry.valueCents, 0) / km;
}

export function summarizeOutcomes(entries: OfferLogEntry[]): OutcomeSummary {
  const accepted = entries.filter(isAccepted);
  const notAccepted = entries.filter((entry) => !isAccepted(entry));
  return {
    received: entries.length,
    accepted: accepted.length,
    notAccepted: notAccepted.length,
    acceptedPerKmCents: averagePerKm(accepted),
    notAcceptedPerKmCents: averagePerKm(notAccepted),
  };
}

export function matchPlatforms<T extends { id: number; name: string }>(estimate: EarningsEstimate, platforms: T[]) {
  const byName = new Map(platforms.map((platform) => [platform.name.toLowerCase(), platform.id]));
  const matched: { platformId: number; cents: number }[] = [];
  const unmatched: string[] = [];
  for (const { source, cents } of estimate.byPlatform) {
    const platformId = byName.get(source.toLowerCase());
    if (platformId === undefined) unmatched.push(source);
    else matched.push({ platformId, cents });
  }
  return { matched, unmatched };
}
