import { LAST_MINUTES_WINDOW_MS } from './defaults';
import { halfBounds, isPlayingPhase } from './periods';
import type { ActiveTimeout, Half, MatchEvent, MatchState, Settings, TeamId } from './types';

export type TimeoutCheck =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'Only during play'
        | 'Timeout in progress'
        | 'No timeouts left'
        | 'Max 2 per half'
        | 'Max 1 in last 5 min';
    };

const teamTimeouts = (events: MatchEvent[], team: TeamId) =>
  events.filter((e) => e.type === 'TIMEOUT' && e.team === team);

export function timeoutsUsed(events: MatchEvent[], team: TeamId): number {
  return teamTimeouts(events, team).length;
}

/** Timeouts a team may still take, or null when the match has no limit. */
export function timeoutsLeft(state: MatchState, team: TeamId): number | null {
  const limit = state.settings.timeoutsPerTeam;
  return limit === null ? null : Math.max(0, limit - timeoutsUsed(state.events, team));
}

const inLastWindow = (gameMs: number, half: Half, settings: Settings) =>
  gameMs >= halfBounds(half, settings.halfLengthMs).end - LAST_MINUTES_WINDOW_MS;

/**
 * Whether `team` may take a timeout right now, with the reason if not.
 * `gameMs` is the current game-clock time.
 */
export function canTakeTimeout(state: MatchState, team: TeamId, gameMs: number): TimeoutCheck {
  if (!isPlayingPhase(state.phase)) return { ok: false, reason: 'Only during play' };
  if (state.timeout) return { ok: false, reason: 'Timeout in progress' };
  if (timeoutsLeft(state, team) === 0) return { ok: false, reason: 'No timeouts left' };

  const half: Half = state.phase === 'FIRST_HALF' ? 1 : 2;
  const thisHalf = teamTimeouts(state.events, team).filter((e) => e.half === half);

  if (state.settings.maxTwoTimeoutsPerHalf && thisHalf.length >= 2) {
    return { ok: false, reason: 'Max 2 per half' };
  }
  if (
    state.settings.maxOneInLast5Min &&
    inLastWindow(gameMs, half, state.settings) &&
    thisHalf.some((e) => inLastWindow(e.gameMs, half, state.settings))
  ) {
    return { ok: false, reason: 'Max 1 in last 5 min' };
  }
  return { ok: true };
}

/** Wall time since the timeout started (it stays open past its length until the clock restarts). */
export function timeoutElapsed(t: ActiveTimeout, now: number): number {
  return Math.max(0, now - t.startedAt);
}

/** Countdown shown on the timeout screen: 1:00 → 0:00, then holds at 0:00. */
export const timeoutRemaining = (t: ActiveTimeout, now: number): number => Math.max(0, t.durationMs - timeoutElapsed(t, now));

/** True once the full timeout length has passed (the end signal was due). */
export const isTimeoutOver = (t: ActiveTimeout, now: number): boolean => timeoutElapsed(t, now) >= t.durationMs;
