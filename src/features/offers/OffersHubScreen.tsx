import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OfferTargetsSummary, useCopilotStatus, useOfferTargets } from '@features/copilot';
import { AppText, Button, Card, ListRow, Screen, ToggleRow } from '@shared/ui/primitives';
import { OfferRow } from './OfferRow';

export default function OffersHubScreen() {
  const { t } = useTranslation('offers');
  const router = useRouter();
  const status = useCopilotStatus();
  const targets = useOfferTargets();
  const { accessibilityGranted, enabled } = status.current;

  return (
    <Screen>
      <Card title={t('hub.copilotTitle')}>
        {accessibilityGranted ? (
          <ToggleRow label={t('hub.readOffers')} hint={t('hub.readOffersHint')} value={enabled} onChange={status.setEnabled} />
        ) : (
          <>
            <AppText tone="muted">{t('hub.setupMessage')}</AppText>
            <Button label={t('hub.setupButton')} onPress={() => router.push('/copilot-setup')} />
          </>
        )}
        <ListRow icon="copilot" title={t('hub.settings')} subtitle={t('hub.settingsSubtitle')} chevron onPress={() => router.push('/copilot')} />
      </Card>
      <Card title={t('hub.recentTitle')}>
        {status.history.length === 0 ? <AppText tone="muted">{t('hub.empty')}</AppText> : null}
        {status.history.map((entry) => (
          <OfferRow key={entry.timestamp} entry={entry} />
        ))}
        <Button label={t('hub.seeAll')} variant="secondary" onPress={() => router.push('/offers')} />
      </Card>
      <OfferTargetsSummary targets={targets} />
      <Card title={t('hub.toolsTitle')}>
        <ListRow
          icon="calculator"
          title={t('hub.evaluate')}
          subtitle={t('hub.evaluateSubtitle')}
          chevron
          onPress={() => router.push({ pathname: '/calculator', params: { tab: 'offer' } })}
        />
        <ListRow
          icon="document"
          title={t('hub.quote')}
          subtitle={t('hub.quoteSubtitle')}
          chevron
          onPress={() => router.push({ pathname: '/calculator', params: { tab: 'quote' } })}
        />
      </Card>
    </Screen>
  );
}
