import type { CostBreakdown } from '@domain/vehicle/costs';
import type { DayPeriod } from '@shared/utils/dates';

export interface ShiftFact {
  date: string;
  startHour: number | null;
  minutes: number;
  km: number | null;
  grossCents: number;
  expensesCents: number;
  costPerKm: number;
  variablePerKm?: number;
  earnings: { platform: string; cents: number }[];
}

export type CostPart = 'fuel' | 'oil' | 'tires' | 'maintenance' | 'fixed';

export type Insight =
  | { id: 'real-profit'; grossCents: number; profitCents: number; shifts: number; sharePerHundred: number }
  | { id: 'best-weekday'; weekday: number; perHourCents: number; shifts: number }
  | { id: 'best-period'; best: DayPeriod; worst: DayPeriod; gapCents: number; bestPerHourCents: number; worstPerHourCents: number }
  | { id: 'platform'; platform: string; sharePct: number; cents: number; grossCents: number }
  | { id: 'biggest-cost'; part: CostPart; sharePct: number; perKmCents: number; fullPerKmCents: number }
  | { id: 'efficiency'; previousPerHourCents: number; lastPerHourCents: number }
  | { id: 'break-even'; dailyCents: number; daysPerMonth: number; kmPerDay: number }
  | { id: 'projection'; projectedCents: number; profitCents: number; dayOfMonth: number }
  | { id: 'fuel-gap'; gapPct: number; expectedCents: number; paidCents: number }
  | { id: 'fixed-weight'; extraKm: number; savingPerKmCents: number; fixedMonthlyCents: number; plannedKm: number };

export interface InsightContext {
  today: string;
  shifts: ShiftFact[];
  costs: CostBreakdown | null;
  plannedKmMonth: number;
  fuelPaidCents: number;
  fuelKm: number;
  looseExpenses?: { date: string; cents: number }[];
}

export type InsightRule = (context: InsightContext) => Insight | null;
