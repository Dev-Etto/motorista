import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { syncCopilotTargets } from '@application/offerSettings';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { computeCosts, FuelType, Ownership, VehicleKind } from '@domain/vehicle/costs';
import { useFormFields } from '@shared/hooks/useFormFields';
import { useFormat } from '@shared/i18n/format';
import { today } from '@shared/utils/dates';
import { CostFields, defaultDepreciationEnabled, fieldsToProfile, ProfileProblem, validateProfile, profileToFields, suggestedProfile } from './vehicleForm';

const EXAMPLE_FUEL_PRICE_CENTS = 589;

export function useVehicleForm() {
  const { t } = useTranslation('vehicle');
  const format = useFormat();
  const [vehicleId, setVehicleId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(() => t('defaultName'));
  const [kind, setKindState] = useState<VehicleKind>('car');
  const [fuel, setFuel] = useState<FuelType>('gasoline');
  const [ownership, setOwnershipState] = useState<Ownership>('owned');
  const [depreciationEnabled, setDepreciationEnabled] = useState(true);
  const form = useFormFields<keyof CostFields>(profileToFields(suggestedProfile('car', 'owned'), 'gasoline', format));
  const { setValues } = form;

  useEffect(() => {
    void loadExisting();

    async function loadExisting() {
      const { vehicle, profile } = await vehicleRepository.getCostsAt(today());
      if (!vehicle) return;

      setVehicleId(vehicle.id);
      setName(vehicle.name);
      setKindState(vehicle.kind);
      setFuel(vehicle.fuel);
      if (!profile) return;

      setOwnershipState(profile.ownership);
      setDepreciationEnabled(profile.depreciationEnabled);
      setValues(profileToFields(profile, vehicle.fuel, format));
    }
  }, [setValues, format]);

  const setKind = (next: VehicleKind) => {
    setKindState(next);
    if (vehicleId) return;
    form.setValues(profileToFields(suggestedProfile(next, ownership), fuel, format));
  };

  const setOwnership = (next: Ownership) => {
    setOwnershipState(next);
    setDepreciationEnabled(defaultDepreciationEnabled(next));
  };

  const profile = useMemo(
    () => fieldsToProfile(form.values, { ownership, depreciationEnabled, fuel }, format),
    [form.values, ownership, depreciationEnabled, fuel, format],
  );
  const costs = useMemo(() => computeCosts(profile), [profile]);

  const describeProblem = (problem: ProfileProblem) => {
    if (problem === 'plannedDistance') return t('problem.plannedDistance', { context: format.distanceUnit });
    if (problem === 'fuelPriceTooHigh') return t('problem.fuelPriceTooHigh', { example: format.moneyInput(EXAMPLE_FUEL_PRICE_CENTS) });
    return t(`problem.${problem}`);
  };

  const save = async (): Promise<boolean> => {
    const problem = validateProfile(profile);
    setError(problem ? describeProblem(problem) : null);
    if (problem) return false;

    const id = await vehicleRepository.save({ id: vehicleId, name: name.trim() || t('defaultName'), kind, fuel });
    await vehicleRepository.saveCostProfile(id, today(), profile);
    await syncCopilotTargets();
    setVehicleId(id);
    return true;
  };

  return {
    name,
    setName,
    kind,
    setKind,
    fuel,
    setFuel,
    ownership,
    setOwnership,
    depreciationEnabled,
    setDepreciationEnabled,
    bind: form.bind,
    costs,
    error,
    save,
  };
}
