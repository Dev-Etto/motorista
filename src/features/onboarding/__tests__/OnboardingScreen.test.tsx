import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from '@features/onboarding/OnboardingScreen';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@application/useRegional', () => ({ useRegional: () => ({ language: 'pt-BR' }) }));
jest.mock('@features/permissions', () => ({ PermissionsList: () => null, enableCopilotIfGranted: jest.fn(async () => undefined) }));
jest.mock('@features/vehicle', () => ({
  useVehicleForm: () => ({ save: jest.fn(async () => false), costs: { fullPerKm: 69, fixedMonthly: 0 }, error: null }),
  VehicleQuickForm: () => null,
  CostExample: () => null,
}));
jest.mock('@features/onboarding/finishOnboarding', () => ({ markOnboarded: jest.fn(async () => undefined) }));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <OnboardingScreen />
    </SafeAreaProvider>,
  );

describe('primeiro uso', () => {
  beforeEach(() => jest.clearAllMocks());

  it('as boas-vindas mostram a logo, o título e o subtítulo', async () => {
    await renderScreen();

    expect(screen.getByRole('image', { name: 'Motorista' })).toBeTruthy();
    expect(screen.getByText('Saiba quanto sobra de cada corrida.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Começar' })).toBeTruthy();
  });

  it('cada passo mostra o progresso e Pular', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Começar' }));

    expect(screen.getByLabelText('Passo 1 de 5')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));

    expect(screen.getByLabelText('Passo 3 de 5')).toBeTruthy();
  });

  it('Pular no cadastro do veículo conclui o primeiro uso', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Pular introdução' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
