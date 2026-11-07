import type { TFunction } from 'i18next';
import type { OfferReason, TargetComparison } from '@domain/offer/offer';
import type { DistanceUnit } from '@shared/utils/units';

function describeComparison(comparison: TargetComparison, t: TFunction<'offers'>): string {
  if (comparison.kind === 'no-target') return t('reason.noTarget');
  if (comparison.kind === 'at-target') return t('reason.atTarget');
  return comparison.kind === 'above' ? t('reason.above', { percent: comparison.percent }) : t('reason.below', { percent: comparison.percent });
}

export function describeOfferReason(reason: OfferReason, t: TFunction<'offers'>, unit: DistanceUnit): string {
  if (reason.kind === 'no-costs') return t('reason.noCosts');
  if (reason.kind === 'below-cost') return t('reason.belowCost', { unit });
  return t('reason.targets', {
    unit,
    perKm: describeComparison(reason.perKm, t),
    perHour: reason.perHour === null ? t('reason.noTime') : describeComparison(reason.perHour, t),
  });
}
