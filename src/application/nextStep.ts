import { z } from 'zod';
import { goalRepository } from '@/data/repositories/goalRepository';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { monthKey, today } from '@/shared/utils/dates';
import { copilot } from '@modules/copilot';

const STEP_IDS = ['vehicle', 'first-shift', 'goal', 'first-backup'] as const;
const dismissedSchema = z.array(z.enum(STEP_IDS));

export interface NextStep {
  id: (typeof STEP_IDS)[number];
  title: string;
  message: string;
  actionLabel: string;
  href: '/vehicle' | '/shift/new' | '/goal' | '/backup';
}

const STEPS: Record<NextStep['id'], NextStep> = {
  vehicle: {
    id: 'vehicle',
    title: 'Descubra seu custo por km',
    message: 'Com ele, o app mostra quanto sobra de verdade em cada jornada.',
    actionLabel: 'Calcular custo',
    href: '/vehicle',
  },
  'first-shift': {
    id: 'first-shift',
    title: 'Registre sua primeira jornada',
    message: 'Informe quanto ganhou, os km e as horas. Em menos de um minuto você vê seu lucro real.',
    actionLabel: 'Registrar jornada',
    href: '/shift/new',
  },
  goal: {
    id: 'goal',
    title: 'Defina sua meta do mês',
    message: 'Diga quanto quer lucrar e veja quanto falta hoje e até o fim do mês.',
    actionLabel: 'Definir meta',
    href: '/goal',
  },
  'first-backup': {
    id: 'first-backup',
    title: 'Guarde uma cópia dos seus dados',
    message: 'Seus dados ficam só neste celular. Com um backup, você os leva junto se trocar de aparelho.',
    actionLabel: 'Fazer backup',
    href: '/backup',
  },
};

export async function loadNextStep(): Promise<NextStep | null> {
  const date = today();
  const [{ costs }, stats, goal, lastBackup, dismissed] = await Promise.all([
    vehicleRepository.getCostsAt(date),
    shiftRepository.usageStats(),
    goalRepository.find(monthKey(date)),
    settingsRepository.get(SETTING_KEYS.lastBackupAt),
    settingsRepository.getJson(SETTING_KEYS.nextStepsDismissed, dismissedSchema, []),
  ]);

  const pending: (NextStep['id'] | null)[] = [
    costs ? null : 'vehicle',
    stats.total > 0 || copilot.getTimer().started ? null : 'first-shift',
    goal ? null : 'goal',
    lastBackup || stats.total === 0 ? null : 'first-backup',
  ];
  const next = pending.find((id) => id !== null && !dismissed.includes(id));
  return next ? STEPS[next] : null;
}

export async function dismissNextStep(id: NextStep['id']): Promise<void> {
  const dismissed = await settingsRepository.getJson(SETTING_KEYS.nextStepsDismissed, dismissedSchema, []);
  await settingsRepository.setJson(SETTING_KEYS.nextStepsDismissed, [...dismissed, id]);
}
