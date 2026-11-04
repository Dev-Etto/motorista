import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '@/shared/theme/theme';
import { AppIcon, AppIconName } from '@/shared/ui/AppIcon';

const TABS: { name: string; title: string; icon: AppIconName }[] = [
  { name: 'index', title: 'Início', icon: 'home' },
  { name: 'shifts', title: 'Jornadas', icon: 'shifts' },
  { name: 'calculator', title: 'Calculadora', icon: 'calculator' },
  { name: 'reports', title: 'Relatórios', icon: 'reports' },
  { name: 'more', title: 'Mais', icon: 'more' },
];

export default function TabsLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
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
            title: tab.title,
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
  label: { fontWeight: '700' },
});
