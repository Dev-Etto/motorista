import { shouldStartFloating } from '@features/copilot/floatingStart';

const ready = { floatingButton: true, overlayGranted: true, floatingRunning: false };

describe('início do botão flutuante', () => {
  it('inicia com a preferência ligada e a permissão dada', () => {
    expect(shouldStartFloating(ready)).toBe(true);
  });

  it('respeita quem desligou o botão', () => {
    expect(shouldStartFloating({ ...ready, floatingButton: false })).toBe(false);
  });

  it('não inicia sem a permissão de sobreposição', () => {
    expect(shouldStartFloating({ ...ready, overlayGranted: false })).toBe(false);
  });

  it('não inicia de novo se já estiver rodando', () => {
    expect(shouldStartFloating({ ...ready, floatingRunning: true })).toBe(false);
  });
});
