import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { fonts, fontSize, radius, useTheme } from '@shared/theme/theme';
import { AppIcon, AppIconName } from '@shared/ui/AppIcon';

const TABS = [
  { name: 'index', titleKey: 'tabs.home', icon: 'home' },
  { name: 'shifts', titleKey: 'tabs.shifts', icon: 'shifts' },
  { name: 'calculator', titleKey: 'tabs.calculator', icon: 'calculator' },
  { name: 'reports', titleKey: 'tabs.reports', icon: 'reports' },
  { name: 'more', titleKey: 'tabs.more', icon: 'more' },
] as const satisfies readonly { name: string; titleKey: string; icon: AppIconName }[];

export default function TabsLayout() {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: styles.title,
        tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 0, boxShadow: colors.cardShadow },
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: styles.label,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.icon, focused ? { backgroundColor: colors.primary } : null]}>
                <AppIcon name={tab.icon} color={focused ? colors.onPrimary : color} size={22} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 52, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bold },
  title: { fontFamily: fonts.bold, fontSize: fontSize.title },
});
