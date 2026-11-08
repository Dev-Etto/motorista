import { render, screen } from '@testing-library/react-native';
import type { ShiftSummary } from '@domain/shift/summary';
import { TodayCard } from '@features/dashboard/TodayCard';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const summary = {
  grossCents: 26800,
  profitCents: 18640,
  minutes: 300,
  km: 116,
  grossPerKm: 231,
  profitPerHour: 3728,
  partialCount: 0,
} as unknown as ShiftSummary;

describe('card Sobrou hoje', () => {
  it('mostra o lucro, a meta do dia e faturou, por km e por hora', async () => {
    await render(<TodayCard summary={summary} goal={{ percent: 62, remainingCents: 11360, progress: 0.62 }} />);

    expect(screen.getByRole('header', { name: 'Sobrou hoje' })).toBeTruthy();
    expect(screen.getByText(/R\$\s186,40/)).toBeTruthy();
    expect(screen.getByText(/62% da meta de hoje · faltam R\$\s113,60/)).toBeTruthy();
    expect(screen.getByText('Faturou')).toBeTruthy();
    expect(screen.getByText('Por km')).toBeTruthy();
    expect(screen.getByText('Por hora')).toBeTruthy();
  });

  it('meta batida avisa sem dizer quanto falta', async () => {
    await render(<TodayCard summary={summary} goal={{ percent: 120, remainingCents: 0, progress: 1 }} />);

    expect(screen.getByText('Meta de hoje batida · 120%')).toBeTruthy();
  });

  it('sem meta do dia, não mostra a barra', async () => {
    await render(<TodayCard summary={summary} goal={null} />);

    expect(screen.queryByText(/da meta de hoje/)).toBeNull();
  });
});
