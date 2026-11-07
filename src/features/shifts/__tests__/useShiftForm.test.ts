import { act, renderHook, waitFor } from '@testing-library/react-native';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { useShiftForm } from '../useShiftForm';

const mockFocus: { callbacks: (() => void)[] } = { callbacks: [] };

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    mockFocus.callbacks.push(callback);
    useEffect(callback, [callback]);
  },
}));
jest.mock('@/data/repositories/platformRepository', () => ({ platformRepository: { list: jest.fn().mockResolvedValue([{ id: 1, name: 'Uber' }]) } }));
jest.mock('@/data/repositories/vehicleRepository', () => ({
  vehicleRepository: { getCostsAt: jest.fn().mockResolvedValue({ vehicle: null, profile: null, costs: null }) },
}));
jest.mock('@/data/repositories/shiftRepository', () => ({ shiftRepository: { findById: jest.fn(), save: jest.fn() } }));
jest.mock('@/shared/utils/reportError', () => ({ reportError: jest.fn() }));

const SAVED = {
  shift: {
    id: 7,
    vehicleId: null,
    date: '2026-11-05',
    startHour: 8,
    minutes: 125,
    km: 45.2,
    kmSource: 'manual',
    odometerEnd: null,
    trips: 9,
    costPerKm: 0,
    variablePerKm: 0,
    note: null,
  },
  earnings: [{ platformId: 1, name: 'Uber', cents: 15000 }],
  expenses: [],
};

describe('formulário da jornada', () => {
  beforeEach(() => jest.mocked(shiftRepository.findById).mockResolvedValue(SAVED as never));

  it('preenche a jornada salva com horas em H:MM e decimais com vírgula', async () => {
    const { result } = await renderHook(() => useShiftForm(7));

    await waitFor(() => expect(result.current.bind('hours').value).toBe('2:05'));
    expect(result.current.kmField.value).toBe('45,2');
    expect(result.current.bind('trips').value).toBe('9');
    expect(result.current.earnings[1]).toBe('150,00');
  });

  it('voltar à tela não apaga o que foi editado', async () => {
    const { result } = await renderHook(() => useShiftForm(7));
    await waitFor(() => expect(result.current.bind('hours').value).toBe('2:05'));

    await act(async () => result.current.bind('hours').onChangeText('3'));
    await act(async () => mockFocus.callbacks.at(-1)?.());

    expect(result.current.bind('hours').value).toBe('3');
  });

  it('editar o km tira a marca de medido por GPS', async () => {
    const { result } = await renderHook(() => useShiftForm());

    await act(async () => result.current.applyLive(60, 0, 12.34));
    expect(result.current.kmMeasured).toBe(true);
    expect(result.current.kmField.value).toBe('12,3');

    await act(async () => result.current.kmField.onChangeText('13'));
    expect(result.current.kmMeasured).toBe(false);
  });
});
