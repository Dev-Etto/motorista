import { buildProblemReport, type ProblemReportInput } from '@features/settings/problemReport';
import { i18n } from '@shared/i18n';

const build = (input: ProblemReportInput) => buildProblemReport(input, i18n.getFixedT('pt-BR', 'settings'));

const base = {
  description: ' A Uber não avisa. ',
  version: '0.8.2',
  android: '15',
  device: 'Samsung SM-A155',
  accessibilityGranted: true,
  failedReads: 2,
  readings: [],
};

describe('relato de problema', () => {
  it('reúne a descrição e os dados do aparelho', () => {
    const report = build(base);
    expect(report).toContain('A Uber não avisa.');
    expect(report).toContain('Versão: 0.8.2');
    expect(report).toContain('Aparelho: Samsung SM-A155');
    expect(report).toContain('Leituras incompletas: 2');
    expect(report).not.toContain('O que o Copiloto leu');
  });

  it('inclui as leituras quando existem', () => {
    const report = build({ ...base, readings: ['R$ 13 | xxxxxx'] });
    expect(report).toContain('R$ 13 | xxxxxx');
  });

  it('monta o texto completo sem descrição e com a acessibilidade desligada', () => {
    const report = build({ ...base, description: ' ', accessibilityGranted: false, readings: ['R$ 13 | xxxxxx'] });
    expect(report).toBe(
      [
        'Relato do app Motorista',
        '',
        '(sem descrição)',
        '',
        'Versão: 0.8.2',
        'Android: 15',
        'Aparelho: Samsung SM-A155',
        'Acessibilidade: desativada',
        'Leituras incompletas: 2',
        '',
        'O que o Copiloto leu (palavras mascaradas):',
        'R$ 13 | xxxxxx',
      ].join('\n'),
    );
  });
});
