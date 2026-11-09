import { renderHook, waitFor } from '@testing-library/react-native';
import { useAcceptedEarnings } from '@features/offers/useAcceptedEarnings';
import { copilot } from '@modules/copilot';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));
jest.mock('@modules/copilot', () => ({ copilot: { getOffers: jest.fn() } }));

const offer = (source: string, valueCents: number, status: string, timestamp = 100) => ({
  timestamp,
  source,
  valueCents,
  km: 5,
  minutes: 10,
  perKmCents: 1,
  perHourCents: 1,
  color: 'green',
  status,
});
const RANGE = { from: 0, to: 1000 };
const PLATFORMS = [
  { id: 1, name: 'Uber' },
  { id: 2, name: '99' },
];

describe('ganhos pelas corridas aceitas', () => {
  it('soma só as aceitas, por plataforma, com o número de corridas', async () => {
    jest
      .mocked(copilot.getOffers)
      .mockResolvedValue([offer('Uber', 1000, 'accepted'), offer('Uber', 500, 'accepted', 200), offer('99', 2000, 'declined')] as never);
    const { result } = await renderHook(() => useAcceptedEarnings(RANGE, PLATFORMS));

    await waitFor(() => expect(result.current.trips).toBe(2));
    expect(result.current.matched).toEqual([{ platformId: 1, cents: 1500, trips: 2 }]);
    expect(result.current.tripsOf(1)).toBe(2);
    expect(result.current.tripsOf(2)).toBe(0);
  });

  it('ignora corridas fora do período e avisa plataformas que não estão ligadas', async () => {
    jest.mocked(copilot.getOffers).mockResolvedValue([offer('Uber', 1000, 'accepted', 5000), offer('inDrive', 900, 'accepted')] as never);
    const { result } = await renderHook(() => useAcceptedEarnings(RANGE, PLATFORMS));

    await waitFor(() => expect(result.current.unmatched).toEqual(['inDrive']));
    expect(result.current.matched).toEqual([]);
  });
});
