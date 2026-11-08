import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import { APP_NAME, DONATION_URL, RELEASES_URL, REPOSITORY_URL } from '@config/app';
import { spacing } from '@shared/theme/theme';
import { BrandMark } from '@shared/ui/BrandMark';
import { AppText, Card, ListRow, Screen } from '@shared/ui/primitives';
import { MenuSection } from './MenuSection';
import { ABOUT_SECTIONS } from './moreMenu';

const BRAND_SIZE = 72;

export default function AboutScreen() {
  const { t } = useTranslation('settings');
  const version = Constants.expoConfig?.version ?? '';

  return (
    <Screen>
      <View style={styles.brand}>
        <BrandMark size={BRAND_SIZE} accessibilityLabel={APP_NAME} />
        <AppText variant="title" bold center>
          {APP_NAME}
        </AppText>
        <AppText tone="muted" center>
          {t('more.about.versionTitle', { version })}
        </AppText>
      </View>
      {ABOUT_SECTIONS.map((section) => (
        <MenuSection key={section.id} title={t(`more.aboutSection.${section.id}`)} items={section.items} />
      ))}
      <Card title={t('more.about.title')}>
        <ListRow icon="heart" title={t('more.about.donateTitle')} subtitle={t('more.about.donateSubtitle')} onPress={() => Linking.openURL(DONATION_URL)} />
        <ListRow icon="update" title={t('more.about.updateTitle')} subtitle={t('more.about.updateSubtitle')} onPress={() => Linking.openURL(RELEASES_URL)} />
        <ListRow icon="document" title={t('more.about.codeTitle')} subtitle={t('more.about.versionSubtitle')} onPress={() => Linking.openURL(REPOSITORY_URL)} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
});
