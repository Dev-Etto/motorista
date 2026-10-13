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
