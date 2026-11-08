import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OffersHubScreen from '@features/offers/OffersHubScreen';

const mockPush = jest.fn();
const mockStatus = { current: { accessibilityGranted: false, enabled: false }, history: [] as unknown[], setEnabled: jest.fn() };
const mockOffers = { recent: [] as unknown[], day: { read: 0, accepted: 0, estimatedCents: 0 }, refresh: jest.fn() };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@features/copilot', () => ({ useCopilotStatus: () => mockStatus }));
jest.mock('@features/offers/useTodayOffers', () => ({ useTodayOffers: () => mockOffers }));

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
    Object.assign(mockOffers, { recent: [], day: { read: 0, accepted: 0, estimatedCents: 0 } });
  });

  it('sem acessibilidade, leva à configuração guiada', async () => {
    await renderHub();

    await fireEvent.press(screen.getByText('Configurar o Copiloto'));
    expect(mockPush).toHaveBeenCalledWith('/copilot-setup');
    expect(screen.getByText('Nenhuma oferta lida hoje.')).toBeTruthy();
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

  it('mostra lidas, aceitas e estimado de hoje, e as ofertas do dia', async () => {
    Object.assign(mockOffers, { recent: [OFFER], day: { read: 14, accepted: 6, estimatedCents: 26800 } });
    await renderHub();

    expect(screen.getByLabelText('Lidas hoje, 14')).toBeTruthy();
    expect(screen.getByLabelText('Aceitas, 6')).toBeTruthy();
    expect(screen.getByLabelText(/^Estimado, R\$\s268,00$/)).toBeTruthy();
    expect(screen.getByText('R$ 18,40')).toBeTruthy();
  });

  it('as ferramentas abrem a calculadora no modo certo', async () => {
    await renderHub();

    await fireEvent.press(screen.getByRole('button', { name: 'Orçamento' }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/calculator', params: { tab: 'quote' } });
    await fireEvent.press(screen.getByRole('button', { name: 'Avaliar oferta' }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/calculator', params: { tab: 'offer' } });
  });
});
