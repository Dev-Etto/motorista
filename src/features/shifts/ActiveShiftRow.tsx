import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { Card, ListRow } from '@shared/ui/primitives';
import { formatClock } from '@shared/utils/dates';
import { ShiftSheet } from './ShiftSheet';
import { useLiveTracking } from './useLiveTracking';

const ignoreApply = () => undefined;

export function ActiveShiftRow() {
  const { t } = useTranslation('shifts');
  const format = useFormat();
  const live = useLiveTracking(ignoreApply);
  const [open, setOpen] = useState(false);

  if (!live.started) return null;

  const status = live.running ? t('status.running') : t('status.paused');
  const details = [formatClock(live.elapsedMs), live.km > 0 ? format.distance(live.km) : null].filter(Boolean).join(' · ');

  return (
    <Card>
      <ListRow
        icon="shifts"
        title={status}
        subtitle={details}
        chevron
        onPress={() => setOpen(true)}
        accessibilityLabel={t('list.activeShift', { status, details })}
      />
      <ShiftSheet live={live} visible={open} onClose={() => setOpen(false)} />
    </Card>
  );
}
