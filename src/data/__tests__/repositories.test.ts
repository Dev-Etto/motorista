import { MIGRATIONS } from '@/data/database/connection';
import { expenseRepository } from '@/data/repositories/expenseRepository';
import { goalRepository } from '@/data/repositories/goalRepository';
import { gpsSessionRepository } from '@/data/repositories/gpsSessionRepository';
import { platformRepository } from '@/data/repositories/platformRepository';
import { reminderRepository } from '@/data/repositories/reminderRepository';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { summarizeShifts, withLooseExpenses } from '@/domain/shift/summary';
import { computeCosts, CostProfile } from '@/domain/vehicle/costs';
import { loadGoalProgress } from '@/features/goals/goalProgress';
import { z } from 'zod';
import { openTestDatabase } from './sqliteHarness';

jest.mock('expo-sqlite', () => jest.requireActual('./sqliteHarness').expoSqliteMock);

const PROFILE: CostProfile = {
  ownership: 'owned',
  fuelPriceCents: 600,
  consumptionKmPerUnit: 12,
  oilChangeCents: 25000,
  oilIntervalKm: 10000,
  tiresCents: 160000,
  tiresLifeKm: 50000,
  maintenanceMonthlyCents: 20000,
  insuranceMonthlyCents: 25000,
  ipvaYearlyCents: 150000,
  licensingYearlyCents: 20000,
  paymentMonthlyCents: 0,
  vehicleValueCents: 5000000,
  depreciationAnnualPct: 10,
  depreciationEnabled: true,
  otherFixedMonthlyCents: 0,
  plannedKmMonth: 4000,
};

const shiftInput = (over = {}) => ({
  date: '2026-11-05',
  startHour: 8,
  minutes: 480,
  km: 100,
  kmSource: 'manual' as const,
  odometerEnd: null,
  trips: 10,
  note: null,
  earnings: [{ platformId: 1, cents: 30000 }, { platformId: 2, cents: 10000 }],
  expenses: [{ category: 'toll' as const, cents: 1500 }],
  ...over,
});

async function createVehicle(profile = PROFILE) {
  const id = await vehicleRepository.save({ name: 'Carro', kind: 'car', fuel: 'gasoline' });
  await vehicleRepository.saveCostProfile(id, '2026-01-01', profile);
  return id;
}

beforeEach(() => {
  openTestDatabase(MIGRATIONS);
});

describe('jornadas', () => {
  it('salva e devolve ganhos e despesas', async () => {
    await createVehicle();
    const id = await shiftRepository.save(shiftInput());
    const saved = await shiftRepository.findById(id);

    expect(saved?.shift).toMatchObject({ date: '2026-11-05', minutes: 480, km: 100, trips: 10 });
    expect(saved?.earnings.map((earning) => earning.cents)).toEqual([30000, 10000]);
    expect(saved?.expenses.map((expense) => expense.cents)).toEqual([1500]);
  });

  it('guarda uma cópia do custo: mudar o preço não altera o passado', async () => {
    const vehicleId = await createVehicle();
    const id = await shiftRepository.save(shiftInput());
    const original = (await shiftRepository.findById(id))?.shift.cost_per_km;

    await vehicleRepository.saveCostProfile(vehicleId, '2026-11-05', { ...PROFILE, fuelPriceCents: 900 });
    const newer = await shiftRepository.save(shiftInput());

    expect((await shiftRepository.findById(id))?.shift.cost_per_km).toBe(original);
    expect((await shiftRepository.findById(newer))?.shift.cost_per_km).toBeGreaterThan(original ?? 0);
  });

  it('editar troca os ganhos sem duplicar nem criar outra jornada', async () => {
    await createVehicle();
    const id = await shiftRepository.save(shiftInput());
    await shiftRepository.save(shiftInput({ id, earnings: [{ platformId: 1, cents: 50000 }], expenses: [] }));
    const saved = await shiftRepository.findById(id);

    expect((await shiftRepository.listFacts('2026-11-01', '2026-11-30')).length).toBe(1);
    expect(saved?.earnings.map((earning) => earning.cents)).toEqual([50000]);
    expect(saved?.expenses).toEqual([]);
  });

  it('excluir leva junto ganhos e despesas', async () => {
    await createVehicle();
    const id = await shiftRepository.save(shiftInput());
    await shiftRepository.remove(id);

    expect(await shiftRepository.findById(id)).toBeNull();
    expect(await shiftRepository.listFacts('2026-11-01', '2026-11-30')).toEqual([]);
    expect(await expenseRepository.listLoose('2026-11-01', '2026-11-30')).toEqual([]);
  });

  it('resume os fatos do período e marca a jornada parcial', async () => {
    await createVehicle();
    await shiftRepository.save(shiftInput());
    await shiftRepository.save(shiftInput({ date: '2026-11-06', km: null }));
    await shiftRepository.save(shiftInput({ date: '2026-12-01' }));
    const facts = await shiftRepository.listFacts('2026-11-01', '2026-11-30');

    expect(facts).toHaveLength(2);
    expect(facts.map((fact) => fact.partial)).toEqual([true, false]);
    expect(facts[1]).toMatchObject({ grossCents: 40000, expensesCents: 1500 });
    expect(facts[1].variablePerKm).toBeGreaterThan(0);
    expect(facts[1].earnings).toEqual(expect.arrayContaining([{ platform: 'Uber', cents: 30000 }]));
  });

  it('jornada sem veículo fica sem custo, e não com erro', async () => {
    const id = await shiftRepository.save(shiftInput());
    expect((await shiftRepository.findById(id))?.shift.cost_per_km).toBe(0);
  });
});

describe('lançamentos avulsos', () => {
  const expense = { date: '2026-11-05', category: 'other' as const, cents: 5000, liters: null, odometer: null, note: null };

  it('entra no total e sai ao excluir', async () => {
    await expenseRepository.add(expense);
    expect(await expenseRepository.totalLooseCountable('2026-11-01', '2026-11-30')).toBe(5000);

    const [saved] = await expenseRepository.listLoose('2026-11-01', '2026-11-30');
    await expenseRepository.remove(saved.id);

    expect(await expenseRepository.totalLooseCountable('2026-11-01', '2026-11-30')).toBe(0);
  });

  it('abastecimento não desconta de novo, mas soma no pago', async () => {
    await expenseRepository.add({ ...expense, category: 'fuel', cents: 12000 });

    expect(await expenseRepository.totalLooseCountable('2026-11-01', '2026-11-30')).toBe(0);
    expect(await expenseRepository.totalPaidFuel('2026-11-01', '2026-11-30')).toBe(12000);
  });
});

describe('veículo e custos', () => {
  it('usa o custo válido na data', async () => {
    const id = await createVehicle();
    await vehicleRepository.saveCostProfile(id, '2026-11-01', { ...PROFILE, fuelPriceCents: 900 });

    expect((await vehicleRepository.getCostsAt('2026-10-15')).costs?.fullPerKm).toBeCloseTo(computeCosts(PROFILE).fullPerKm);
    expect((await vehicleRepository.getCostsAt('2026-11-15')).profile?.fuelPriceCents).toBe(900);
  });

  it('sem veículo, não há custo', async () => {
    expect((await vehicleRepository.getCostsAt('2026-11-05')).costs).toBeNull();
  });
});

describe('plataformas', () => {
  it('remover esconde e adicionar de novo reativa, sem perder o histórico', async () => {
    await createVehicle();
    const id = await shiftRepository.save(shiftInput());
    await platformRepository.deactivate(1);

    expect((await platformRepository.list()).map((platform) => platform.name)).not.toContain('Uber');
    expect((await shiftRepository.findById(id))?.earnings.map((earning) => earning.name)).toContain('Uber');

    await platformRepository.add('Uber');
    expect((await platformRepository.list()).map((platform) => platform.name)).toContain('Uber');
  });
});

describe('sessão de GPS', () => {
  const point = { lat: -23.5, lng: -46.6, accuracy: 5, time: 1 };

  it('soma o progresso do ciclo atual', async () => {
    await gpsSessionRepository.start();
    const { cycle } = await gpsSessionRepository.get();

    await gpsSessionRepository.recordProgress(cycle, 1200, point);

    expect(await gpsSessionRepository.get()).toMatchObject({ meters: 1200, lastPoint: point, running: true });
  });

  it('descartar durante um lote termina com zero metros', async () => {
    await gpsSessionRepository.start();
    const { cycle } = await gpsSessionRepository.get();

    await gpsSessionRepository.reset();
    await gpsSessionRepository.recordProgress(cycle, 1200, point);

    expect(await gpsSessionRepository.get()).toMatchObject({ meters: 0, lastPoint: null, running: false });
  });

  it('pausar não deixa um lote atrasado religar a medição', async () => {
    await gpsSessionRepository.start();
    const { cycle } = await gpsSessionRepository.get();
    await gpsSessionRepository.recordProgress(cycle, 500, point);

    await gpsSessionRepository.stop();
    await gpsSessionRepository.recordProgress(cycle, 900, point);

    expect(await gpsSessionRepository.get()).toMatchObject({ meters: 500, running: false, lastPoint: null });
  });

  it('a próxima jornada começa do zero depois de descartar', async () => {
    await gpsSessionRepository.start();
    const { cycle } = await gpsSessionRepository.get();
    await gpsSessionRepository.recordProgress(cycle, 800, point);

    await gpsSessionRepository.reset();
    await gpsSessionRepository.start();

    expect((await gpsSessionRepository.get()).meters).toBe(0);
  });
});

describe('metas, lembretes e ajustes', () => {
  it('atualiza a meta do mês sem duplicar', async () => {
    await goalRepository.save({ month: '2026-11', desiredProfitCents: 300000, workWeekdays: [1, 2], hoursPerDay: 8 });
    await goalRepository.save({ month: '2026-11', desiredProfitCents: 400000, workWeekdays: [1], hoursPerDay: 6 });

    expect(await goalRepository.find('2026-11')).toMatchObject({ desiredProfitCents: 400000, workWeekdays: [1], hoursPerDay: 6 });
  });

  it('guarda o aviso do lembrete e marca como feito', async () => {
    await reminderRepository.add({ title: 'Óleo', due_date: '2026-12-01', due_km: null, notification_id: null });
    const [reminder] = await reminderRepository.list();
    await reminderRepository.setNotificationId(reminder.id, 'abc');
    await reminderRepository.setDone(reminder.id, true);

    expect((await reminderRepository.list())[0]).toMatchObject({ notification_id: 'abc', done: 1 });
  });

  it('salva, atualiza e remove ajustes', async () => {
    await settingsRepository.set(SETTING_KEYS.theme, 'light');
    await settingsRepository.set(SETTING_KEYS.theme, 'dark');
    expect(await settingsRepository.get(SETTING_KEYS.theme)).toBe('dark');

    await settingsRepository.remove(SETTING_KEYS.theme);
    expect(await settingsRepository.get(SETTING_KEYS.theme)).toBeNull();
    expect(await settingsRepository.getJson(SETTING_KEYS.tipsDismissed, z.array(z.string()), ['padrão'])).toEqual(['padrão']);
  });

  it('devolve o padrão para um ajuste ilegível ou fora do formato', async () => {
    const schema = z.array(z.string());
    await settingsRepository.set(SETTING_KEYS.tipsDismissed, '{quebrado');
    expect(await settingsRepository.getJson(SETTING_KEYS.tipsDismissed, schema, [])).toEqual([]);

    await settingsRepository.set(SETTING_KEYS.tipsDismissed, '"5"');
    expect(await settingsRepository.getJson(SETTING_KEYS.tipsDismissed, schema, [])).toEqual([]);

    await settingsRepository.setJson(SETTING_KEYS.tipsDismissed, ['meta']);
    expect(await settingsRepository.getJson(SETTING_KEYS.tipsDismissed, schema, [])).toEqual(['meta']);
  });

  it('lê um ajuste de lista fechada e devolve o padrão para valor desconhecido', async () => {
    const modes = ['system', 'light', 'dark'] as const;
    expect(await settingsRepository.getEnum(SETTING_KEYS.theme, modes, 'system')).toBe('system');

    await settingsRepository.set(SETTING_KEYS.theme, 'roxo');
    expect(await settingsRepository.getEnum(SETTING_KEYS.theme, modes, 'system')).toBe('system');

    await settingsRepository.set(SETTING_KEYS.theme, 'dark');
    expect(await settingsRepository.getEnum(SETTING_KEYS.theme, modes, 'system')).toBe('dark');
  });
});

describe('progresso da meta', () => {
  const date = '2026-11-05';

  async function profitLikeDashboard() {
    const facts = await shiftRepository.listFacts('2026-11-01', '2026-11-30');
    return withLooseExpenses(summarizeShifts(facts), await expenseRepository.totalLooseCountable('2026-11-01', '2026-11-30')).profitCents;
  }

  it('usa exatamente o mesmo lucro do início, com despesas avulsas', async () => {
    await createVehicle();
    await goalRepository.save({ month: '2026-11', desiredProfitCents: 300000, workWeekdays: [1, 2, 3, 4, 5], hoursPerDay: 8 });
    await shiftRepository.save(shiftInput());
    await shiftRepository.save(shiftInput({ date: '2026-11-04' }));
    await expenseRepository.add({ date, category: 'other', cents: 5000, liters: null, odometer: null, note: null });

    const progress = await loadGoalProgress(date);

    expect(progress?.profitSoFarCents).toBeCloseTo(await profitLikeDashboard());
    expect(progress?.profitTodayCents).toBeLessThan(progress?.profitSoFarCents ?? 0);
  });

  it('rodar mais km com o mesmo faturamento diminui o progresso', async () => {
    await createVehicle();
    await goalRepository.save({ month: '2026-11', desiredProfitCents: 300000, workWeekdays: [4], hoursPerDay: 8 });
    const id = await shiftRepository.save(shiftInput({ km: 50 }));
    const pouco = await loadGoalProgress(date);
    await shiftRepository.save(shiftInput({ id, km: 400 }));
    const muito = await loadGoalProgress(date);

    expect(muito?.progress).toBeLessThan(pouco?.progress ?? 0);
  });

  it('avisa quando há jornada sem km e reconhece o dia de folga', async () => {
    await createVehicle();
    await goalRepository.save({ month: '2026-11', desiredProfitCents: 300000, workWeekdays: [1], hoursPerDay: 8 });
    await shiftRepository.save(shiftInput({ km: null }));

    const progress = await loadGoalProgress(date);

    expect(progress?.partialCount).toBe(1);
    expect(progress?.todayIsWorkDay).toBe(false);
  });

  it('sem meta no mês, não há progresso', async () => {
    expect(await loadGoalProgress(date)).toBeNull();
  });
});
