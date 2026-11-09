import { act, renderHook } from '@testing-library/react-native';
import { loadOfferSettings, saveModeTargets } from '@application/offerSettings';
import { DEFAULT_LOW_DEMAND_TARGETS } from '@domain/offer/offer';
import { useOfferTargets } from '@features/copilot/useOfferTargets';

const mockFocus: { callback: (() => void) | null } = { callback: null };

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocus.callback = callback;
  },
}));
jest.mock('@application/offerSettings', () => ({
  loadOfferSettings: jest.fn(),
  saveModeTargets: jest.fn().mockResolvedValue(undefined),
  saveOfferMode: jest.fn().mockResolvedValue(undefined),
  saveFollowGoal: jest.fn().mockResolvedValue(undefined),
}));

const load = jest.mocked(loadOfferSettings);
const saved = {
  kind: 'car' as const,
  mode: 'normal' as const,
  normal: { targetPerKmCents: 200, targetPerHourCents: 4000 },
  low: DEFAULT_LOW_DEMAND_TARGETS,
  followGoal: false,
};

const focus = async () => act(async () => mockFocus.callback?.());

describe('useOfferTargets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    load.mockResolvedValue(saved);
  });

  it('voltar à tela não apaga o que o motorista está digitando', async () => {
    const { result } = await renderHook(() => useOfferTargets());
    await focus();
    expect(result.current.perKm.value).toBe('2,00');

    await act(async () => result.current.perKm.onChangeText('2,'));
    await focus();

    expect(result.current.perKm.value).toBe('2,');
  });

  it('recarregar de propósito traz os valores salvos', async () => {
    const { result } = await renderHook(() => useOfferTargets());
    await focus();
    await act(async () => result.current.perKm.onChangeText('2,'));

    await act(async () => result.current.reload());

    expect(result.current.perKm.value).toBe('2,00');
  });

  it('salva os mínimos ao sair do campo, não a cada tecla', async () => {
    const { result } = await renderHook(() => useOfferTargets());
    await focus();

    await act(async () => result.current.perKm.onChangeText('2,'));
    await act(async () => result.current.perKm.onChangeText('2,5'));
    expect(saveModeTargets).not.toHaveBeenCalled();

    await act(async () => result.current.perKm.onBlur());
    expect(saveModeTargets).toHaveBeenCalledTimes(1);
    expect(saveModeTargets).toHaveBeenCalledWith('car', 'normal', { targetPerKmCents: 250, targetPerHourCents: 4000 });
  });

  it('trocar para a moto carrega e salva os mínimos da moto', async () => {
    const { result } = await renderHook(() => useOfferTargets());
    await focus();
    load.mockResolvedValueOnce({ ...saved, kind: 'motorcycle', normal: { targetPerKmCents: 150, targetPerHourCents: 2000 } });

    await act(async () => result.current.setKind('motorcycle'));
    expect(load).toHaveBeenLastCalledWith('motorcycle');
    expect(result.current.kind).toBe('motorcycle');
    expect(result.current.perKm.value).toBe('1,50');

    await act(async () => result.current.perKm.onChangeText('1,8'));
    await act(async () => result.current.perKm.onBlur());
    expect(saveModeTargets).toHaveBeenCalledWith('motorcycle', 'normal', { targetPerKmCents: 180, targetPerHourCents: 2000 });
  });
});
