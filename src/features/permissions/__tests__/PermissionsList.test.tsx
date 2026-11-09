import { fireEvent, render, screen } from '@testing-library/react-native';
import { PermissionsList } from '@features/permissions/PermissionsList';

const mockState = { accessibility: true, overlay: true, location: true, notifications: false, battery: false };
const mockOpenBattery = jest.fn();

jest.mock('@features/permissions/usePermissions', () => ({
  usePermissions: () => ({
    state: mockState,
    requestNotifications: jest.fn(),
    requestLocation: jest.fn(),
    openOverlay: jest.fn(),
    openAccessibility: jest.fn(),
    openAppSettings: jest.fn(),
    openBattery: mockOpenBattery,
  }),
}));

describe('permissões', () => {
  it('lista cada permissão com Ativa ou o botão para ligar', async () => {
    await render(<PermissionsList />);

    for (const title of ['Ler a tela', 'Sobrepor apps', 'Localização', 'Notificações', 'Sem economia de bateria']) expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getAllByText('Ativa')).toHaveLength(3);
    expect(screen.getByText('Permitir')).toBeTruthy();

    await fireEvent.press(screen.getByText('Ajustar'));
    expect(mockOpenBattery).toHaveBeenCalled();
  });

  it('sem notificações, avisa o que se perde', async () => {
    await render(<PermissionsList />);

    expect(screen.getByText('Sem notificações você não verá a jornada em andamento nem os lembretes do veículo.')).toBeTruthy();
  });
});
