import { buildProblemReport } from '../problemReport';

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
    const report = buildProblemReport(base);
    expect(report).toContain('A Uber não avisa.');
    expect(report).toContain('Versão: 0.8.2');
    expect(report).toContain('Aparelho: Samsung SM-A155');
    expect(report).toContain('Leituras incompletas: 2');
    expect(report).not.toContain('O que o Copiloto leu');
  });

  it('inclui as leituras quando existem', () => {
    const report = buildProblemReport({ ...base, readings: ['R$ 13 | xxxxxx'] });
    expect(report).toContain('R$ 13 | xxxxxx');
  });
});
