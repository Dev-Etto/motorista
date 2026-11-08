import { planVehicleName } from '@application/goalProgress';
import { syncCopilotTargets } from '@application/offerSettings';
import { releaseShiftVehicle, shiftVehicle, vehicleInUse } from '@application/vehicleInUse';
import { archiveVehicle, fuelPriceSuggestion, nextCurrentIfArchived, shiftVehicleOtherThan, updateFuelPrice, VehicleInShiftError } from '@application/vehicles';
import { settingsRepository } from '@data/repositories/settingsRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { copilot } from '@modules/copilot';

const mockSettings = new Map<string, string>();
const CAR = { id: 1, name: 'Carro', kind: 'car', fuel: 'gasoline' };
const MOTO = { id: 2, name: 'Moto', kind: 'motorcycle', fuel: 'gasoline' };

jest.mock('@modules/copilot', () => ({ copilot: { getTimer: jest.fn(), setTargets: jest.fn() } }));
jest.mock('@application/goalProgress', () => ({
  loadGoalProgress: jest.fn().mockResolvedValue(null),
  planVehicleName: jest.requireActual('@application/goalProgress').planVehicleName,
}));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { shiftVehicle: 'shift_vehicle' },
  settingsRepository: {
    get: jest.fn(async (key: string) => mockSettings.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => void mockSettings.set(key, value)),
    remove: jest.fn(async (key: string) => void mockSettings.delete(key)),
    getEnum: jest.fn(async (_key: string, _values: unknown, fallback: unknown) => fallback),
    getJson: jest.fn(async (_key: string, _schema: unknown, fallback: unknown) => fallback),
  },
}));
jest.mock('@data/repositories/vehicleRepository', () => ({
  vehicleRepository: {
    getCurrent: jest.fn(),
    find: jest.fn(),
    archive: jest.fn(),
    setCurrent: jest.fn(),
    list: jest.fn(),
    getCostProfile: jest.fn(),
    saveCostProfile: jest.fn(),
    getCostsAt: jest.fn(async (_date: string, id?: number) => ({
      vehicle: id === 2 ? MOTO : CAR,
      profile: { fuelPriceCents: 600 },
      costs: { fullPerKm: id === 2 ? 40 : 100 },
    })),
  },
}));

const timer = jest.mocked(copilot.getTimer);
const vehicles = jest.mocked(vehicleRepository);
const startedTimer = (started: boolean) => timer.mockReturnValue({ started, running: started, elapsedMs: 0, startedAt: 0 });

describe('veículo da jornada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings.clear();
    vehicles.getCurrent.mockResolvedValue(CAR as never);
    vehicles.find.mockImplementation(async (id: number) => ([CAR, MOTO].find((vehicle) => vehicle.id === id) ?? null) as never);
  });

  it('com jornada iniciada, fixa o veículo atual na primeira consulta', async () => {
    startedTimer(true);

    expect(await shiftVehicle()).toEqual(CAR);
    expect(settingsRepository.set).toHaveBeenCalledWith('shift_vehicle', '1');
  });

  it('a jornada continua com o veículo dela depois da troca do atual', async () => {
    startedTimer(true);
    await shiftVehicle();
    vehicles.getCurrent.mockResolvedValue(MOTO as never);

    expect(await vehicleInUse()).toEqual(CAR);
    expect(await shiftVehicleOtherThan(2)).toEqual(CAR);
    expect(await shiftVehicleOtherThan(1)).toBeNull();
  });

  it('sem jornada iniciada, apaga o veículo da jornada e usa o atual', async () => {
    mockSettings.set('shift_vehicle', '1');
    startedTimer(false);
    vehicles.getCurrent.mockResolvedValue(MOTO as never);

    expect(await vehicleInUse()).toEqual(MOTO);
    expect(mockSettings.has('shift_vehicle')).toBe(false);
  });

  it('o Copiloto usa o custo do veículo em uso', async () => {
    startedTimer(true);
    await shiftVehicle();
    vehicles.getCurrent.mockResolvedValue(MOTO as never);

    await syncCopilotTargets();
    expect(copilot.setTargets).toHaveBeenLastCalledWith(100, expect.any(Number), expect.any(Number));

    await releaseShiftVehicle();
    startedTimer(false);
    await syncCopilotTargets();
    expect(copilot.setTargets).toHaveBeenLastCalledWith(40, expect.any(Number), expect.any(Number));
  });

  it('não arquiva o veículo de uma jornada iniciada', async () => {
    startedTimer(true);

    await expect(archiveVehicle(1)).rejects.toBeInstanceOf(VehicleInShiftError);
    expect(vehicles.archive).not.toHaveBeenCalled();
  });

  it('arquivar o atual diz quem passa a ser o atual', async () => {
    vehicles.list.mockResolvedValue([CAR, MOTO] as never);

    expect(await nextCurrentIfArchived(1)).toEqual(MOTO);
    expect(await nextCurrentIfArchived(2)).toBeNull();
  });

  it('abastecimento com preço diferente sugere atualizar só combustível líquido', async () => {
    expect(await fuelPriceSuggestion(1, 19500, 30)).toEqual({ vehicle: CAR, priceCents: 650 });
    expect(await fuelPriceSuggestion(1, 18000, 30)).toBeNull();
    expect(await fuelPriceSuggestion(1, 2000000, 30)).toBeNull();
    expect(await fuelPriceSuggestion(1, 19500, null)).toBeNull();
    expect(await fuelPriceSuggestion(null, 19500, 30)).toBeNull();
  });

  it('atualizar o preço grava um perfil novo a partir de hoje', async () => {
    startedTimer(false);
    vehicles.getCostProfile.mockResolvedValue({ fuelPriceCents: 600, consumptionKmPerUnit: 11 } as never);

    await updateFuelPrice(1, 650);

    expect(vehicles.saveCostProfile).toHaveBeenCalledWith(1, expect.any(String), expect.objectContaining({ fuelPriceCents: 650, consumptionKmPerUnit: 11 }));
  });

  it('a meta avisa qual veículo usa só quando há mais de um', async () => {
    vehicles.list.mockResolvedValue([CAR, MOTO] as never);
    expect(await planVehicleName()).toBe('Carro');

    vehicles.list.mockResolvedValue([CAR] as never);
    expect(await planVehicleName()).toBeNull();
  });
});
