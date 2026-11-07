import { act, renderHook, waitFor } from '@testing-library/react-native';
import { syncCopilotTargets } from '@application/offerSettings';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { useVehicleForm } from '@features/vehicle/useVehicleForm';

jest.mock('@application/offerSettings', () => ({ syncCopilotTargets: jest.fn() }));
jest.mock('@data/repositories/vehicleRepository', () => ({
  vehicleRepository: {
    getCurrent: jest.fn(),
    find: jest.fn(),
    getCostProfile: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(5),
    saveCostProfile: jest.fn(),
    setCurrent: jest.fn(),
  },
}));

const MOTO = { id: 2, name: 'Moto', kind: 'motorcycle', fuel: 'gasoline' };

describe('formulário do veículo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(vehicleRepository.getCurrent).mockResolvedValue(MOTO as never);
    jest.mocked(vehicleRepository.find).mockResolvedValue(MOTO as never);
  });

  it('sem indicar o veículo, abre o atual', async () => {
    const { result } = await renderHook(() => useVehicleForm());
    await waitFor(() => expect(result.current.vehicleId).toBe(2));
  });

  it('abre o veículo pedido', async () => {
    const { result } = await renderHook(() => useVehicleForm(2));
    await waitFor(() => expect(result.current.name).toBe('Moto'));
    expect(vehicleRepository.find).toHaveBeenCalledWith(2);
  });

  it('num veículo novo, o combustível troca só o preço e o consumo sugeridos', async () => {
    const { result } = await renderHook(() => useVehicleForm('new'));
    await act(async () => result.current.bind('plannedKm').onChangeText('5000'));
    const price = result.current.bind('fuelPrice').value;
    const consumption = result.current.bind('consumption').value;

    await act(async () => result.current.setFuel('electric'));

    expect(result.current.bind('plannedKm').value).toBe('5000');
    expect(result.current.bind('fuelPrice').value).not.toBe(price);
    expect(result.current.bind('consumption').value).not.toBe(consumption);
  });

  it('num veículo salvo, trocar o combustível não mexe nos valores', async () => {
    const { result } = await renderHook(() => useVehicleForm(2));
    await waitFor(() => expect(result.current.vehicleId).toBe(2));
    const price = result.current.bind('fuelPrice').value;

    await act(async () => result.current.setFuel('ethanol'));

    expect(result.current.bind('fuelPrice').value).toBe(price);
  });

  it('um veículo novo vira o atual ao salvar', async () => {
    const { result } = await renderHook(() => useVehicleForm('new'));
    await act(async () => result.current.setKind('motorcycle'));

    await act(async () => {
      await result.current.save();
    });

    expect(vehicleRepository.getCurrent).not.toHaveBeenCalled();
    expect(vehicleRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: undefined, kind: 'motorcycle' }));
    expect(vehicleRepository.setCurrent).toHaveBeenCalledWith(5);
    expect(syncCopilotTargets).toHaveBeenCalled();
  });

  it('editar um veículo existente não muda o atual', async () => {
    const { result } = await renderHook(() => useVehicleForm(2));
    await waitFor(() => expect(result.current.vehicleId).toBe(2));

    await act(async () => {
      await result.current.save();
    });

    expect(vehicleRepository.setCurrent).not.toHaveBeenCalled();
  });
});
