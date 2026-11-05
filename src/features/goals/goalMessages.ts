import { formatBRL, formatNumber } from '@/shared/utils/money';

export interface GoalDayFacts {
  reached: boolean;
  surplusCents: number;
  remainingCents: number;
  workDaysLeft: number;
  todayIsWorkDay: boolean;
  dailyTargetCents: number | null;
  leftTodayCents: number | null;
  grossForDayCents: number | null;
  plannedKmPerDay: number;
}

const describeDays = (days: number) => (days === 1 ? '1 dia de trabalho' : `${days} dias de trabalho`);

function describeDayEffort(facts: GoalDayFacts): string {
  if (facts.grossForDayCents === null || facts.plannedKmPerDay <= 0) return '';
  return ` Isso pede cerca de ${formatBRL(facts.grossForDayCents)} de faturamento no dia, rodando ${formatNumber(facts.plannedKmPerDay, 0)} km.`;
}

export function describeGoalDay(facts: GoalDayFacts): string {
  if (facts.reached) {
    return facts.surplusCents > 0 ? `Meta batida. Você já lucrou ${formatBRL(facts.surplusCents)} acima dela.` : 'Meta batida.';
  }
  if (facts.dailyTargetCents === null) {
    return `Não há mais dias de trabalho na sua meta neste mês. Faltaram ${formatBRL(facts.remainingCents)} para chegar nela.`;
  }
  if (!facts.todayIsWorkDay) {
    return `Hoje não é dia de trabalho na sua meta. Nos próximos ${describeDays(facts.workDaysLeft)}, o objetivo é lucrar ${formatBRL(facts.dailyTargetCents)} por dia.${describeDayEffort(facts)}`;
  }
  if (facts.leftTodayCents === 0) return 'Meta de hoje batida. O que você lucrar a mais diminui o que falta nos próximos dias.';

  return `Faltam ${formatBRL(facts.leftTodayCents ?? 0)} de lucro hoje.${describeDayEffort(facts)} Restam ${describeDays(facts.workDaysLeft)} no mês, contando hoje.`;
}

export const describePartialShifts = (count: number) =>
  count === 1
    ? '1 jornada sem km ou sem custo: o custo do veículo não foi descontado dela, então seu lucro real pode ser menor.'
    : `${count} jornadas sem km ou sem custo: o custo do veículo não foi descontado delas, então seu lucro real pode ser menor.`;
