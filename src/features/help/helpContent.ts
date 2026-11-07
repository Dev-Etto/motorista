import type { TFunction } from 'i18next';
import type { Formatter } from '@shared/i18n/format';

export interface HelpSection {
  id: string;
  title: string;
  paragraphs: string[];
}

const GREEN_MIN = 3.5;
const YELLOW_MIN = 2;
const YELLOW_MAX = 3.4;
const RED_MAX = 1.9;

export function helpSections(t: TFunction<'help'>, format: Formatter): HelpSection[] {
  const unit = { context: format.distanceUnit };
  const score = (value: number) => format.number(value);

  return [
    {
      id: 'costPerKm',
      title: t('costPerKm.title', unit),
      paragraphs: [t('costPerKm.howItWorks', unit), t('costPerKm.precision')],
    },
    {
      id: 'profit',
      title: t('profit.title'),
      paragraphs: [t('profit.formula', unit), t('profit.notCountedTwice', unit)],
    },
    {
      id: 'offerScore',
      title: t('offerScore.title'),
      paragraphs: [
        t('offerScore.scale', unit),
        t('offerScore.green', { min: score(GREEN_MIN) }),
        t('offerScore.yellow', { min: format.number(YELLOW_MIN, 0), max: score(YELLOW_MAX) }),
        t('offerScore.red', { ...unit, max: score(RED_MAX) }),
        t('offerScore.arrows', unit),
        t('offerScore.withoutTime', unit),
        t('offerScore.rating'),
        t('offerScore.noCosts'),
      ],
    },
    {
      id: 'shift',
      title: t('shift.title'),
      paragraphs: [t('shift.howTo', unit), t('shift.partial', unit)],
    },
    {
      id: 'copilotSetup',
      title: t('copilotSetup.title'),
      paragraphs: [t('copilotSetup.guided'), t('copilotSetup.driving')],
    },
    {
      id: 'copilotMissing',
      title: t('copilotMissing.title'),
      paragraphs: [t('copilotMissing.accessibility'), t('copilotMissing.calibration')],
    },
    {
      id: 'shortcutIcon',
      title: t('shortcutIcon.title'),
      paragraphs: [t('shortcutIcon.what'), t('shortcutIcon.remove')],
    },
    {
      id: 'moveCard',
      title: t('moveCard.title'),
      paragraphs: [t('moveCard.drag')],
    },
    {
      id: 'goal',
      title: t('goal.title'),
      paragraphs: [t('goal.realProfit', unit), t('goal.today'), t('goal.plan', unit), t('goal.closedMonth')],
    },
    {
      id: 'estimatedRevenue',
      title: t('estimatedRevenue.title'),
      paragraphs: [t('estimatedRevenue.howItWorks'), t('estimatedRevenue.suggestion'), t('estimatedRevenue.useValues')],
    },
    {
      id: 'backup',
      title: t('backup.title'),
      paragraphs: [t('backup.onDevice'), t('backup.newPhone')],
    },
    {
      id: 'update',
      title: t('update.title'),
      paragraphs: [t('update.howTo'), t('update.backupFirst')],
    },
  ];
}
