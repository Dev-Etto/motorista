import type { BottomTabBarProps } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { fonts, MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon } from '@shared/ui/AppIcon';
import { AppText } from '@shared/ui/primitives';
import { ShiftButton, SHIFT_BUTTON_SIZE } from './ShiftActionButton';
import { HOME_TAB, iconOfTab, OFFERS_TAB } from './tabs';
import { badgeText } from './unseenOffers';
import { useUnseenOffers } from './useUnseenOffers';

const BADGE_SIZE = 16;
const BADGE_TEXT_SIZE = 10;
const LABEL_SIZE = 14;
const ICON_SIZE = 22;
const BAR_GAP = 10;

export function AppTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const viewingOffers = state.routes[state.index]?.name === OFFERS_TAB;
  const unseen = useUnseenOffers(viewingOffers);

  const pressTab = (key: string, focused: boolean) => {
    const event = emitter.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigateToTab(key);
  };

  const openHome = () => {
    const home = state.routes.find((route) => route.name === HOME_TAB);
    if (home) pressTab(home.key, state.routes[state.index]?.key === home.key);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.md }]}>
      <View accessibilityRole="tablist" style={[styles.capsule, { backgroundColor: colors.surface, boxShadow: colors.floatingShadow }]}>
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
              style={[styles.tab, focused ? [styles.tabActive, { backgroundColor: colors.primary }] : null]}
            >
              <AppIcon name={icon} color={focused ? colors.onPrimary : colors.textMuted} size={ICON_SIZE} />
              {focused ? (
                <AppText numberOfLines={1} style={[styles.label, { color: colors.onPrimary }]}>
                  {label}
                </AppText>
              ) : null}
              {badge ? (
                <View style={[styles.badge, { backgroundColor: colors.negative }]}>
                  <AppText style={[styles.badgeText, { color: colors.surface }]}>{badge}</AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <ShiftButton onOpen={openHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: BAR_GAP, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  capsule: {
    flex: 1,
    height: SHIFT_BUTTON_SIZE,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  tab: {
    minWidth: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tabActive: { paddingHorizontal: spacing.md + 2 },
  label: { fontFamily: fonts.bold, fontSize: LABEL_SIZE },
  badge: {
    position: 'absolute',
    top: spacing.xs + 2,
    right: spacing.xs,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.pill,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: BADGE_TEXT_SIZE, lineHeight: BADGE_SIZE - 2 },
});
