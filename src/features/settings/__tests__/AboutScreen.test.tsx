import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AboutScreen from '@features/settings/AboutScreen';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '0.16.0' } }));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

describe('sobre', () => {
  it('mostra a versão, os seus dados, o legal e fecha dizendo onde os dados ficam', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AboutScreen />
      </SafeAreaProvider>,
    );

    expect(screen.getByText('Versão 0.16.0')).toBeTruthy();
    for (const row of ['Meu resumo para compartilhar', 'Relatar um problema', 'Apoiar o projeto', 'Privacidade', 'Termos de uso']) {
      expect(screen.getByText(row)).toBeTruthy();
    }
    expect(screen.getByText('Seus dados ficam só no seu celular.')).toBeTruthy();
  });
});
