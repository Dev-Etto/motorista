import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OfferRow } from '@features/offers';
import { CardLayout, CardSize, OfferHistoryEntry, PrimaryMetric } from '@modules/copilot';
import { PLATFORM_PACKAGES } from '@modules/copilot/platforms';
import { useFormat } from '@shared/i18n/format';
import { AppText, Button, ButtonRow, Card, Collapsible, Notice, Segmented, ToggleRow } from '@shared/ui/primitives';
import { CopilotDiagnosticsState } from './useCopilotDiagnostics';
import { CopilotPreferencesState } from './useCopilotPreferences';
import { CopilotStatusState } from './useCopilotStatus';
import { CopilotTestsState } from './useCopilotTests';

const LAYOUTS: CardLayout[] = ['complete', 'summary'];
const SIZES: CardSize[] = ['compact', 'large', 'extra'];
const DURATIONS = [8, 12, 15];
const APPS = [
  { packageName: PLATFORM_PACKAGES.uber, label: 'Uber' },
  { packageName: PLATFORM_PACKAGES.ninetyNine, label: '99' },
  { packageName: PLATFORM_PACKAGES.inDrive, label: 'inDrive' },
];

export function CopilotStatusCard({ copilot, preferences }: { copilot: CopilotStatusState; preferences: CopilotPreferencesState }) {
  const { t } = useTranslation('copilot');
  const format = useFormat();
  const status = copilot.current;

  return (
    <Card title={t('status.title')}>
      <ToggleRow label={t('status.readOffers')} hint={t('status.readOffersHint')} value={status.enabled} onChange={copilot.setEnabled} />
      <ToggleRow
        label={t('status.imageReading')}
        hint={t('status.imageReadingHint')}
        value={preferences.current.imageReading}
        onChange={(imageReading) => preferences.update({ imageReading })}
      />
      <Notice tone="accent" message={t('status.platformRules')} />
      <AppText bold tone={status.accessibilityGranted ? 'positive' : 'warning'}>
        {status.accessibilityGranted ? t('status.accessibilityOn') : t('status.accessibilityOff')}
      </AppText>
      {status.accessibilityGranted ? null : <Button label={t('status.enableAccessibility')} onPress={copilot.openAccessibility} />}
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

interface ChannelsCardProps {
  copilot: CopilotStatusState;
  preferences: CopilotPreferencesState;
  tests: CopilotTestsState;
  message: string | null;
}

export function CopilotChannelsCard({ copilot, preferences: settings, tests, message }: ChannelsCardProps) {
  const { t } = useTranslation('copilot');
  const status = copilot.current;
  const preferences = settings.current;

  return (
    <Card title={t('channels.title')}>
      <ToggleRow label={t('channels.voice')} hint={t('channels.voiceHint')} value={preferences.voice} onChange={(voice) => settings.update({ voice })} />
      {preferences.voice && status.accessibilityGranted && !status.voiceAvailable ? (
        <>
          <Notice tone="accent" message={t('channels.installVoice')} />
          <Button label={t('channels.openVoiceSettings')} variant="secondary" onPress={copilot.openVoiceSettings} />
        </>
      ) : null}
      <ToggleRow label={t('channels.card')} hint={t('channels.cardHint')} value={preferences.card} onChange={(card) => settings.update({ card })} />
      <ToggleRow label={t('channels.floating')} hint={t('channels.floatingHint')} value={status.floatingRunning} onChange={settings.setFloating} />
      <ToggleRow
        label={t('channels.notification')}
        hint={t('channels.notificationHint')}
        value={preferences.notification}
        onChange={settings.setNotification}
      />
      <Button label={t('channels.notificationExample')} variant="secondary" onPress={tests.testNotification} />
      <ButtonRow>
        <Button label={t('channels.testCard')} onPress={tests.test} />
        <Button label={t('channels.testOutside')} variant="secondary" onPress={tests.testOutside} />
      </ButtonRow>
      {message ? <Notice tone="accent" message={message} /> : null}
    </Card>
  );
}

export function CopilotDisplayCard({ preferences: settings }: { preferences: CopilotPreferencesState }) {
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
    <Collapsible title={t('display.title')}>
      <AppText variant="caption" tone="muted">
        {t('display.intro')}
      </AppText>
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
      <Button label={t('display.resetPosition')} variant="secondary" onPress={settings.resetCardPosition} />
    </Collapsible>
  );
}

export function CopilotAppsCard({ preferences }: { preferences: CopilotPreferencesState }) {
  const { t } = useTranslation('copilot');
  const router = useRouter();
  const monitored = APPS.filter((app) => preferences.current.monitoredPackages.includes(app.packageName)).map((app) => app.label);

  return (
    <Collapsible title={t('apps.title')}>
      <AppText>{monitored.length > 0 ? monitored.join(', ') : t('apps.none')}</AppText>
      <AppText variant="caption" tone="muted">
        {t('apps.hint')}
      </AppText>
      <Button label={t('apps.manage')} variant="secondary" onPress={() => router.push('/platforms')} />
    </Collapsible>
  );
}

export function CopilotHistoryCard({ history }: { history: OfferHistoryEntry[] }) {
  const { t } = useTranslation('copilot');
  const router = useRouter();
  if (history.length === 0) return null;

  return (
    <Collapsible title={t('history.title')}>
      {history.map((entry) => (
        <OfferRow key={entry.timestamp} entry={entry} />
      ))}
      <Button label={t('history.seeAll')} variant="secondary" onPress={() => router.push('/offers')} />
    </Collapsible>
  );
}

export function CopilotCalibrationCard({ diagnostics }: { diagnostics: CopilotDiagnosticsState }) {
  const { t } = useTranslation('copilot');
  const router = useRouter();

  return (
    <Collapsible title={t('calibration.title')}>
      <ToggleRow label={t('calibration.showReading')} hint={t('calibration.showReadingHint')} value={diagnostics.enabled} onChange={diagnostics.toggle} />
      {diagnostics.lines.map((line, index) => (
        <AppText key={index} variant="caption" tone="muted" selectable>
          {line}
        </AppText>
      ))}
      {diagnostics.lines.length > 0 ? <Button label={t('calibration.sendReadings')} variant="secondary" onPress={() => router.push('/report')} /> : null}
    </Collapsible>
  );
}
