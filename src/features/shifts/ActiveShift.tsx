import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui/primitives';
import { reportError } from '@shared/utils/reportError';
import { useLiveTracking } from './useLiveTracking';

const ignoreApply = () => undefined;

export function StartShiftActions() {
  const router = useRouter();
  const { t } = useTranslation('shifts');
  const live = useLiveTracking(ignoreApply);
  if (live.started) return null;

  return (
    <>
      <Button label={t('active.start')} onPress={() => live.start().catch(reportError)} />
      <Button label={t('active.registerPast')} variant="secondary" onPress={() => router.push('/shift/new')} />
    </>
  );
}
