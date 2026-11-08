import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { AppTabBar } from '@features/navigation/AppTabBar';
import { TABS } from '@features/navigation/tabs';

const MINUTE = 60_000;
const mockUnseen = { count: 0 };
const mockLive = { started: false, running: false, elapsedMs: 0, start: jest.fn(async () => undefined) };

jest.mock('@features/navigation/useUnseenOffers', () => ({ useUnseenOffers: () => mockUnseen.count }));
jest.mock('@features/shifts', () => ({
  useLiveTracking: () => mockLive,
  ShiftSheet: ({ visible }: { visible: boolean }) => {
    const { Text } = jest.requireActual('react-native');
    return visible ? <Text>Controle da jornada</Text> : null;
  },
}));

const routes = TABS.map((tab) => ({ key: `${tab.name}-key`, name: tab.name, params: undefined }));
const descriptors = Object.fromEntries(TABS.map((tab) => [`${tab.name}-key`, { options: { title: tab.name } }]));

async function renderBar(index = 0) {
  const emitter = { emit: jest.fn().mockReturnValue({ defaultPrevented: false }) };
  const navigateToTab = jest.fn();
  const props = { state: { index, routes }, descriptors, emitter, navigateToTab, insets: { top: 0, bottom: 0, left: 0, right: 0 } };
  await render(<AppTabBar {...(props as unknown as BottomTabBarProps)} />);
  return { emitter, navigateToTab };
}

describe('barra de abas', () => {
  beforeEach(() => {
    mockUnseen.count = 0;
    Object.assign(mockLive, { started: false, running: false, elapsedMs: 0 });
    mockLive.start.mockClear();
  });

  it('são quatro abas e só a atual fica selecionada', async () => {
    await renderBar(1);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs.map((tab) => tab.props.accessibilityState.selected)).toEqual([false, true, false, false]);
  });

  it('só a aba ativa mostra o nome. As outras têm o nome para o leitor de tela', async () => {
    await renderBar(0);

    expect(screen.getByText('index')).toBeTruthy();
    expect(screen.queryByText('shifts')).toBeNull();
    expect(screen.getByRole('tab', { name: 'shifts' })).toBeTruthy();
  });

  it('tocar noutra aba navega', async () => {
    const { navigateToTab, emitter } = await renderBar(0);

    await act(async () => fireEvent.press(screen.getByLabelText('more')));

    expect(emitter.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'tabPress', target: 'more-key' }));
    expect(navigateToTab).toHaveBeenCalledWith('more-key');
  });

  it('a aba Ofertas mostra e anuncia as ofertas novas', async () => {
    mockUnseen.count = 3;
    await renderBar(0);

    expect(await screen.findByText('3')).toBeTruthy();
    expect(screen.getByLabelText('offer-hub, 3 ofertas novas')).toBeTruthy();
  });
});

describe('botão da jornada', () => {
  beforeEach(() => {
    Object.assign(mockLive, { started: false, running: false, elapsedMs: 0 });
    mockLive.start.mockClear();
  });

  it('sem jornada, inicia a jornada', async () => {
    const { navigateToTab } = await renderBar(1);

    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Iniciar jornada' })));

    expect(mockLive.start).toHaveBeenCalled();
    expect(navigateToTab).not.toHaveBeenCalled();
  });

  it('com a jornada rodando, mostra o tempo abreviado e abre o controle da jornada', async () => {
    Object.assign(mockLive, { started: true, running: true, elapsedMs: 134 * MINUTE });
    const { navigateToTab } = await renderBar(2);

    expect(screen.getByText('2h14')).toBeTruthy();
    expect(screen.queryByText('Controle da jornada')).toBeNull();
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Jornada em andamento, 2 horas e 14 minutos. Abrir os controles' })));

    expect(screen.getByText('Controle da jornada')).toBeTruthy();
    expect(navigateToTab).not.toHaveBeenCalled();
    expect(mockLive.start).not.toHaveBeenCalled();
  });

  it('pausada, diz o tempo parado', async () => {
    Object.assign(mockLive, { started: true, running: false, elapsedMs: 60 * MINUTE });
    await renderBar(0);

    expect(screen.getByText('1h')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Jornada pausada em 1 hora. Abrir os controles' })).toBeTruthy();
  });

  it('com 5 caracteres a fonte diminui', async () => {
    Object.assign(mockLive, { started: true, running: true, elapsedMs: 750 * MINUTE });
    await renderBar(0);

    expect(screen.getByText('12h30')).toHaveStyle({ fontSize: 14 });
  });
});
