import { consumptionLabel, FUEL_CHOICES } from '@features/vehicle/vehicleForm';
import { createFormatter, DEFAULT_FORMAT } from '@shared/i18n/format';

describe('combustíveis do cadastro rápido', () => {
  it('oferece gasolina, etanol, GNV e elétrico', () => {
    expect(FUEL_CHOICES).toEqual(['gasoline', 'ethanol', 'cng', 'electric']);
  });

  it('no elétrico, o consumo é por kWh', () => {
    expect(consumptionLabel('electric', createFormatter(DEFAULT_FORMAT))).toBe('km/kWh');
  });
});
