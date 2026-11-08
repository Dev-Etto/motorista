import { act, renderHook, waitFor } from '@testing-library/react-native';
import { vehicleInUse } from '@application/vehicleInUse';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { describeFormError, useShiftForm } from '@features/shifts/useShiftForm';
import { i18n } from '@shared/i18n';
import { currentFormat } from '@shared/i18n/format';

const mockFocus: { callbacks: (() => void)[] } = { callbacks: [] };

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    mockFocus.callbacks.push(callback);
    useEffect(callback, [callback]);
  },
}));
jest.mock('@data/repositories/platformRepository', () => ({ platformRepository: { list: jest.fn().mockResolvedValue([{ id: 1, name: 'Uber' }]) } }));
jest.mock('@data/repositories/vehicleRepository', () => ({
  vehicleRepository: {
    getCostsAt: jest.fn().mockResolvedValue({ vehicle: null, profile: null, costs: null }),
    list: jest.fn().mockResolvedValue([]),
    getCurrent: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue(null),
  },
}));
jest.mock('@application/vehicleInUse', () => ({
  vehicleInUse: jest.fn(() => jest.requireMock('@data/repositories/vehicleRepository').vehicleRepository.getCurrent()),
}));
jest.mock('@data/repositories/shiftRepository', () => ({
  shiftRepository: { findById: jest.fn(), save: jest.fn(), lastOdometerEnd: jest.fn().mockResolvedValue(null) },
}));
jest.mock('@shared/utils/reportError', () => ({ reportError: jest.fn() }));

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

    await waitFor(() => expect(result.current.bind('hours').value).toBe('02:05'));
    expect(result.current.kmField.value).toBe('45,2');
    expect(result.current.bind('trips').value).toBe('9');
    expect(result.current.earnings[1]).toBe('150,00');
  });

  it('voltar à tela não apaga o que foi editado', async () => {
    const { result } = await renderHook(() => useShiftForm(7));
    await waitFor(() => expect(result.current.bind('hours').value).toBe('02:05'));

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

describe('mensagens de erro do formulário da jornada', () => {
  const t = i18n.getFixedT('pt-BR', ['shifts', 'common'] as const);
  const format = currentFormat();

  it('mostra o exemplo de número no formato da região', () => {
    expect(describeFormError('invalid-number', t, format)).toBe('Confira os números digitados. Use só números, como 150,50.');
  });

  it('explica cada problema do formulário', () => {
    expect(describeFormError('invalid-start-hour', t, format)).toBe('A hora de início vai de 0 a 23.');
    expect(describeFormError('too-long', t, format)).toBe('Uma jornada tem no máximo 24 horas. Confira as horas trabalhadas.');
    expect(describeFormError('no-earnings', t, format)).toBe('Informe o ganho de pelo menos uma plataforma.');
    expect(describeFormError('odometer-order', t, format)).toBe('O odômetro final precisa ser maior que o inicial.');
  });

  describe('erros no próprio campo', () => {
    beforeEach(() => jest.mocked(shiftRepository.findById).mockResolvedValue(null as never));

    it('horas inválidas aparecem no campo de horas, e não no aviso geral', async () => {
      const { result } = await renderHook(() => useShiftForm());
      await act(async () => result.current.bind('hours').onChangeText('08:75'));
      await act(async () => result.current.setEarning(1, '100'));
      await act(async () => {
        await result.current.save();
      });

      expect(result.current.fieldError('hours')).toBe('Use horas e minutos, como 08:30.');
      expect(result.current.error).toBeNull();
    });

    it('hora de início fora de 0 a 23 aparece no próprio campo', async () => {
      const { result } = await renderHook(() => useShiftForm());
      await act(async () => result.current.bind('startHour').onChangeText('25'));
      await act(async () => result.current.setEarning(1, '100'));
      await act(async () => {
        await result.current.save();
      });

      expect(result.current.fieldError('startHour')).toBe('A hora de início vai de 0 a 23.');
    });

    it('jornada sem ganho fica no aviso geral', async () => {
      const { result } = await renderHook(() => useShiftForm());
      await act(async () => {
        await result.current.save();
      });

      expect(result.current.error).toBe('Informe o ganho de pelo menos uma plataforma.');
      expect(result.current.fieldError('hours')).toBeNull();
    });
  });

  describe('veículo da jornada', () => {
    const CAR = { id: 1, name: 'Carro', kind: 'car', fuel: 'gasoline' };
    const MOTO = { id: 2, name: 'Moto', kind: 'motorcycle', fuel: 'gasoline' };
    const costsOf = (fullPerKm: number) => ({ vehicle: null, profile: null, costs: { fullPerKm, variablePerKm: 0 } });

    beforeEach(() => {
      jest.mocked(vehicleRepository.list).mockResolvedValue([CAR, MOTO] as never);
      jest.mocked(vehicleRepository.getCurrent).mockResolvedValue(MOTO as never);
      jest.mocked(vehicleRepository.getCostsAt).mockImplementation(async (_date, vehicleId) => costsOf(vehicleId === 1 ? 100 : 40) as never);
    });

    it('jornada nova começa com o veículo atual e usa o custo dele', async () => {
      const { result } = await renderHook(() => useShiftForm());
      await waitFor(() => expect(result.current.vehicleId).toBe(2));
      await act(async () => result.current.kmField.onChangeText('10'));

      await waitFor(() => expect(result.current.preview.vehicleCostCents).toBe(400));
    });

    it('trocar o veículo troca o custo da prévia e o que é salvo', async () => {
      const { result } = await renderHook(() => useShiftForm());
      await waitFor(() => expect(result.current.vehicles).toHaveLength(2));
      await act(async () => result.current.setVehicleId(1));
      await act(async () => result.current.kmField.onChangeText('10'));
      await act(async () => result.current.setEarning(1, '100'));

      await waitFor(() => expect(result.current.preview.vehicleCostCents).toBe(1000));
      jest.mocked(shiftRepository.save).mockResolvedValueOnce(42);
      let savedId: number | null = null;
      await act(async () => {
        savedId = await result.current.save();
      });
      expect(shiftRepository.save).toHaveBeenLastCalledWith(expect.objectContaining({ vehicleId: 1 }));
      expect(savedId).toBe(42);
    });

    it('jornada nova sugere o último odômetro final como inicial', async () => {
      jest.mocked(shiftRepository.lastOdometerEnd).mockResolvedValueOnce(45380);
      const { result } = await renderHook(() => useShiftForm());

      await waitFor(() => expect(result.current.bind('odometerStart').value).toBe('45380'));
      expect(result.current.dirty).toBe(false);
    });

    it('com jornada iniciada, o encerramento abre com o veículo da jornada', async () => {
      jest.mocked(vehicleInUse).mockResolvedValueOnce(CAR as never);
      const { result } = await renderHook(() => useShiftForm());

      await waitFor(() => expect(result.current.vehicleId).toBe(1));
    });

    it('a edição abre com o veículo da jornada', async () => {
      jest.mocked(shiftRepository.findById).mockResolvedValue({ ...SAVED, shift: { ...SAVED.shift, vehicleId: 1 } } as never);
      const { result } = await renderHook(() => useShiftForm(7));

      await waitFor(() => expect(result.current.vehicleId).toBe(1));
    });
  });
});
