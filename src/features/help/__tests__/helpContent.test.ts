import { helpSections } from '@features/help/helpContent';
import { i18n } from '@shared/i18n';
import { createFormatter, currentFormat, DEFAULT_FORMAT } from '@shared/i18n/format';

const t = i18n.getFixedT('pt-BR', 'help');
const sectionOf = (id: string, format = currentFormat()) => helpSections(t, format).find((section) => section.id === id);

describe('textos da ajuda em português', () => {
  it('monta todas as seções com título e parágrafos', () => {
    const sections = helpSections(t, currentFormat());

    expect(sections).toHaveLength(12);
    sections.forEach((section) => {
      expect(section.title).not.toBe('');
      expect(section.paragraphs.length).toBeGreaterThan(0);
    });
  });

  it('mantém o texto de custo por km', () => {
    const section = sectionOf('costPerKm');

    expect(section?.title).toBe('Como calculamos seu custo por km');
    expect(section?.paragraphs[0]).toBe(
      'Somamos combustível, óleo, pneus e manutenção por km, e dividimos os custos fixos do mês pelos km que você prevê rodar.',
    );
  });

  it('formata as faixas da nota', () => {
    const paragraphs = sectionOf('offerScore')?.paragraphs ?? [];

    expect(paragraphs[1]).toBe('Verde, 3,5 ou mais: atinge os dois mínimos. Quanto mais acima deles, maior a nota.');
    expect(paragraphs[2]).toBe('Amarelo, de 2 a 3,4: cobre seu custo, mas fica abaixo de algum mínimo.');
    expect(paragraphs[3]).toBe('Vermelho, até 1,9: não cobre seu custo por km.');
  });

  it('fala em milhas quando a unidade é milha', () => {
    const section = sectionOf('costPerKm', createFormatter({ ...DEFAULT_FORMAT, distanceUnit: 'mi' }));

    expect(section?.title).toBe('Como calculamos seu custo por milha');
  });
});
