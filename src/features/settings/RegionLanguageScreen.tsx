import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Language } from '@domain/regional/regional';
import { enablePseudoLanguage, PSEUDO_LANGUAGE, setLanguage } from '@shared/i18n';
import { Card, ListRow, Screen } from '@shared/ui/primitives';
import { useRegionSettings } from './useRegionSettings';

async function showPseudoLanguage() {
  enablePseudoLanguage();
  await setLanguage(PSEUDO_LANGUAGE);
}

export default function RegionLanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation(['settings', 'common']);
  const region = useRegionSettings();

  const choose = async (language: Language | null) => {
    await region.chooseLanguage(language);
    router.back();
  };

  return (
    <Screen>
      <Card>
        <ListRow
          title={t('region.language.automatic', { language: t(`common:languageName.${region.automatic.language}`) })}
          subtitle={t('region.language.automaticHint')}
          selected={region.followsDeviceLanguage}
          onPress={() => void choose(null)}
        />
        {region.languages.map((language) => (
          <ListRow
            key={language}
            title={t(`common:languageName.${language}`)}
            selected={!region.followsDeviceLanguage && region.profile.language === language}
            onPress={() => void choose(language)}
          />
        ))}
        {__DEV__ ? <ListRow title={PSEUDO_LANGUAGE} onPress={() => void showPseudoLanguage()} /> : null}
      </Card>
    </Screen>
  );
}
