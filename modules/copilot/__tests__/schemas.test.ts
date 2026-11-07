import { copilotRegionalSchema, parseHistory, parsePreferences } from '@modules/copilot/schemas';

const entry = { timestamp: 1, source: 'Uber', valueCents: 1500, km: 5, minutes: 10, perKmCents: 300, perHourCents: 9000, color: 'green' };

describe('histórico vindo do módulo nativo', () => {
  it('descarta a linha inválida e mantém as outras', () => {
    expect(parseHistory(JSON.stringify([entry, { ...entry, valueCents: 'x' }, { ...entry, timestamp: 2 }]))).toEqual([entry, { ...entry, timestamp: 2 }]);
  });

  it('devolve lista vazia para texto que não é lista', () => {
    expect(parseHistory('{quebrado')).toEqual([]);
    expect(parseHistory('{}')).toEqual([]);
  });
});

describe('preferências vindas do módulo nativo', () => {
  it('recusa preferências fora do formato', () => {
    expect(() => parsePreferences('{"voice":"sim"}')).toThrow();
  });
});

describe('perfil regional enviado ao Kotlin', () => {
  it('aceita o perfil e recusa moeda ou unidade fora do formato', () => {
    const regional = { languageTag: 'en', formatLocale: 'en-US', currencyCode: 'USD', distanceUnit: 'mi' };
    expect(copilotRegionalSchema.parse(regional)).toEqual(regional);
    expect(copilotRegionalSchema.safeParse({ ...regional, currencyCode: 'real' }).success).toBe(false);
    expect(copilotRegionalSchema.safeParse({ ...regional, distanceUnit: 'léguas' }).success).toBe(false);
  });
});

