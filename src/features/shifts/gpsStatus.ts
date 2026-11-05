import * as Location from 'expo-location';

const PERMISSION_MESSAGE = 'Permita a localização para medir os km por GPS.';
const SERVICES_MESSAGE = 'Ligue a localização do celular para medir os km por GPS.';

export async function readGpsProblem(): Promise<string | null> {
  const [{ granted }, servicesEnabled] = await Promise.all([Location.getForegroundPermissionsAsync(), Location.hasServicesEnabledAsync()]);
  if (!granted) return PERMISSION_MESSAGE;
  return servicesEnabled ? null : SERVICES_MESSAGE;
}
