import { useTranslation } from 'react-i18next';
import { Screen } from '@shared/ui/primitives';
import { MenuSection } from './MenuSection';
import { MORE_SECTIONS } from './moreMenu';
import { ThemeChooser } from './ThemeChooser';

export default function MoreScreen() {
  const { t } = useTranslation('settings');

  return (
    <Screen>
      {MORE_SECTIONS.map((section) => (
        <MenuSection key={section.id} title={t(`more.section.${section.id}`)} items={section.items}>
          {section.id === 'app' ? <ThemeChooser /> : null}
        </MenuSection>
      ))}
    </Screen>
  );
}
