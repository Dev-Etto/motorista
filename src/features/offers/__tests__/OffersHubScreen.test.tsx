import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OffersHubScreen from '@features/offers/OffersHubScreen';

const mockPush = jest.fn();
const mockStatus = { current: { accessibilityGranted: false, enabled: false }, history: [] as unknown[], setEnabled: jest.fn() };
const emptyOffers = () => ({
  period: 'today',
  custom: { start: '2026-11-09', end: '2026-11-09' },
  outcome: 'accepted',
  source: 'all',
  sources: [] as string[],
  estimate: { totalCents: 0, trips: 0, byPlatform: [] },
  summary: { received: 0, accepted: 0, notAccepted: 0, acceptedPerKm: null, notAcceptedPerKm: null },
  averageScore: null,
  offers: [] as unknown[],
  hasMore: false,
  estimating: false,
  setPeriod: jest.fn(),
  setCustom: jest.fn(),
  setOutcome: jest.fn(),
  setSource: jest.fn(),
  showMore: jest.fn(),
  clear: jest.fn(),
  reload: jest.fn(),
  toggleEstimating: jest.fn(),
});
const mockOffers = emptyOffers();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@features/copilot', () => ({ useCopilotStatus: () => mockStatus }));
jest.mock('@features/offers/useOffers', () => ({ ALL_SOURCES: 'all', useOffers: () => mockOffers }));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderHub = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <OffersHubScreen />
    </SafeAreaProvider>,
  );

const OFFER = { timestamp: 1, source: 'Uber', valueCents: 1840, km: 8.5, minutes: 19, perKmCents: 216, perHourCents: 5810, color: 'green' };

describe('aba Ofertas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockStatus, { current: { accessibilityGranted: false, enabled: false } });
    Object.assign(mockOffers, emptyOffers());
  });

  it('sem acessibilidade, leva à configuração guiada', async () => {
    await renderHub();

    await fireEvent.press(screen.getByText('Configurar o Copiloto'));
    expect(mockPush).toHaveBeenCalledWith('/copilot-setup');
    expect(screen.getByText('Nenhuma oferta aqui')).toBeTruthy();
  });

  it('lendo, mostra o status e leva aos ajustes do Copiloto', async () => {
    Object.assign(mockStatus, { current: { accessibilityGranted: true, enabled: true } });
    await renderHub();

    await fireEvent.press(screen.getByRole('button', { name: /Copiloto lendo/ }));
    expect(mockPush).toHaveBeenCalledWith('/copilot');
    expect(screen.queryByText('Configurar o Copiloto')).toBeNull();
  });

  it('desligado, diz que o Copiloto está pausado', async () => {
    Object.assign(mockStatus, { current: { accessibilityGranted: true, enabled: false } });
    await renderHub();

    expect(screen.getByText('Copiloto pausado')).toBeTruthy();
  });

  it('mostra lidas, aceitas e estimado do período e a lista filtrada', async () => {
    Object.assign(mockOffers, {
      offers: [OFFER],
      summary: { ...mockOffers.summary, received: 14, accepted: 6 },
      estimate: { totalCents: 26800, trips: 6, byPlatform: [] },
    });
    await renderHub();

    expect(screen.getByLabelText('Lidas, 14')).toBeTruthy();
    expect(screen.getByLabelText('Aceitas, 6')).toBeTruthy();
    expect(screen.getByLabelText(/^Estimado, R\$\s268,00$/)).toBeTruthy();
    expect(screen.getByText('R$ 18,40')).toBeTruthy();
  });

  it('com o filtro em Aceitas e a lista vazia, oferece ver todas', async () => {
    await renderHub();

    await fireEvent.press(screen.getByRole('button', { name: 'Ver todas' }));
    expect(mockOffers.setOutcome).toHaveBeenCalledWith('all');
  });

  it('as ferramentas abrem a calculadora no modo certo', async () => {
    await renderHub();

    await fireEvent.press(screen.getByRole('button', { name: 'Orçamento' }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/calculator', params: { tab: 'quote' } });
    await fireEvent.press(screen.getByRole('button', { name: 'Avaliar oferta' }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/calculator', params: { tab: 'offer' } });
  });
});
