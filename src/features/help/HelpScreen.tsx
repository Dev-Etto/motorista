import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { AppText, Button, Collapsible, Screen } from '@shared/ui/primitives';
import { ExampleRideCard } from './ExampleRideCard';
import { helpSections } from './helpContent';

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation('help');
  const format = useFormat();

  return (
    <Screen>
      <ExampleRideCard />
      {helpSections(t, format).map((section) => (
        <Collapsible key={section.id} title={section.title}>
          {section.paragraphs.map((paragraph) => (
            <AppText key={paragraph}>{paragraph}</AppText>
          ))}
        </Collapsible>
      ))}
      <Button label={t('screen.replayIntro')} variant="secondary" onPress={() => router.push({ pathname: '/onboarding', params: { replay: '1' } })} />
    </Screen>
  );
}
