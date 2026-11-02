import { useRouter } from 'expo-router';
import { AppText, Button, Collapsible, Screen } from '@/shared/ui/primitives';
import { HELP_SECTIONS } from './helpContent';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <Screen>
      {HELP_SECTIONS.map((section) => (
        <Collapsible key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph) => (
            <AppText key={paragraph}>{paragraph}</AppText>
          ))}
        </Collapsible>
      ))}
      <Button label="Rever a introdução" variant="secondary" onPress={() => router.push({ pathname: '/onboarding', params: { replay: '1' } })} />
    </Screen>
  );
}
