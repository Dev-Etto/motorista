import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { DONATION_URL, RELEASES_URL, REPOSITORY_URL } from '@config/app';
import { useFormat } from '@shared/i18n/format';
import { Card, ListRow, Screen } from '@shared/ui/primitives';
import { MORE_SECTIONS } from './moreMenu';
import { ThemeChooser } from './ThemeChooser';

export default function MoreScreen() {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const format = useFormat();

  return (
    <Screen>
      {MORE_SECTIONS.map((section) => (
        <Card key={section.id} title={t(`more.section.${section.id}`)}>
          {section.id === 'preferences' ? <ThemeChooser /> : null}
          {section.items.map((item) => (
            <ListRow
              key={item.id}
              icon={item.icon}
              title={t(`more.item.${item.id}.title`)}
              subtitle={t(`more.item.${item.id}.subtitle`, { unit: format.distanceUnit })}
              onPress={() => router.push(item.href)}
            />
          ))}
        </Card>
      ))}
      <Card title={t('more.about.title')}>
        <ListRow icon="heart" title={t('more.about.donateTitle')} subtitle={t('more.about.donateSubtitle')} onPress={() => Linking.openURL(DONATION_URL)} />
        <ListRow icon="update" title={t('more.about.updateTitle')} subtitle={t('more.about.updateSubtitle')} onPress={() => Linking.openURL(RELEASES_URL)} />
        <ListRow
          icon="document"
          title={t('more.about.versionTitle', { version: Constants.expoConfig?.version ?? '' })}
          subtitle={t('more.about.versionSubtitle')}
          onPress={() => Linking.openURL(REPOSITORY_URL)}
        />
      </Card>
    </Screen>
  );
}
