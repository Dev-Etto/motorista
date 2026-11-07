import { render, screen } from '@testing-library/react-native';
import { MIN_TOUCH_TARGET } from '@shared/theme/theme';
import { ListRow, Segmented } from '@shared/ui/primitives';

const OPTIONS = [
  { value: 'km', label: 'Quilômetros' },
  { value: 'mi', label: 'Milhas' },
];

describe('Segmented', () => {
  it('cada opção é um rádio marcado ou não, dentro de um grupo', async () => {
    await render(<Segmented value="km" options={OPTIONS} onChange={jest.fn()} />);

    const chosen = screen.getByRole('radio', { name: 'Quilômetros', checked: true });
    expect(chosen.parent?.props.accessibilityRole).toBe('radiogroup');
    expect(screen.getByRole('radio', { name: 'Milhas', checked: false })).toBeTruthy();
  });

  it('cada opção tem a altura mínima de toque', async () => {
    await render(<Segmented value="km" options={OPTIONS} onChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: 'Milhas' })).toHaveStyle({ minHeight: MIN_TOUCH_TARGET });
  });
});

describe('ListRow', () => {
  it('linha de escolha é um rádio', async () => {
    await render(<ListRow title="Português" selected onPress={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Português', checked: true })).toBeTruthy();
  });

  it('linha de navegação é um botão', async () => {
    await render(<ListRow title="Idioma" chevron onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Idioma' })).toBeTruthy();
  });
});
