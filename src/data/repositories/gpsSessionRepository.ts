import { getDb, SqlExecutor } from '@data/database/connection';
import { parseJsonColumnOr } from '@data/database/jsonColumn';
import { GpsPoint, gpsPointSchema } from '@domain/gps/gps';

export interface GpsSession {
  meters: number;
  lastPoint: GpsPoint | null;
  running: boolean;
  cycle: number;
}

interface GpsSessionRow {
  meters: number;
  last_point: string | null;
  running: number;
  cycle: number;
}

const EMPTY_SESSION: GpsSession = { meters: 0, lastPoint: null, running: false, cycle: 0 };

export function createGpsSessionRepository(connection: () => SqlExecutor = getDb) {
  return {
    async get(): Promise<GpsSession> {
      const row = await connection().getFirstAsync<GpsSessionRow>('SELECT meters, last_point, running, cycle FROM gps_session WHERE id = 1');
      if (!row) return EMPTY_SESSION;

      return {
        meters: row.meters,
        lastPoint: parseJsonColumnOr(row.last_point, gpsPointSchema, null),
        running: row.running === 1,
        cycle: row.cycle,
      };
    },

    async start(): Promise<void> {
      await connection().runAsync('UPDATE gps_session SET last_point = NULL, running = 1 WHERE id = 1');
    },

    async stop(): Promise<void> {
      await connection().runAsync('UPDATE gps_session SET last_point = NULL, running = 0 WHERE id = 1');
    },

    async reset(): Promise<void> {
      await connection().runAsync('UPDATE gps_session SET meters = 0, last_point = NULL, running = 0, cycle = cycle + 1 WHERE id = 1');
    },

    async recordProgress(cycle: number, meters: number, lastPoint: GpsPoint | null): Promise<void> {
      await connection().runAsync(
        'UPDATE gps_session SET meters = ?, last_point = ? WHERE id = 1 AND cycle = ? AND running = 1',
        meters,
        lastPoint ? JSON.stringify(lastPoint) : null,
        cycle,
      );
    },
  };
}

export const gpsSessionRepository = createGpsSessionRepository();
