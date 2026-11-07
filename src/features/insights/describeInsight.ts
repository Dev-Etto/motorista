import type { TFunction } from 'i18next';
import type { Insight } from '@domain/insights/types';
import type { Formatter } from '@shared/i18n/format';

export interface InsightText {
  title: string;
  message: string;
  basis: string;
}

const HUNDRED = 100;
const CENTS_PER_UNIT = 100;

export function describeInsight(insight: Insight, t: TFunction<'insights'>, format: Formatter): InsightText {
  const whole = (units: number) => format.moneyWhole(units * CENTS_PER_UNIT);
  const wholeDistance = (km: number) => format.distance(km, 0);

  switch (insight.id) {
    case 'real-profit': {
      const kept = insight.profitCents >= 0;
      const args = { hundred: whole(HUNDRED), share: whole(Math.abs(insight.sharePerHundred)) };
      return {
        title: t('realProfit.title'),
        message: kept ? t('realProfit.messageKept', args) : t('realProfit.messageMissing', args),
        basis: t('realProfit.basis', { count: insight.shifts, gross: format.money(insight.grossCents), profit: format.money(insight.profitCents) }),
      };
    }
    case 'best-weekday':
      return {
        title: t('bestWeekday.title'),
        message: t('bestWeekday.message', { weekday: format.weekday(insight.weekday) }),
        basis: t('bestWeekday.basis', { count: insight.shifts, perHour: format.perHour(insight.perHourCents) }),
      };
    case 'best-period':
      return {
        title: t('bestPeriod.title'),
        message: t('bestPeriod.message', {
          best: t(`periodStart.${insight.best}`),
          worst: t(`periodStart.${insight.worst}`),
          gap: format.perHour(insight.gapCents),
        }),
        basis: t('bestPeriod.basis', {
          bestName: t(`period.${insight.best}`),
          bestRate: format.perHour(insight.bestPerHourCents),
          worstName: t(`period.${insight.worst}`),
          worstRate: format.perHour(insight.worstPerHourCents),
        }),
      };
    case 'platform':
      return {
        title: t('platform.title'),
        message: t('platform.message', { platform: insight.platform, share: format.percent(insight.sharePct) }),
        basis: t('platform.basis', { cents: format.money(insight.cents), gross: format.money(insight.grossCents) }),
      };
    case 'biggest-cost':
      return {
        title: t('biggestCost.title'),
        message: t('biggestCost.message', {
          context: format.distanceUnit,
          part: t(`costPart.${insight.part}`),
          share: format.percent(insight.sharePct),
        }),
        basis: t('biggestCost.basis', { value: format.perDistance(insight.perKmCents), full: format.perDistance(insight.fullPerKmCents) }),
      };
    case 'efficiency':
      return {
        title: t('efficiency.title'),
        message: t('efficiency.message'),
        basis: t('efficiency.basis', { previous: format.money(insight.previousPerHourCents), last: format.money(insight.lastPerHourCents) }),
      };
    case 'break-even':
      return {
        title: t('breakEven.title'),
        message: t('breakEven.message', { daily: format.money(insight.dailyCents) }),
        basis: t('breakEven.basis', { count: insight.daysPerMonth, distance: wholeDistance(insight.kmPerDay) }),
      };
    case 'projection':
      return {
        title: t('projection.title'),
        message: t('projection.message', { projected: format.money(insight.projectedCents) }),
        basis: t('projection.basis', { count: insight.dayOfMonth, profit: format.money(insight.profitCents) }),
      };
    case 'fuel-gap': {
      const args = { gap: format.percent(Math.abs(insight.gapPct)) };
      return {
        title: t('fuelGap.title'),
        message: insight.gapPct > 0 ? t('fuelGap.messageAbove', args) : t('fuelGap.messageBelow', args),
        basis: t('fuelGap.basis', { expected: format.money(insight.expectedCents), paid: format.money(insight.paidCents) }),
      };
    }
    case 'fixed-weight':
      return {
        title: t('fixedWeight.title'),
        message: t('fixedWeight.message', { extra: wholeDistance(insight.extraKm), saving: format.perDistance(insight.savingPerKmCents) }),
        basis: t('fixedWeight.basis', { fixed: format.money(insight.fixedMonthlyCents), planned: wholeDistance(insight.plannedKm) }),
      };
  }
}
