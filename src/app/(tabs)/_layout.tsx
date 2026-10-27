import { Tabs } from 'expo-router';
import { useTheme } from '@/shared/theme/theme';
import { TabIcon, TabIconName } from '@/shared/ui/TabIcon';

const TABS: { name: string; title: string; icon: TabIconName }[] = [
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
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title, tabBarIcon: ({ color }) => <TabIcon name={tab.icon} color={color} /> }}
        />
      ))}
    </Tabs>
  );
}
