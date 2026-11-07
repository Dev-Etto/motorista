import { describeNextStep } from '@features/onboarding/describeNextStep';
import { i18n } from '@shared/i18n';
import { createFormatter, currentFormat, DEFAULT_FORMAT } from '@shared/i18n/format';

const t = i18n.getFixedT('pt-BR', 'onboarding');

describe('texto do próximo passo em português', () => {
  it.each([
    ['vehicle', 'Descubra seu custo por km', 'Com ele, o app mostra quanto sobra de verdade em cada jornada.', 'Calcular custo'],
    [
      'first-shift',
      'Registre sua primeira jornada',
      'Informe quanto ganhou, os km e as horas. Em menos de um minuto você vê seu lucro real.',
      'Registrar jornada',
    ],
    ['goal', 'Defina sua meta do mês', 'Diga quanto quer lucrar e veja quanto falta hoje e até o fim do mês.', 'Definir meta'],
    [
      'first-backup',
      'Guarde uma cópia dos seus dados',
      'Seus dados ficam só neste celular. Com um backup, você os leva junto se trocar de aparelho.',
      'Fazer backup',
    ],
  ] as const)('%s', (id, title, message, actionLabel) => {
    expect(describeNextStep(id, t, currentFormat())).toEqual({ title, message, actionLabel });
  });

  it('fala em milhas quando a unidade é milha', () => {
    const miles = createFormatter({ ...DEFAULT_FORMAT, distanceUnit: 'mi' });

    expect(describeNextStep('vehicle', t, miles).title).toBe('Descubra seu custo por milha');
  });
});
