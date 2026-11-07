import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { closeDialog, confirmAction, currentDialog, showDialog } from '@shared/ui/dialog';
import { DialogHost } from '@shared/ui/DialogHost';

afterEach(() => act(() => closeDialog()));

describe('diálogo do app', () => {
  it('confirmar mostra cancelar e a ação, nessa ordem', () => {
    confirmAction({ title: 'Excluir?', message: 'Não volta.', actionLabel: 'Excluir', onConfirm: jest.fn() });
    expect(currentDialog()?.actions.map((action) => [action.label, action.tone])).toEqual([
      ['Cancelar', 'secondary'],
      ['Excluir', 'danger'],
    ]);
  });

  it('mostra título, mensagem e executa a ação ao tocar, fechando o diálogo', async () => {
    const onConfirm = jest.fn();
    await render(<DialogHost />);
    await act(() => confirmAction({ title: 'Remover orçamento?', message: 'Essa ação não pode ser desfeita.', actionLabel: 'Remover', onConfirm }));

    expect(screen.getByText('Remover orçamento?')).toBeTruthy();
    expect(screen.getByText('Essa ação não pode ser desfeita.')).toBeTruthy();

    await act(() => fireEvent.press(screen.getByText('Remover')));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(currentDialog()).toBeNull();
  });

  it('cancelar fecha sem executar nada', async () => {
    const onPress = jest.fn();
    await render(<DialogHost />);
    await act(() =>
      showDialog({
        title: 'Lembrete',
        actions: [
          { label: 'Cancelar', tone: 'secondary' },
          { label: 'Concluir', onPress },
        ],
      }),
    );

    await act(() => fireEvent.press(screen.getByText('Cancelar')));
    expect(onPress).not.toHaveBeenCalled();
    expect(currentDialog()).toBeNull();
  });

  it('erro na ação não derruba o app', async () => {
    await render(<DialogHost />);
    await act(() => showDialog({ title: 'Falha', actions: [{ label: 'Tentar', onPress: () => Promise.reject(new Error('x')) }] }));
    await act(() => fireEvent.press(screen.getByText('Tentar')));
    expect(currentDialog()).toBeNull();
  });
});
