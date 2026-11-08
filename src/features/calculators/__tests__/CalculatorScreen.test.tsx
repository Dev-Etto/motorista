import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CalculatorScreen from '@features/calculators/CalculatorScreen';

const mockParams = { tab: 'offer' };
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <CalculatorScreen />
    </SafeAreaProvider>,
  );

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return {
    useLocalSearchParams: () => mockParams,
    useRouter: () => ({ push: jest.fn() }),
    Stack: { Screen: ({ options }: { options: { title?: string } }) => (options.title ? <MockText>{`título: ${options.title}`}</MockText> : null) },
  };
});
jest.mock('@features/calculators/useCostPerKm', () => ({ useCostBasis: () => ({ costPerKm: 80, vehicleName: null }) }));
jest.mock('@features/calculators/OfferCalculator', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return { OfferCalculator: () => <MockText>avaliar</MockText> };
});
jest.mock('@features/calculators/QuoteCalculator', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return { QuoteCalculator: () => <MockText>orçamento</MockText> };
});

describe('calculadoras', () => {
  it('Avaliar oferta é uma tela própria, sem seletor de abas', async () => {
    mockParams.tab = 'offer';
    await renderScreen();

    expect(screen.getByText('título: Avaliar oferta')).toBeTruthy();
    expect(screen.getByText('avaliar')).toBeTruthy();
    expect(screen.queryByText('orçamento')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('Orçamento particular é outra tela, com o próprio título', async () => {
    mockParams.tab = 'quote';
    await renderScreen();

    expect(screen.getByText('título: Orçamento particular')).toBeTruthy();
    expect(screen.getByText('orçamento')).toBeTruthy();
    expect(screen.queryByText('avaliar')).toBeNull();
  });
});
