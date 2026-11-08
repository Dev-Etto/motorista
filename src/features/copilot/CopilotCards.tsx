import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CardLayout, CardSize, PrimaryMetric } from '@modules/copilot';
import { RIDE_APPS } from '@modules/copilot/platforms';
import { useFormat } from '@shared/i18n/format';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Button, Card, ListRow, Notice, Section, Segmented, ToggleRow } from '@shared/ui/primitives';
import { CopilotDiagnosticsState } from './useCopilotDiagnostics';
import { CopilotPreferencesState } from './useCopilotPreferences';
import { CopilotStatusState } from './useCopilotStatus';
import { CopilotTestsState } from './useCopilotTests';

const LAYOUTS: CardLayout[] = ['complete', 'summary'];
const SIZES: CardSize[] = ['compact', 'large', 'extra'];
const DURATIONS = [8, 12, 15];

export function CopilotStatusCard({ copilot, preferences }: { copilot: CopilotStatusState; preferences: CopilotPreferencesState }) {
  const { t } = useTranslation('copilot');
  const router = useRouter();
  const format = useFormat();
  const status = copilot.current;

  return (
    <Card>
      <ToggleRow
        label={t('status.readOffers')}
        hint={status.accessibilityGranted ? t('status.accessibilityOn') : t('status.accessibilityOff')}
        hintTone={status.accessibilityGranted ? 'positive' : 'warning'}
        value={status.enabled}
        onChange={copilot.setEnabled}
      />
      {status.accessibilityGranted ? null : <Button label={t('status.enableAccessibility')} onPress={() => router.push('/copilot-setup')} />}
      <ToggleRow
        label={t('status.imageReading')}
        hint={t('status.imageReadingHint')}
        value={preferences.current.imageReading}
        onChange={(imageReading) => preferences.update({ imageReading })}
      />
      {status.shortcutEnabled ? (
        <>
          <Notice tone="accent" message={t('status.shortcutNotice')} />
          <Button label={t('status.removeShortcut')} variant="secondary" onPress={copilot.openShortcutSettings} />
        </>
      ) : null}
      {status.enabled && status.batteryRestricted ? (
        <>
          <Notice tone="accent" message={t('status.batteryNotice', { context: format.distanceUnit })} />
          <Button label={t('status.openBattery')} variant="secondary" onPress={copilot.openBatterySettings} />
        </>
      ) : null}
      {status.failedReads > 0 ? <Notice message={t('status.failedReads', { count: status.failedReads })} /> : null}
    </Card>
  );
}

export function CopilotChannelsCard({ copilot, preferences: settings }: { copilot: CopilotStatusState; preferences: CopilotPreferencesState }) {
  const { t } = useTranslation('copilot');
  const status = copilot.current;
  const preferences = settings.current;

  return (
    <Section title={t('channels.title')}>
      <ToggleRow label={t('channels.voice')} value={preferences.voice} onChange={(voice) => settings.update({ voice })} />
      {preferences.voice && status.accessibilityGranted && !status.voiceAvailable ? (
        <>
          <Notice tone="accent" message={t('channels.installVoice')} />
          <Button label={t('channels.openVoiceSettings')} variant="secondary" onPress={copilot.openVoiceSettings} />
        </>
      ) : null}
      <ToggleRow label={t('channels.card')} value={preferences.card} onChange={(card) => settings.update({ card })} />
      <ToggleRow label={t('channels.notification')} value={preferences.notification} onChange={settings.setNotification} />
      <ToggleRow label={t('channels.floating')} value={status.floatingRunning} onChange={settings.setFloating} />
    </Section>
  );
}

function useCardSummary(preferences: CopilotPreferencesState) {
  const { t } = useTranslation('copilot');
  const current = preferences.current;
  return t('display.summary', {
    layout: t(`display.layout.${current.cardLayout}`),
    size: t(`display.size.${current.cardSize}`).toLocaleLowerCase(),
    seconds: current.durationSeconds,
  });
}

export function CopilotCardSection({
  preferences,
  tests,
  message,
}: {
  preferences: CopilotPreferencesState;
  tests: CopilotTestsState;
  message: string | null;
}) {
  const { t } = useTranslation('copilot');
  const router = useRouter();
  const summary = useCardSummary(preferences);

  return (
    <Section title={t('display.section')}>
      <ListRow title={t('display.title')} value={summary} valueTone="muted" chevron onPress={() => router.push('/copilot-card')} />
      <ListRow title={t('channels.testCard')} icon="play" onPress={tests.test} />
      {message ? <Notice tone="accent" message={message} /> : null}
    </Section>
  );
}

export function CopilotMoreCard({ preferences }: { preferences: CopilotPreferencesState }) {
  const { t } = useTranslation('copilot');
  const router = useRouter();
  const monitored = RIDE_APPS.filter((app) => preferences.current.monitoredPackages.includes(app.packageName)).map((app) => app.label);

  return (
    <Card>
      <ListRow
        title={t('apps.title')}
        value={monitored.length > 0 ? monitored.join(', ') : t('apps.none')}
        valueTone="muted"
        chevron
        onPress={() => router.push('/platforms')}
      />
      <ListRow title={t('calibration.entry')} chevron onPress={() => router.push('/copilot-reading')} />
    </Card>
  );
}

export function CopilotRulesNotice() {
  const { t } = useTranslation('copilot');
  return (
    <LearnMore title={t('screen.rulesTitle')}>
      <AppText variant="caption">{t('screen.inControl')}</AppText>
      <AppText variant="caption">{t('status.platformRules')}</AppText>
    </LearnMore>
  );
}

export function CopilotDisplayOptions({ preferences: settings, tests }: { preferences: CopilotPreferencesState; tests: CopilotTestsState }) {
  const { t } = useTranslation('copilot');
  const preferences = settings.current;
  const format = useFormat();
  const metrics: { value: PrimaryMetric; label: string }[] = [
    { value: 'perKm', label: format.perDistanceLabel },
    { value: 'profit', label: t('display.profit') },
  ];
  const layouts = LAYOUTS.map((value) => ({ value, label: t(`display.layout.${value}`) }));
  const sizes = SIZES.map((value) => ({ value, label: t(`display.size.${value}`) }));
  const durations = DURATIONS.map((seconds) => ({ value: String(seconds), label: t('display.durationOption', { seconds }) }));

  return (
    <>
      <AppText tone="muted">{t('display.intro')}</AppText>
      <Card>
        <AppText variant="caption" tone="muted">
          {t('display.layoutLabel')}
        </AppText>
        <Segmented value={preferences.cardLayout} options={layouts} onChange={(cardLayout) => settings.update({ cardLayout })} />
        <AppText variant="caption" tone="muted">
          {t('display.primaryMetricLabel')}
        </AppText>
        <Segmented value={preferences.primaryMetric} options={metrics} onChange={(primaryMetric) => settings.update({ primaryMetric })} />
        <AppText variant="caption" tone="muted">
          {t('display.sizeLabel')}
        </AppText>
        <Segmented value={preferences.cardSize} options={sizes} onChange={(cardSize) => settings.update({ cardSize })} />
        <AppText variant="caption" tone="muted">
          {t('display.durationLabel')}
        </AppText>
        <Segmented
          value={String(preferences.durationSeconds)}
          options={durations}
          onChange={(duration) => settings.update({ durationSeconds: Number(duration) })}
        />
      </Card>
      <Button label={t('channels.testCard')} onPress={tests.test} />
      <Button label={t('channels.testOutside')} variant="secondary" onPress={tests.testOutside} />
      <Button label={t('channels.notificationExample')} variant="secondary" onPress={tests.testNotification} />
      <Button label={t('display.resetPosition')} variant="secondary" onPress={settings.resetCardPosition} />
    </>
  );
}

export function CopilotCalibrationCard({ diagnostics }: { diagnostics: CopilotDiagnosticsState }) {
  const { t } = useTranslation('copilot');
  const router = useRouter();

  return (
    <Card>
      <ToggleRow label={t('calibration.showReading')} hint={t('calibration.showReadingHint')} value={diagnostics.enabled} onChange={diagnostics.toggle} />
      {diagnostics.lines.map((line, index) => (
        <AppText key={index} variant="caption" tone="muted" selectable>
          {line}
        </AppText>
      ))}
      {diagnostics.lines.length > 0 ? <Button label={t('calibration.sendReadings')} variant="secondary" onPress={() => router.push('/report')} /> : null}
    </Card>
  );
}
