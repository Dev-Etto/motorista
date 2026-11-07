import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { AppTabBar } from '@features/navigation/AppTabBar';
import { TABS } from '@features/navigation/tabs';

const mockUnseen = { count: 0 };

jest.mock('@features/navigation/ShiftBar', () => ({ ShiftBar: () => null }));
jest.mock('@features/navigation/useUnseenOffers', () => ({ useUnseenOffers: () => mockUnseen.count }));

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
  });

  it('cada aba é uma tab e só a atual fica selecionada', async () => {
    await renderBar(1);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs.map((tab) => tab.props.accessibilityState.selected)).toEqual([false, true, false, false, false]);
  });

  it('tocar noutra aba navega', async () => {
    const { navigateToTab, emitter } = await renderBar(0);

    await act(async () => fireEvent.press(screen.getByLabelText('reports')));

    expect(emitter.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'tabPress', target: 'reports-key' }));
    expect(navigateToTab).toHaveBeenCalledWith('reports-key');
  });

  it('a aba Ofertas mostra e anuncia as ofertas novas', async () => {
    mockUnseen.count = 3;
    await renderBar(0);

    expect(await screen.findByText('3')).toBeTruthy();
    expect(screen.getByLabelText('offer-hub, 3 ofertas novas')).toBeTruthy();
  });
});
