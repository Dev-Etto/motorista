import { shiftStatusNow } from '@features/shifts/shiftStatus';
import { copilot } from '@modules/copilot';

jest.mock('@modules/copilot', () => ({ copilot: { getTimer: jest.fn() } }));

describe('estado da jornada agora', () => {
  it.each([
    [{ started: false, running: false }, 'idle'],
    [{ started: true, running: true }, 'running'],
    [{ started: true, running: false }, 'paused'],
  ])('%o vira %s', (timer, status) => {
    jest.mocked(copilot.getTimer).mockReturnValue({ ...timer, elapsedMs: 0, startedAt: 0 });

    expect(shiftStatusNow()).toBe(status);
  });
});
