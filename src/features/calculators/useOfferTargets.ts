import { useEffect, useMemo } from 'react';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { loadOfferTargets, syncCopilotTargets } from '@/features/copilot/syncTargets';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { centsToInput } from '@/shared/utils/money';
import { centsOrZero } from '@/shared/utils/parse';

export function useOfferTargets() {
  const form = useFormFields({ perKm: '', perHour: '' });
  const { setValues } = form;

  useEffect(() => {
    void loadOfferTargets().then((targets) =>
      setValues({ perKm: centsToInput(targets.targetPerKmCents), perHour: centsToInput(targets.targetPerHourCents) }),
    );
  }, [setValues]);

  const values = useMemo(
    () => ({ targetPerKmCents: centsOrZero(form.values.perKm), targetPerHourCents: centsOrZero(form.values.perHour) }),
    [form.values],
  );

  useEffect(() => {
    if (!form.values.perKm && !form.values.perHour) return;
    void settingsRepository.setJson(SETTING_KEYS.offerTargets, values).then(syncCopilotTargets);
  }, [values, form.values.perKm, form.values.perHour]);

  return { values, bind: form.bind };
}
