import { render, screen } from '@testing-library/react-native';
import type { CostBreakdown } from '@domain/vehicle/costs';
import { CostHero } from '@features/vehicle/CostHero';

const costs = { fuelPerKm: 38, oilPerKm: 4, tiresPerKm: 5, maintenancePerKm: 5, fixedPerKm: 17, fullPerKm: 69 } as CostBreakdown;

describe('quanto custa cada km', () => {
  it('mostra o custo total e de onde ele vem', async () => {
    await render(<CostHero costs={costs} />);

    expect(screen.getByRole('header', { name: 'Cada km custa' })).toBeTruthy();
    expect(screen.getByText(/^R\$\s0,69\/km$/)).toBeTruthy();
    expect(screen.getByLabelText(/^Combustível R\$\s0,38\/km · desgaste R\$\s0,14\/km · fixos R\$\s0,17\/km$/)).toBeTruthy();
  });
});
