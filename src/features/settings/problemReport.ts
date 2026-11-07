import type { TFunction } from 'i18next';
import { APP_NAME } from '@config/app';

export interface ProblemReportInput {
  description: string;
  version: string;
  android: string;
  device: string;
  accessibilityGranted: boolean;
  failedReads: number;
  readings: string[];
}

export function buildProblemReport(input: ProblemReportInput, t: TFunction<'settings'>): string {
  const lines = [
    t('report.body.heading', { appName: APP_NAME }),
    '',
    input.description.trim() || t('report.body.noDescription'),
    '',
    t('report.body.version', { version: input.version }),
    t('report.body.android', { android: input.android }),
    t('report.body.device', { device: input.device }),
    input.accessibilityGranted ? t('report.body.accessibilityOn') : t('report.body.accessibilityOff'),
    t('report.body.failedReads', { failedReads: input.failedReads }),
  ];
  if (input.readings.length === 0) return lines.join('\n');
  return [...lines, '', t('report.body.readingsHeading'), ...input.readings].join('\n');
}
