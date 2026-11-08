import { render, screen } from '@testing-library/react-native';
import { PLATFORM_BADGE_SIZE, PlatformBadge } from '@shared/ui/PlatformBadge';

describe('PlatformBadge', () => {
  it.each(['Uber', '99', 'inDrive'])('%s tem o mesmo tamanho fixo', async (name) => {
    await render(<PlatformBadge name={name} />);

    expect(screen.getByText(name).parent).toHaveStyle(PLATFORM_BADGE_SIZE);
  });

  it('nome longo diminui para caber, numa linha só', async () => {
    await render(<PlatformBadge name="Particular" />);

    expect(screen.getByText('Particular')).toHaveProp('adjustsFontSizeToFit', true);
    expect(screen.getByText('Particular')).toHaveProp('numberOfLines', 1);
  });
});
