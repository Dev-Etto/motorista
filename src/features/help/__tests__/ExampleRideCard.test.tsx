import { render, screen } from '@testing-library/react-native';
import { ExampleRideCard } from '@features/help/ExampleRideCard';

jest.mock('@features/help/useExampleCost', () => ({ useExampleCost: () => 69 }));

describe('corrida de exemplo da Ajuda', () => {
  it('mostra o ganho, o custo pelos km e o lucro com o custo do veículo', async () => {
    await render(<ExampleRideCard />);

    expect(screen.getByLabelText(/^Ganho, R\$\s18,00$/)).toBeTruthy();
    expect(screen.getByLabelText(/^Custo · 8,5 km × R\$\s0,69\/km, − R\$\s5,87$/)).toBeTruthy();
    expect(screen.getByLabelText(/^Lucro, R\$\s12,13$/)).toBeTruthy();
  });
});
