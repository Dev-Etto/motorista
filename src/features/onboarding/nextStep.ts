import { copilot } from '@modules/copilot';
import { goalRepository } from '@/data/repositories/goalRepository';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { monthKey, today } from '@/shared/utils/dates';

export interface NextStep {
  id: 'vehicle' | 'first-shift' | 'goal' | 'first-backup';
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
    message: 'Veja quanto precisa faturar por dia e quais corridas ajudam a chegar lá.',
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
    settingsRepository.getJson<NextStep['id'][]>(SETTING_KEYS.nextStepsDismissed, []),
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
  const dismissed = await settingsRepository.getJson<NextStep['id'][]>(SETTING_KEYS.nextStepsDismissed, []);
  await settingsRepository.setJson(SETTING_KEYS.nextStepsDismissed, [...dismissed, id]);
}
