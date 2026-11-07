import type { BottomTabBarProps } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { fonts, MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon } from '@shared/ui/AppIcon';
import { AppText } from '@shared/ui/primitives';
import { iconOfTab, OFFERS_TAB } from './tabs';
import { badgeText } from './unseenOffers';
import { useUnseenOffers } from './useUnseenOffers';

const INDICATOR = { width: 64, height: 32 };
const BADGE_SIZE = 18;
const LABEL_SIZE = 12;

export function AppTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const viewingOffers = state.routes[state.index]?.name === OFFERS_TAB;
  const unseen = useUnseenOffers(viewingOffers);

  const pressTab = (key: string, focused: boolean) => {
    const event = emitter.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigateToTab(key);
  };

  return (
    <View>
      <View
        accessibilityRole="tablist"
        style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + spacing.xs }]}
      >
        {state.routes.map((route, index) => {
          const options = descriptors[route.key]?.options;
          const focused = state.index === index;
          const label = options?.title ?? route.name;
          const icon = iconOfTab(route.name);
          const badge = route.name === OFFERS_TAB && unseen > 0 ? badgeText(unseen) : null;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${label}, ${t('tabs.unseenOffers', { count: unseen })}` : label}
              onPress={() => pressTab(route.key, focused)}
              style={styles.item}
            >
              <View style={[styles.indicator, focused ? { backgroundColor: colors.primary } : null]}>
                <AppIcon name={icon} color={focused ? colors.onPrimary : colors.textMuted} size={22} />
                {badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.negative }]}>
                    <AppText style={[styles.badgeText, { color: colors.surface }]}>{badge}</AppText>
                  </View>
                ) : null}
              </View>
              <AppText style={[styles.label, { color: focused ? colors.text : colors.textMuted }]} numberOfLines={1}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  item: { flex: 1, alignItems: 'center', gap: spacing.xs, minHeight: MIN_TOUCH_TARGET },
  indicator: { width: INDICATOR.width, height: INDICATOR.height, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: spacing.sm,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: LABEL_SIZE - 1, lineHeight: BADGE_SIZE - 2 },
  label: { fontFamily: fonts.semibold, fontSize: LABEL_SIZE },
});
