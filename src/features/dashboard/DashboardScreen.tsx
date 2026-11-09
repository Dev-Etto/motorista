import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { NextStepCard } from '@features/onboarding';
import { PrivacyChoicesCard } from '@features/privacy';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon } from '@shared/ui/AppIcon';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { AppText, Button, Notice, Screen } from '@shared/ui/primitives';
import { today } from '@shared/utils/dates';
import { LastOfferCard } from './LastOfferCard';
import { PendingCard } from './PendingCard';
import { pendingItems } from './pendingItems';
import { TodayCard } from './TodayCard';
import { DashboardData, useDashboard } from './useDashboard';

export default function DashboardScreen() {
  const dashboard = useDashboard();

  return (
    <Screen>
      <AsyncBoundary state={dashboard}>{(data) => <DashboardContent data={data} onReload={dashboard.reload} />}</AsyncBoundary>
    </Screen>
  );
}

function CopilotStoppedBanner() {
  const router = useRouter();
  const colors = useTheme();
  const { t } = useTranslation('dashboard');

  return (
    <View accessible={false} style={[styles.banner, { backgroundColor: colors.surfaceAlt }]}>
      <AppIcon name="alert" color={colors.warning} size={20} />
      <AppText accessibilityRole="alert" style={styles.flex}>
        {t('copilotStopped.title')}
      </AppText>
      <Button label={t('copilotStopped.action')} onPress={() => router.push('/copilot')} />
    </View>
  );
}

function DashboardContent({ data, onReload }: { data: DashboardData; onReload: () => Promise<void> }) {
  const router = useRouter();
  const colors = useTheme();
  const { t } = useTranslation(['dashboard', 'vehicle']);
  const format = useFormat();
  const unit = { context: format.distanceUnit };

  return (
    <>
      <View style={styles.header}>
        <AppText tone="muted" style={styles.flex}>
          {format.longDay(today())}
        </AppText>
        {data.vehicle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('vehicle:manage.currentRow')}, ${data.vehicle.name}`}
            onPress={() => router.push('/vehicles')}
            style={[styles.vehicle, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
          >
            <AppIcon name={data.vehicle.kind === 'motorcycle' ? 'motorcycle' : 'vehicle'} color={colors.text} size={18} />
            <View style={styles.vehicleName}>
              <AppText variant="caption" tone="muted">
                {t('vehicleLabel')}
              </AppText>
              <AppText bold numberOfLines={1}>
                {data.vehicle.name}
              </AppText>
            </View>
            <AppIcon name="chevronDown" color={colors.textMuted} size={16} />
          </Pressable>
        ) : null}
      </View>
      <TodayCard summary={data.today} goal={data.todayGoal} />
      {data.copilotStopped ? <CopilotStoppedBanner /> : null}
      {data.gpsProblem ? <Notice tone="negative" message={t('gpsProblem', { ...unit, problem: data.gpsProblem })} /> : null}
      <NextStepCard step={data.nextStep} onDismiss={onReload} />
      <PrivacyChoicesCard />
      <PendingCard items={pendingItems(data)} />
      {data.lastOffer ? <LastOfferCard entry={data.lastOffer} now={data.loadedAt} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    maxWidth: '50%',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  vehicleName: { flexShrink: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
});
