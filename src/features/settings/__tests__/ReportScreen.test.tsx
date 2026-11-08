import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ReportScreen from '@features/settings/ReportScreen';
import { setProblemReportTransport } from '@shared/platform/problemReports';

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const mockSend = jest.fn();

jest.mock('@modules/copilot', () => ({
  copilot: {
    getStatus: () => ({ accessibilityGranted: true, failedReads: 1 }),
    getDiagnostics: () => ['R$ 13 | xxxxxx'],
  },
}));
jest.mock('@shared/utils/reportError', () => ({ reportError: jest.fn() }));

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ReportScreen />
    </SafeAreaProvider>,
  );

describe('relatar problema', () => {
  beforeEach(() => {
    mockSend.mockReset();
    setProblemReportTransport({ send: mockSend });
  });

  it('envia a descrição sem as leituras do Copiloto por padrão', async () => {
    mockSend.mockResolvedValue(undefined);
    await renderScreen();

    await fireEvent.changeText(screen.getByLabelText('Conte com suas palavras'), ' A Uber não avisa. ');
    await fireEvent.press(screen.getByText('Enviar relato'));

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ description: 'A Uber não avisa.', failedReads: 1, readings: [] }));
    expect(await screen.findByText('Relato enviado')).toBeTruthy();
    expect(screen.queryByText(/R\$ 13 \| xxxxxx/)).toBeNull();
  });

  it('inclui as leituras mascaradas quando o motorista escolhe', async () => {
    mockSend.mockResolvedValue(undefined);
    await renderScreen();

    await fireEvent.changeText(screen.getByLabelText('Conte com suas palavras'), 'Oferta não lida');
    await fireEvent(screen.getByLabelText('Incluir o que o Copiloto leu'), 'valueChange', true);
    expect(screen.getByText(/R\$ 13 \| xxxxxx/)).toBeTruthy();

    await fireEvent.press(screen.getByText('Enviar relato'));
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ readings: ['R$ 13 | xxxxxx'] }));
  });

  it('avisa quando não consegue enviar', async () => {
    mockSend.mockRejectedValue(new Error('offline'));
    await renderScreen();

    await fireEvent.changeText(screen.getByLabelText('Conte com suas palavras'), 'Travou');
    await fireEvent.press(screen.getByText('Enviar relato'));

    expect(await screen.findByText(/Não deu para enviar agora/)).toBeTruthy();
  });
});
