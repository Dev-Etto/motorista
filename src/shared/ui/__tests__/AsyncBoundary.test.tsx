import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AsyncBoundary } from '../AsyncBoundary';

const state = <T,>(over: { data: T | null; loading?: boolean; error?: string | null; reload?: () => Promise<void> }) => ({
  loading: false,
  error: null,
  reload: jest.fn().mockResolvedValue(undefined),
  ...over,
});

describe('estado do carregamento', () => {
  it('mostra o conteúdo com o dado carregado', async () => {
    await render(<AsyncBoundary state={state({ data: 'jornadas' })}>{(data) => <Text>{data}</Text>}</AsyncBoundary>);

    expect(screen.getByText('jornadas')).toBeTruthy();
  });

  it('mostra que está carregando, sem o conteúdo', async () => {
    await render(<AsyncBoundary state={state<string>({ data: null, loading: true })}>{(data) => <Text>{data}</Text>}</AsyncBoundary>);

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
  });

  it('mostra o erro com a opção de tentar de novo, nunca uma lista vazia', async () => {
    const reload = jest.fn().mockResolvedValue(undefined);
    await render(
      <AsyncBoundary state={state<string[]>({ data: null, error: 'Não foi possível carregar os dados.', reload })} empty={<Text>Nenhuma jornada</Text>}>
        {(data) => <Text>{data.length}</Text>}
      </AsyncBoundary>,
    );

    expect(screen.getByText('Não foi possível carregar os dados.')).toBeTruthy();
    expect(screen.queryByText('Nenhuma jornada')).toBeNull();
    await fireEvent.press(screen.getByText('Tentar de novo'));
    expect(reload).toHaveBeenCalled();
  });

  it('mostra o vazio quando o carregamento termina sem dado', async () => {
    await render(<AsyncBoundary state={state<string>({ data: null })} empty={<Text>Não encontrada</Text>}>{(data) => <Text>{data}</Text>}</AsyncBoundary>);

    expect(screen.getByText('Não encontrada')).toBeTruthy();
  });
});
