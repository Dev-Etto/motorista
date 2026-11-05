import { CostBreakdown } from '@/domain/vehicle/costs';

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

export interface Insight {
  id: string;
  title: string;
  message: string;
  basis: string;
}

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
