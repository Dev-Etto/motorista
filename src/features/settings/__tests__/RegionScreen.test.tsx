import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RegionScreen from '@features/settings/RegionScreen';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@features/settings/useRegionSettings', () => ({
  useRegionSettings: () => ({
    profile: { language: 'pt-BR', formatLocale: 'pt-BR', market: 'BR', firstWeekday: 1, distanceUnit: 'km', volumeUnit: 'L', consumptionUnit: 'km/L' },
    automatic: { language: 'pt-BR', formatLocale: 'pt-BR' },
    markets: ['BR'],
    currencyOf: () => 'BRL',
    followsDeviceLanguage: true,
    followsDeviceFormat: false,
    hasSavedData: jest.fn(),
  }),
}));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

describe('idioma e região', () => {
  it('começa com a prévia e lista idioma, formato, país e as unidades', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <RegionScreen />
      </SafeAreaProvider>,
    );

    for (const label of ['Dinheiro', 'Data', 'Consumo']) expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.getByText('R$ 1.236,80')).toBeTruthy();
    expect(screen.getByText('Automático · Português')).toBeTruthy();
    expect(screen.getByText('Português (Brasil)')).toBeTruthy();
    expect(screen.getByText('Brasil · real')).toBeTruthy();
    expect(screen.getByText('Unidades')).toBeTruthy();
    expect(screen.getByText('Combustível')).toBeTruthy();
    expect(screen.getByText('Semana começa')).toBeTruthy();
    expect(screen.getByText('seg')).toBeTruthy();
  });
});
