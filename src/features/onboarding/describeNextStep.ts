import type { TFunction } from 'i18next';
import type { NextStepId } from '@application/nextStep';
import type { Formatter } from '@shared/i18n/format';

export interface NextStepText {
  title: string;
  message: string;
  actionLabel: string;
}

export function describeNextStep(id: NextStepId, t: TFunction<'onboarding'>, format: Formatter): NextStepText {
  const unit = { context: format.distanceUnit };

  switch (id) {
    case 'vehicle':
      return { title: t('nextStep.vehicle.title', unit), message: t('nextStep.vehicle.message'), actionLabel: t('nextStep.vehicle.action') };
    case 'fixed-costs':
      return { title: t('nextStep.fixedCosts.title'), message: t('nextStep.fixedCosts.message'), actionLabel: t('nextStep.fixedCosts.action') };
    case 'copilot':
      return { title: t('nextStep.copilot.title'), message: t('nextStep.copilot.message'), actionLabel: t('nextStep.copilot.action') };
    case 'first-shift':
      return { title: t('nextStep.firstShift.title'), message: t('nextStep.firstShift.message', unit), actionLabel: t('nextStep.firstShift.action') };
    case 'goal':
      return { title: t('nextStep.goal.title'), message: t('nextStep.goal.message'), actionLabel: t('nextStep.goal.action') };
    case 'first-backup':
      return { title: t('nextStep.firstBackup.title'), message: t('nextStep.firstBackup.message'), actionLabel: t('nextStep.firstBackup.action') };
  }
}
