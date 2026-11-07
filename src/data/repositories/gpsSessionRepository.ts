import { getDb } from '@/data/database/connection';
import { parseJsonColumnOr } from '@/data/database/jsonColumn';
import { type GpsPoint, gpsPointSchema } from '@/domain/gps/gps';

export interface GpsSession {
  meters: number;
  lastPoint: GpsPoint | null;
  running: boolean;
}

interface GpsSessionRow {
  meters: number;
  last_point: string | null;
  running: number;
}

export const gpsSessionRepository = {
  async get(): Promise<GpsSession> {
    const row = await getDb().getFirstAsync<GpsSessionRow>('SELECT meters, last_point, running FROM gps_session WHERE id = 1');
    if (!row) return { meters: 0, lastPoint: null, running: false };

    return {
      meters: row.meters,
      lastPoint: parseJsonColumnOr(row.last_point, gpsPointSchema, null),
      running: row.running === 1,
    };
  },

  async save(session: GpsSession): Promise<void> {
    await getDb().runAsync(
      'UPDATE gps_session SET meters = ?, last_point = ?, running = ? WHERE id = 1',
      session.meters,
      session.lastPoint ? JSON.stringify(session.lastPoint) : null,
      session.running ? 1 : 0,
    );
  },
};
