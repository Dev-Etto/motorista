import { fireEvent, render, screen } from '@testing-library/react-native';
import { FilterChips } from '../FilterChips';

const MANY_APPS = ['Todos', 'Uber', '99', 'inDrive', 'Maxim', 'Garupa', 'Lady Driver', 'Um aplicativo com nome bem comprido'].map((label) => ({
  value: label,
  label,
}));

describe('filtro em chips', () => {
  it('mostra todas as opções, sem limite de quantidade', async () => {
    await render(<FilterChips label="App" value="Todos" options={MANY_APPS} onChange={jest.fn()} />);

    MANY_APPS.forEach(({ label }) => expect(screen.getByText(label)).toBeTruthy());
  });

  it('avisa a opção escolhida', async () => {
    const onChange = jest.fn();
    await render(<FilterChips label="App" value="Todos" options={MANY_APPS} onChange={onChange} />);

    await fireEvent.press(screen.getByText('Maxim'));

    expect(onChange).toHaveBeenCalledWith('Maxim');
  });
});
