import { createLanguageWatcher } from '@features/settings/useRescheduleOnLanguageChange';

describe('reagendar notificações ao trocar o idioma', () => {
  it('não reagenda na primeira leitura nem quando o idioma se repete', () => {
    const onChange = jest.fn().mockResolvedValue(undefined);
    const watch = createLanguageWatcher(onChange);
    watch('pt-BR');
    watch('pt-BR');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reagenda a cada troca de idioma', () => {
    const onChange = jest.fn().mockResolvedValue(undefined);
    const watch = createLanguageWatcher(onChange);
    watch('pt-BR');
    watch('en');
    watch('es');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
