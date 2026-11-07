import enCalculators from './locales/en/calculators.json';
import enCommon from './locales/en/common.json';
import enCopilot from './locales/en/copilot.json';
import enDashboard from './locales/en/dashboard.json';
import enExpenses from './locales/en/expenses.json';
import enGoals from './locales/en/goals.json';
import enHelp from './locales/en/help.json';
import enInsights from './locales/en/insights.json';
import enOffers from './locales/en/offers.json';
import enOnboarding from './locales/en/onboarding.json';
import enPermissions from './locales/en/permissions.json';
import enReports from './locales/en/reports.json';
import enSettings from './locales/en/settings.json';
import enShifts from './locales/en/shifts.json';
import enTips from './locales/en/tips.json';
import enVehicle from './locales/en/vehicle.json';
import esCalculators from './locales/es/calculators.json';
import esCommon from './locales/es/common.json';
import esCopilot from './locales/es/copilot.json';
import esDashboard from './locales/es/dashboard.json';
import esExpenses from './locales/es/expenses.json';
import esGoals from './locales/es/goals.json';
import esHelp from './locales/es/help.json';
import esInsights from './locales/es/insights.json';
import esOffers from './locales/es/offers.json';
import esOnboarding from './locales/es/onboarding.json';
import esPermissions from './locales/es/permissions.json';
import esReports from './locales/es/reports.json';
import esSettings from './locales/es/settings.json';
import esShifts from './locales/es/shifts.json';
import esTips from './locales/es/tips.json';
import esVehicle from './locales/es/vehicle.json';
import ptBRCalculators from './locales/pt-BR/calculators.json';
import ptBRCommon from './locales/pt-BR/common.json';
import ptBRCopilot from './locales/pt-BR/copilot.json';
import ptBRDashboard from './locales/pt-BR/dashboard.json';
import ptBRExpenses from './locales/pt-BR/expenses.json';
import ptBRGoals from './locales/pt-BR/goals.json';
import ptBRHelp from './locales/pt-BR/help.json';
import ptBRInsights from './locales/pt-BR/insights.json';
import ptBROffers from './locales/pt-BR/offers.json';
import ptBROnboarding from './locales/pt-BR/onboarding.json';
import ptBRPermissions from './locales/pt-BR/permissions.json';
import ptBRReports from './locales/pt-BR/reports.json';
import ptBRSettings from './locales/pt-BR/settings.json';
import ptBRShifts from './locales/pt-BR/shifts.json';
import ptBRTips from './locales/pt-BR/tips.json';
import ptBRVehicle from './locales/pt-BR/vehicle.json';

export const SOURCE_LANGUAGE = 'pt-BR';

export const NAMESPACES = [
  'calculators',
  'common',
  'copilot',
  'dashboard',
  'expenses',
  'goals',
  'help',
  'insights',
  'offers',
  'onboarding',
  'permissions',
  'reports',
  'settings',
  'shifts',
  'tips',
  'vehicle',
] as const;

export const resources = {
  [SOURCE_LANGUAGE]: {
    calculators: ptBRCalculators,
    common: ptBRCommon,
    copilot: ptBRCopilot,
    dashboard: ptBRDashboard,
    expenses: ptBRExpenses,
    goals: ptBRGoals,
    help: ptBRHelp,
    insights: ptBRInsights,
    offers: ptBROffers,
    onboarding: ptBROnboarding,
    permissions: ptBRPermissions,
    reports: ptBRReports,
    settings: ptBRSettings,
    shifts: ptBRShifts,
    tips: ptBRTips,
    vehicle: ptBRVehicle,
  },
  en: {
    calculators: enCalculators,
    common: enCommon,
    copilot: enCopilot,
    dashboard: enDashboard,
    expenses: enExpenses,
    goals: enGoals,
    help: enHelp,
    insights: enInsights,
    offers: enOffers,
    onboarding: enOnboarding,
    permissions: enPermissions,
    reports: enReports,
    settings: enSettings,
    shifts: enShifts,
    tips: enTips,
    vehicle: enVehicle,
  },
  es: {
    calculators: esCalculators,
    common: esCommon,
    copilot: esCopilot,
    dashboard: esDashboard,
    expenses: esExpenses,
    goals: esGoals,
    help: esHelp,
    insights: esInsights,
    offers: esOffers,
    onboarding: esOnboarding,
    permissions: esPermissions,
    reports: esReports,
    settings: esSettings,
    shifts: esShifts,
    tips: esTips,
    vehicle: esVehicle,
  },
} as const;

export type SourceResources = (typeof resources)[typeof SOURCE_LANGUAGE];
