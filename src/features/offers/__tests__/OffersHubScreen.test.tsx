import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OffersHubScreen from '@features/offers/OffersHubScreen';

const mockPush = jest.fn();
const mockStatus = { current: { accessibilityGranted: false, enabled: false }, history: [] as unknown[], setEnabled: jest.fn() };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@features/copilot', () => ({ useCopilotStatus: () => mockStatus, useOfferTargets: () => ({}), OfferTargetsSummary: () => null }));

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
    Object.assign(mockStatus, { current: { accessibilityGranted: false, enabled: false }, history: [] });
  });

  it('sem acessibilidade, leva à configuração guiada', async () => {
    await renderHub();

    await fireEvent.press(screen.getByText('Configurar o Copiloto'));
    expect(mockPush).toHaveBeenCalledWith('/copilot-setup');
    expect(screen.getByText('As ofertas lidas pelo Copiloto aparecem aqui.')).toBeTruthy();
  });

  it('com acessibilidade, mostra o interruptor e as últimas ofertas', async () => {
    Object.assign(mockStatus, { current: { accessibilityGranted: true, enabled: true }, history: [OFFER] });
    await renderHub();

    expect(screen.getByText('Ler ofertas')).toBeTruthy();
    expect(screen.queryByText('Configurar o Copiloto')).toBeNull();
    expect(screen.getByText('R$ 18,40')).toBeTruthy();
  });

  it('as ferramentas abrem a calculadora no modo certo', async () => {
    await renderHub();

    await fireEvent.press(screen.getByText('Orçamento de corrida particular'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/calculator', params: { tab: 'quote' } });
    await fireEvent.press(screen.getByText('Avaliar uma oferta'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/calculator', params: { tab: 'offer' } });
  });
});
