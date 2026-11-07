import { renderHook, waitFor } from '@testing-library/react-native';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { useCostBasis } from '@features/calculators/useCostPerKm';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));
jest.mock('@application/vehicleInUse', () => ({ vehicleInUse: jest.fn().mockResolvedValue({ id: 2, name: 'Moto' }) }));
jest.mock('@data/repositories/vehicleRepository', () => ({
  vehicleRepository: { list: jest.fn(), getCostsAt: jest.fn().mockResolvedValue({ costs: { fullPerKm: 40 } }) },
}));

describe('custo usado na calculadora', () => {
  it('com mais de um veículo, diz de qual veículo é o custo', async () => {
    jest.mocked(vehicleRepository.list).mockResolvedValue([{ id: 1 }, { id: 2 }] as never);
    const { result } = await renderHook(() => useCostBasis());

    await waitFor(() => expect(result.current).toEqual({ costPerKm: 40, vehicleName: 'Moto' }));
    expect(vehicleRepository.getCostsAt).toHaveBeenCalledWith(expect.any(String), 2);
  });

  it('com um veículo, não repete o nome', async () => {
    jest.mocked(vehicleRepository.list).mockResolvedValue([{ id: 2 }] as never);
    const { result } = await renderHook(() => useCostBasis());

    await waitFor(() => expect(result.current).toEqual({ costPerKm: 40, vehicleName: null }));
  });
});
