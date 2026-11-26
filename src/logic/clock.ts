import type { GameClock } from './types';

export const initialClock = (): GameClock => ({ accumulatedMs: 0, runningSince: null });

export const isRunning = (clock: GameClock): boolean => clock.runningSince !== null;

/**
 * Elapsed game time. Computed from timestamps on every call, so there is no
 * drift and it stays correct after the app was backgrounded. `maxMs` clamps
 * the value (the half end) in case a tick hasn't stopped the clock yet.
 */
export function clockElapsed(clock: GameClock, now: number, maxMs = Infinity): number {
  const running = clock.runningSince !== null ? Math.max(0, now - clock.runningSince) : 0;
  return Math.min(clock.accumulatedMs + running, maxMs);
}

export function startClock(clock: GameClock, now: number): GameClock {
  if (clock.runningSince !== null) return clock;
  return { accumulatedMs: clock.accumulatedMs, runningSince: now };
}

export function stopClock(clock: GameClock, now: number, maxMs = Infinity): GameClock {
  if (clock.runningSince === null) return clock;
  return { accumulatedMs: clockElapsed(clock, now, maxMs), runningSince: null };
}

/** Set the clock to an exact time, keeping its running/stopped state. */
export function setClockTime(clock: GameClock, ms: number, now: number): GameClock {
  return {
    accumulatedMs: Math.max(0, ms),
    runningSince: clock.runningSince !== null ? now : null,
  };
}
