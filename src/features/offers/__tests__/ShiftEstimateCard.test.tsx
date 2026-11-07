import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { copilot } from '@modules/copilot';
import { ShiftEstimateCard } from '../ShiftEstimateCard';

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

describe('sugestão na jornada', () => {
  it('não aparece sem corridas aceitas', async () => {
    jest.mocked(copilot.getOffers).mockResolvedValue([offer('Uber', 1000, 'declined')] as never);
    await render(<ShiftEstimateCard range={RANGE} platforms={PLATFORMS} onApply={jest.fn()} />);
    await act(async () => {});

    expect(copilot.getOffers).toHaveBeenCalled();
    expect(screen.queryByText('Sugestão pelos aceites')).toBeNull();
  });

  it('só preenche os ganhos quando o motorista pede', async () => {
    const onApply = jest.fn();
    jest
      .mocked(copilot.getOffers)
      .mockResolvedValue([offer('Uber', 1000, 'accepted'), offer('Uber', 500, 'accepted', 200), offer('99', 2000, 'declined')] as never);
    await render(<ShiftEstimateCard range={RANGE} platforms={PLATFORMS} onApply={onApply} />);
    expect(onApply).not.toHaveBeenCalled();

    await fireEvent.press(await screen.findByText('Usar estes valores'));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(1, '15,00');
    expect(screen.getByText('Valores preenchidos abaixo. Confira e ajuste antes de salvar.')).toBeTruthy();
  });

  it('ignora corridas fora do período', async () => {
    jest.mocked(copilot.getOffers).mockResolvedValue([offer('Uber', 1000, 'accepted', 5000)] as never);
    await render(<ShiftEstimateCard range={RANGE} platforms={PLATFORMS} onApply={jest.fn()} />);
    await act(async () => {});

    expect(copilot.getOffers).toHaveBeenCalled();
    expect(screen.queryByText('Sugestão pelos aceites')).toBeNull();
  });
});
