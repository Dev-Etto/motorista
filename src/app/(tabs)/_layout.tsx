import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { AppTabBar } from '@features/navigation/AppTabBar';
import { TABS } from '@features/navigation/tabs';
import { fonts, fontSize, useTheme } from '@shared/theme/theme';

export default function TabsLayout() {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: styles.title,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: t(tab.titleKey) }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSize.title },
});
