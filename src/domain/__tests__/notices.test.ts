import { isBackupDue, isUpdateDue } from '../maintenance/notices';

const DAY = 86400000;
const NOW = Date.parse('2026-11-05');

describe('aviso de backup', () => {
  it('não avisa sem jornadas', () => {
    expect(isBackupDue(null, false, NOW, 7)).toBe(false);
  });

  it('avisa quem tem jornadas e nunca fez backup', () => {
    expect(isBackupDue(null, true, NOW, 7)).toBe(true);
  });

  it('avisa só depois do prazo', () => {
    expect(isBackupDue(String(NOW - 6 * DAY), true, NOW, 7)).toBe(false);
    expect(isBackupDue(String(NOW - 8 * DAY), true, NOW, 7)).toBe(true);
  });

  it('trata data ilegível do último backup como vencida', () => {
    expect(isBackupDue('ontem', true, NOW, 7)).toBe(true);
  });
});

describe('aviso de atualização', () => {
  it('avisa só depois do prazo', () => {
    expect(isUpdateDue('2026-11-01', NOW, 30)).toBe(false);
    expect(isUpdateDue('2026-09-01', NOW, 30)).toBe(true);
  });

  it('não avisa sem data válida', () => {
    expect(isUpdateDue(undefined, NOW, 30)).toBe(false);
    expect(isUpdateDue('sem data', NOW, 30)).toBe(false);
  });
});
