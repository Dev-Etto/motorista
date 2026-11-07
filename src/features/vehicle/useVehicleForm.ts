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

export type VehicleTarget = number | 'new' | 'current';

async function findTarget(target: VehicleTarget) {
  if (target === 'new') return null;
  if (target === 'current') return vehicleRepository.getCurrent();
  return vehicleRepository.find(target);
}

export function useVehicleForm(target: VehicleTarget = 'current') {
  const { t } = useTranslation('vehicle');
  const format = useFormat();
  const [vehicleId, setVehicleId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(() => t('defaultName'));
  const [kind, setKindState] = useState<VehicleKind>('car');
  const [fuel, setFuelState] = useState<FuelType>('gasoline');
  const [ownership, setOwnershipState] = useState<Ownership>('owned');
  const [depreciationEnabled, setDepreciationEnabled] = useState(true);
  const form = useFormFields<keyof CostFields>(profileToFields(suggestedProfile('car', 'owned'), 'gasoline', format));
  const { setValues } = form;

  useEffect(() => {
    void loadExisting();

    async function loadExisting() {
      const vehicle = await findTarget(target);
      if (!vehicle) return;

      const profile = await vehicleRepository.getCostProfile(vehicle.id, today());

      setVehicleId(vehicle.id);
      setName(vehicle.name);
      setKindState(vehicle.kind);
      setFuelState(vehicle.fuel);
      if (!profile) return;

      setOwnershipState(profile.ownership);
      setDepreciationEnabled(profile.depreciationEnabled);
      setValues(profileToFields(profile, vehicle.fuel, format));
    }
  }, [setValues, format, target]);

  const setKind = (next: VehicleKind) => {
    setKindState(next);
    if (vehicleId) return;
    form.setValues(profileToFields(suggestedProfile(next, ownership, fuel), fuel, format));
  };

  const setFuel = (next: FuelType) => {
    setFuelState(next);
    if (vehicleId) return;
    const suggestion = profileToFields(suggestedProfile(kind, ownership, next), next, format);
    form.setValues((current) => ({ ...current, fuelPrice: suggestion.fuelPrice, consumption: suggestion.consumption }));
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
    if (!vehicleId) await vehicleRepository.setCurrent(id);
    await syncCopilotTargets();
    setVehicleId(id);
    return true;
  };

  return {
    vehicleId,
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
