import { parseBackup } from '@/data/backup/backup';
import { SCHEMA_VERSION } from '@/data/database/connection';

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
