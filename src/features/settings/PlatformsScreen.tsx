import { useTranslation } from 'react-i18next';
import { hasCopilot, type PlatformEntry } from '@application/platforms';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { confirmAction } from '@shared/ui/dialog';
import { AppText, Card, Notice, Screen, ToggleRow } from '@shared/ui/primitives';
import { usePlatforms } from './usePlatforms';

const OWN_HINT_KEYS = { private: 'platforms.hint.private', other: 'platforms.hint.other' } as const;

export default function PlatformsScreen() {
  const { t } = useTranslation('settings');
  const { state: platforms, toggle } = usePlatforms();

  const change = (platform: PlatformEntry, active: boolean) => {
    if (active || !hasCopilot(platform.key)) {
      void toggle(platform.id, active);
      return;
    }

    confirmAction({
      title: t('platforms.turnOff.title', { name: platform.name }),
      message: t('platforms.turnOff.message', { name: platform.name }),
      actionLabel: t('platforms.turnOff.action'),
      onConfirm: () => toggle(platform.id, false),
    });
  };

  const hintOf = (platform: PlatformEntry) => {
    if (hasCopilot(platform.key)) return t('platforms.hint.copilot');
    if (platform.key === 'private' || platform.key === 'other') return t(OWN_HINT_KEYS[platform.key]);
    return t('platforms.hint.legacy');
  };

  return (
    <Screen>
      <AppText tone="muted">{t('platforms.intro')}</AppText>
      <AsyncBoundary state={platforms}>
        {(list) => {
          const activeCount = list.filter((platform) => platform.active).length;
          const rowOf = (platform: PlatformEntry) => (
            <ToggleRow
              key={platform.id}
              label={platform.name}
              hint={hintOf(platform)}
              value={platform.active}
              onChange={(active) => (active || activeCount > 1 ? change(platform, active) : undefined)}
            />
          );
          const apps = list.filter((platform) => hasCopilot(platform.key));
          const own = list.filter((platform) => platform.key === 'private' || platform.key === 'other');
          const legacy = list.filter((platform) => platform.key === null);

          return (
            <>
              {activeCount === 1 ? <Notice tone="accent" message={t('platforms.keepOne')} /> : null}
              <Card title={t('platforms.appsTitle')}>{apps.map(rowOf)}</Card>
              <Card title={t('platforms.ownTitle')}>{own.map(rowOf)}</Card>
              {legacy.length > 0 ? <Card title={t('platforms.legacyTitle')}>{legacy.map(rowOf)}</Card> : null}
            </>
          );
        }}
      </AsyncBoundary>
    </Screen>
  );
}
