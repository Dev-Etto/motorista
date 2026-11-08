import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@shared/theme/theme';
import { AppText, Button, Card, Screen } from '@shared/ui/primitives';

const SECTIONS = ['read', 'purpose', 'stored', 'never', 'control'] as const;

export function AccessibilityDisclosure({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const { t } = useTranslation('copilot');
  return (
    <Screen>
      <View style={styles.title}>
        <AppText variant="title" bold accessibilityRole="header">
          {t('setup.disclosure.title')}
        </AppText>
        <AppText tone="muted">{t('setup.disclosure.intro')}</AppText>
      </View>
      <Card>
        {SECTIONS.map((section) => (
          <View key={section} style={styles.section}>
            <AppText bold>{t(`setup.disclosure.${section}.title`)}</AppText>
            <AppText>{t(`setup.disclosure.${section}.body`)}</AppText>
          </View>
        ))}
      </Card>
      <Button label={t('setup.disclosure.accept')} onPress={onAccept} />
      <Button label={t('setup.disclosure.decline')} variant="secondary" onPress={onDecline} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { gap: spacing.sm },
  section: { gap: spacing.xs },
});
