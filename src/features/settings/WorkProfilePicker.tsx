import { useTranslation } from 'react-i18next';
import { WORK_PROFILES, type WorkProfile } from '@application/workProfile';
import type { AppIconName } from '@shared/ui/AppIcon';
import { Card, ListRow } from '@shared/ui/primitives';

const ICONS: Record<WorkProfile, AppIconName> = { rides: 'vehicle', deliveries: 'offers', both: 'swap' };

export function WorkProfilePicker({ value, onChange }: { value: WorkProfile; onChange: (profile: WorkProfile) => void }) {
  const { t } = useTranslation('settings');
  return (
    <Card>
      {WORK_PROFILES.map((profile) => (
        <ListRow
          key={profile}
          icon={ICONS[profile]}
          title={t(`workProfile.option.${profile}.title`)}
          subtitle={t(`workProfile.option.${profile}.subtitle`)}
          selected={profile === value}
          onPress={() => onChange(profile)}
        />
      ))}
    </Card>
  );
}
