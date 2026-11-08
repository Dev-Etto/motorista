import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppearanceScreen from '@features/settings/AppearanceScreen';
import { saveThemeMode } from '@features/settings/themePreference';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@features/settings/themePreference', () => ({ loadThemeMode: jest.fn(async () => 'system'), saveThemeMode: jest.fn(async () => undefined) }));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

describe('Aparência', () => {
  it('três quadros de tema em um grupo de rádios, e escolher salva', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AppearanceScreen />
      </SafeAreaProvider>,
    );

    expect(await screen.findByRole('radio', { name: 'Automático', checked: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Escuro' }));

    expect(saveThemeMode).toHaveBeenCalledWith('dark');
    expect(screen.getByRole('radio', { name: 'Escuro', checked: true })).toBeTruthy();
  });
});
