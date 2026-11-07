import { describeReminderDue } from '@features/settings/describeReminderDue';
import { i18n } from '@shared/i18n';
import { currentFormat } from '@shared/i18n/format';

const describe_ = (dueDate: string | null, dueKm: number | null, totalKm: number) =>
  describeReminderDue({ dueDate, dueKm }, totalKm, i18n.getFixedT('pt-BR', 'settings'), currentFormat());

describe('prazo do lembrete', () => {
  it('mostra só a data', () => {
    expect(describe_('2026-12-01', null, 0)).toBe('01/12/2026');
  });

  it('mostra quantos km faltam', () => {
    expect(describe_(null, 15000, 10000)).toBe('faltam 5.000,0 km');
  });

  it('avisa quando os km já passaram', () => {
    expect(describe_(null, 15000, 16000)).toBe('já chegou a hora');
  });

  it('junta a data e os km', () => {
    expect(describe_('2026-12-01', 15000, 10000)).toBe('01/12/2026 ou faltam 5.000,0 km');
  });

  it('fica vazio sem data nem km', () => {
    expect(describe_(null, null, 0)).toBe('');
  });
});
