import { useEffect, useMemo, useState } from 'react';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { computeCosts, FuelType, Ownership, VehicleKind } from '@/domain/vehicle/costs';
import { syncCopilotTargets } from '@/features/copilot/syncTargets';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { today } from '@/shared/utils/dates';
import { CostFields, defaultDepreciationEnabled, fieldsToProfile, profileToFields, suggestedProfile } from './vehicleForm';

const DEFAULT_NAME = 'Meu veículo';

export function useVehicleForm() {
  const [vehicleId, setVehicleId] = useState<number | undefined>();
  const [name, setName] = useState(DEFAULT_NAME);
  const [kind, setKindState] = useState<VehicleKind>('car');
  const [fuel, setFuel] = useState<FuelType>('gasoline');
  const [ownership, setOwnershipState] = useState<Ownership>('owned');
  const [depreciationEnabled, setDepreciationEnabled] = useState(true);
  const form = useFormFields<CostFields>(profileToFields(suggestedProfile('car', 'owned')));
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
      setValues(profileToFields(profile));
    }
  }, [setValues]);

  const setKind = (next: VehicleKind) => {
    setKindState(next);
    if (vehicleId) return;
    form.setValues(profileToFields(suggestedProfile(next, ownership)));
  };

  const setOwnership = (next: Ownership) => {
    setOwnershipState(next);
    setDepreciationEnabled(defaultDepreciationEnabled(next));
  };

  const profile = useMemo(
    () => fieldsToProfile(form.values, ownership, depreciationEnabled),
    [form.values, ownership, depreciationEnabled],
  );
  const costs = useMemo(() => computeCosts(profile), [profile]);

  const save = async () => {
    const id = await vehicleRepository.save({ id: vehicleId, name: name.trim() || DEFAULT_NAME, kind, fuel });
    await vehicleRepository.saveCostProfile(id, today(), profile);
    await syncCopilotTargets();
    setVehicleId(id);
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
    save,
  };
}
