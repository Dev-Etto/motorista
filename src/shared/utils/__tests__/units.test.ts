import {
  consumptionToKmPerLiter,
  distanceToKm,
  kmPerLiterToConsumption,
  kmToDistance,
  litersToVolume,
  perDistanceToPerKm,
  perKmToPerDistance,
  perLiterToPerVolume,
  perVolumeToPerLiter,
  volumeToLiters,
} from '@shared/utils/units';

describe('unidades', () => {
  it('converte distância', () => {
    expect(kmToDistance(160.9344, 'mi')).toBeCloseTo(100, 10);
    expect(distanceToKm(100, 'mi')).toBeCloseTo(160.9344, 10);
    expect(kmToDistance(42, 'km')).toBe(42);
  });

  it('converte preço por distância', () => {
    expect(perKmToPerDistance(100, 'mi')).toBeCloseTo(160.9344, 10);
    expect(perDistanceToPerKm(160.9344, 'mi')).toBeCloseTo(100, 10);
  });

  it('converte volume e preço por volume', () => {
    expect(litersToVolume(3.785411784, 'gal')).toBeCloseTo(1, 10);
    expect(volumeToLiters(1, 'gal')).toBeCloseTo(3.785411784, 10);
    expect(perLiterToPerVolume(600, 'gal')).toBeCloseTo(2271.247, 3);
    expect(perVolumeToPerLiter(2271.2470704, 'gal')).toBeCloseTo(600, 5);
  });

  it('converte consumo', () => {
    expect(kmPerLiterToConsumption(10, 'km/L')).toBe(10);
    expect(kmPerLiterToConsumption(10, 'L/100km')).toBe(10);
    expect(kmPerLiterToConsumption(12.5, 'L/100km')).toBe(8);
    expect(kmPerLiterToConsumption(10, 'mpg')).toBeCloseTo(23.521, 3);
    expect(kmPerLiterToConsumption(0, 'L/100km')).toBe(0);
    expect(consumptionToKmPerLiter(0, 'mpg')).toBe(0);
  });

  it.each([
    ['km/L', 11],
    ['L/100km', 11],
    ['mpg', 11],
  ] as const)('ida e volta de %s mantém o valor', (unit, kmPerLiter) => {
    expect(consumptionToKmPerLiter(kmPerLiterToConsumption(kmPerLiter, unit), unit)).toBeCloseTo(kmPerLiter, 10);
  });

  it.each([0.1, 1, 99.99, 4000])('ida e volta de %s km em milhas mantém o valor', (km) => {
    expect(distanceToKm(kmToDistance(km, 'mi'), 'mi')).toBeCloseTo(km, 10);
  });
});
