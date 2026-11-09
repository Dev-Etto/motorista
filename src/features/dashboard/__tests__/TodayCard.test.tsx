import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ShiftSummary } from '@domain/shift/summary';
import { TodayCard } from '@features/dashboard/TodayCard';

const mockPush = jest.fn();
const mockLive = { started: false, start: jest.fn(async () => undefined) };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@features/shifts', () => ({ useLiveTracking: () => mockLive }));

const summary = {
  grossCents: 26800,
  profitCents: 18640,
  minutes: 300,
  km: 116,
  grossPerKm: 231,
  profitPerHour: 3728,
  partialCount: 0,
} as unknown as ShiftSummary;

describe('card Lucro hoje', () => {
  it('mostra o lucro, a meta do dia e faturou, por km e por hora', async () => {
    await render(<TodayCard summary={summary} goal={{ percent: 62, remainingCents: 11360, progress: 0.62 }} />);

    expect(screen.getByRole('header', { name: 'Lucro hoje' })).toBeTruthy();
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

  it('dia sem jornada mostra como começar no lugar dos números vazios', async () => {
    mockLive.started = false;
    await render(<TodayCard summary={{ ...summary, count: 0 }} goal={null} />);

    expect(screen.getByText('Nenhuma jornada hoje ainda.')).toBeTruthy();
    expect(screen.queryByText('Por hora')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar jornada' }));
    expect(mockLive.start).toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar passada' }));
    expect(mockPush).toHaveBeenCalledWith('/shift/new');
  });

  it('com jornada rodando e nada encerrado, explica quando os números aparecem', async () => {
    mockLive.started = true;
    await render(<TodayCard summary={{ ...summary, count: 0 }} goal={null} />);

    expect(screen.getByText('Os valores aparecem quando você encerrar a jornada.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Iniciar jornada' })).toBeNull();
  });
});
