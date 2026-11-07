import { parseBackup } from '@data/backup/backup';
import { SCHEMA_VERSION } from '@data/database/connection';

const emptyTables = {
  vehicles: [],
  cost_profiles: [],
  platforms: [],
  shifts: [],
  shift_earnings: [],
  expenses: [],
  goals: [],
  quotes: [],
  reminders: [],
  settings: [],
};
const validBackup = { app: 'motorista', schemaVersion: SCHEMA_VERSION, exportedAt: '2026-11-04T00:00:00Z', tables: emptyTables };

describe('backup', () => {
  it('aceita um arquivo válido', () => {
    expect(parseBackup(JSON.stringify(validBackup)).ok).toBe(true);
  });

  it('recusa arquivo corrompido, de outro app ou com tabela faltando', () => {
    expect(parseBackup('{quebrado').ok).toBe(false);
    expect(parseBackup(JSON.stringify({ ...validBackup, app: 'outro' })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ ...validBackup, tables: { vehicles: [] } })).ok).toBe(false);
  });

  it('recusa versão mais nova', () => {
    expect(parseBackup(JSON.stringify({ ...validBackup, schemaVersion: SCHEMA_VERSION + 1 })).ok).toBe(false);
  });

  it('recusa nome de coluna perigoso', () => {
    const tables = { ...emptyTables, settings: [{ 'key) VALUES (1); DROP TABLE shifts; --': 'x' }] };
    expect(parseBackup(JSON.stringify({ ...validBackup, tables })).ok).toBe(false);
  });
});

describe('ajustes do Copiloto no backup', () => {
  it('aceita arquivo com os ajustes', () => {
    const copilot = { preferences: '{"voice":true}', history: '[]' };
    const parsed = parseBackup(JSON.stringify({ ...validBackup, copilot }));
    expect(parsed.ok && parsed.backup.copilot).toEqual(copilot);
  });

  it('recusa ajustes ilegíveis', () => {
    const copilot = { preferences: '{quebrado', history: '[]' };
    expect(parseBackup(JSON.stringify({ ...validBackup, copilot })).ok).toBe(false);
  });
});

describe('dados internos do backup', () => {
  it('recusa um custo que não pode ser lido, para não travar o app ao abrir', () => {
    const tables = { ...emptyTables, cost_profiles: [{ id: 1, vehicle_id: 1, valid_from: '2026-01-01', data: 'nao-e-json' }] };
    expect(parseBackup(JSON.stringify({ ...validBackup, tables })).ok).toBe(false);
  });

  it('recusa uma meta que não pode ser lida', () => {
    const tables = { ...emptyTables, goals: [{ month: '2026-11', desired_profit_cents: 1, work_weekdays: 'x' }] };
    expect(parseBackup(JSON.stringify({ ...validBackup, tables })).ok).toBe(false);
  });
});

describe('backup de versões anteriores', () => {
  it('aceita arquivo sem as tabelas criadas depois', () => {
    const { goal_day_overrides: _removed, ...older } = { ...emptyTables, goal_day_overrides: [] };
    const parsed = parseBackup(JSON.stringify({ ...validBackup, schemaVersion: 1, tables: older }));
    expect(parsed.ok).toBe(true);
  });
});

describe('formato das linhas do backup', () => {
  const profile = {
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
  const withTables = (tables: Partial<typeof emptyTables>) => parseBackup(JSON.stringify({ ...validBackup, tables: { ...emptyTables, ...tables } }));
  const goal = { month: '2026-11', desired_profit_cents: 300000, work_weekdays: '[1,2,3]', hours_per_day: 8 };
  const costProfile = { id: 1, vehicle_id: 1, valid_from: '2026-01-01', data: JSON.stringify(profile) };

  it('aceita linhas no formato do app', () => {
    expect(withTables({ goals: [goal] as never[], cost_profiles: [costProfile] as never[] }).ok).toBe(true);
  });

  it('recusa dias de trabalho fora de 0 a 6 ou que não são lista', () => {
    expect(withTables({ goals: [{ ...goal, work_weekdays: '"5"' }] as never[] }).ok).toBe(false);
    expect(withTables({ goals: [{ ...goal, work_weekdays: '[7]' }] as never[] }).ok).toBe(false);
  });

  it('recusa custo sem os campos numéricos', () => {
    expect(withTables({ cost_profiles: [{ ...costProfile, data: '{}' }] as never[] }).ok).toBe(false);
  });

  it('recusa centavos que não são inteiros', () => {
    const earning = { id: 1, shift_id: 1, platform_id: 1, cents: 'abc' };
    expect(withTables({ shift_earnings: [earning] as never[] }).ok).toBe(false);
    expect(withTables({ goals: [{ ...goal, desired_profit_cents: 10.5 }] as never[] }).ok).toBe(false);
  });

  it('recusa datas fora de AAAA-MM-DD', () => {
    const shift = { id: 1, date: 'ontem', minutes: 60, created_at: 1 };
    expect(withTables({ shifts: [shift] as never[] }).ok).toBe(false);
    expect(withTables({ shifts: [{ ...shift, date: '2026-11-05' }] as never[] }).ok).toBe(true);
  });
});

describe('histórico do Copiloto no backup', () => {
  const entry = { timestamp: 1, source: 'Uber', valueCents: 1500, km: 5, minutes: 10, perKmCents: 300, perHourCents: 9000, color: 'green' };

  it('recusa histórico que não é lista', () => {
    const copilot = { preferences: '{}', history: '{"a":1}' };
    expect(parseBackup(JSON.stringify({ ...validBackup, copilot })).ok).toBe(false);
  });

  it('recusa preferências que não são objeto', () => {
    const copilot = { preferences: '[]', history: '[]' };
    expect(parseBackup(JSON.stringify({ ...validBackup, copilot })).ok).toBe(false);
  });

  it('descarta as ofertas inválidas e mantém as outras', () => {
    const copilot = { preferences: '{}', history: JSON.stringify([entry, { timestamp: 'x' }]) };
    const parsed = parseBackup(JSON.stringify({ ...validBackup, copilot }));
    expect(parsed.ok && JSON.parse(parsed.backup.copilot?.history ?? '[]')).toEqual([entry]);
  });
});
