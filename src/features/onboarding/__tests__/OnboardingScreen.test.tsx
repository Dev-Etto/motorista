import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { resetWorkProfileCache } from '@application/workProfile';
import { settingsRepository } from '@data/repositories/settingsRepository';
import OnboardingScreen from '@features/onboarding/OnboardingScreen';

const mockReplace = jest.fn();
const mockSave = jest.fn(async () => false);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@application/useRegional', () => ({ useRegional: () => ({ language: 'pt-BR' }) }));
jest.mock('@features/permissions', () => ({ PermissionsList: () => null, enableCopilotIfGranted: jest.fn(async () => undefined) }));
jest.mock('@features/vehicle', () => ({
  useVehicleForm: () => ({ save: mockSave, costs: { fullPerKm: 69, fixedMonthly: 0 }, error: null }),
  VehicleQuickForm: () => null,
  CostExample: () => null,
  CostHero: () => null,
}));
jest.mock('@features/copilot', () => ({ useCopilotStatus: () => ({ current: { accessibilityGranted: false } }) }));
jest.mock('@features/offers', () => ({ OfferRow: () => null }));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { workProfile: 'work_profile' },
  settingsRepository: { set: jest.fn(async () => undefined), getEnum: jest.fn(async () => 'rides') },
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
  beforeEach(() => {
    jest.clearAllMocks();
    resetWorkProfileCache();
  });

  it('as boas-vindas mostram a logo, o título e o subtítulo', async () => {
    await renderScreen();

    expect(screen.getByRole('image', { name: 'Motorista' })).toBeTruthy();
    expect(screen.getByText('Saiba quanto sobra de cada corrida e entrega.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Começar' })).toBeTruthy();
  });

  it('cada passo mostra o progresso e Pular', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Começar' }));

    expect(screen.getByLabelText('Passo 1 de 6')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));

    expect(screen.getByLabelText('Passo 3 de 6')).toBeTruthy();
  });

  it('Pular no cadastro do veículo conclui o primeiro uso', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Pular introdução' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('no fim, mostra o que ficou pronto e a meta como opcional', async () => {
    mockSave.mockResolvedValueOnce(true);
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Pular introdução' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ver meu custo' }));
    expect(await screen.findByLabelText('Passo 5 de 6')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));
    expect(screen.getByText('Assim aparece uma oferta')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));

    expect(screen.getByRole('header', { name: 'Tudo pronto' })).toBeTruthy();
    expect(screen.getByLabelText(/^Custo do carro · R\$\s0,69\/km$/)).toBeTruthy();
    expect(screen.getByLabelText('Copiloto ainda desligado')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Definir a meta do mês/ })).toBeTruthy();
  });

  it('o perfil escolhido fica salvo e muda os textos', async () => {
    mockSave.mockResolvedValueOnce(true);
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Pular introdução' }));

    expect(screen.getByText('Como você trabalha?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: /^Entregas/ }));
    expect(settingsRepository.set).toHaveBeenCalledWith('work_profile', 'deliveries');
    expect(screen.getByRole('radio', { name: /^Entregas/ }).props.accessibilityState).toEqual({ checked: true });

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ver meu custo' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Pular' }));

    expect(screen.getByText(/^Quem decide as entregas é sempre você/)).toBeTruthy();
  });
});
