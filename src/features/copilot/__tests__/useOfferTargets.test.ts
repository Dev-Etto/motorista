import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_LOW_DEMAND_TARGETS } from '@/domain/offer/offer';
import { loadOfferSettings, saveModeTargets } from '@/application/offerSettings';
import { useOfferTargets } from '../useOfferTargets';

const mockFocus: { callback: (() => void) | null } = { callback: null };

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocus.callback = callback;
  },
}));
jest.mock('@/application/offerSettings', () => ({
  loadOfferSettings: jest.fn(),
  saveModeTargets: jest.fn().mockResolvedValue(undefined),
  saveOfferMode: jest.fn().mockResolvedValue(undefined),
  saveFollowGoal: jest.fn().mockResolvedValue(undefined),
}));

const load = jest.mocked(loadOfferSettings);
const saved = { mode: 'normal' as const, normal: { targetPerKmCents: 200, targetPerHourCents: 4000 }, low: DEFAULT_LOW_DEMAND_TARGETS, followGoal: false };

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
    expect(saveModeTargets).toHaveBeenCalledWith('normal', { targetPerKmCents: 250, targetPerHourCents: 4000 });
  });
});
