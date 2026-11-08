import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import { APP_NAME, RELEASES_URL } from '@config/app';
import { spacing } from '@shared/theme/theme';
import { BrandMark } from '@shared/ui/BrandMark';
import { AppText, Card, ListRow, Screen } from '@shared/ui/primitives';
import { ABOUT_SECTIONS } from './moreMenu';

const BRAND_SIZE = 72;

export default function AboutScreen() {
  const { t } = useTranslation('settings');
  const router = useRouter();
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
        <Card key={section.id}>
          {section.items.map((item) => (
            <ListRow key={item.id} title={t(`more.item.${item.id}.title`)} chevron onPress={() => router.push(item.href)} />
          ))}
        </Card>
      ))}
      <Card>
        <ListRow title={t('more.about.updateTitle')} chevron onPress={() => Linking.openURL(RELEASES_URL)} />
      </Card>
      <AppText variant="caption" tone="muted" center>
        {t('more.about.dataStays')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
});
