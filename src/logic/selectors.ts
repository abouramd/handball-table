import { clockElapsed } from './clock';
import { currentHalf, halfBounds } from './periods';
import type { MatchEvent, MatchState, TeamId } from './types';

/** Game-clock time at which the current half ends (30:00 or 60:00 by default). */
export function halfEndMs(state: MatchState): number {
  return halfBounds(currentHalf(state.phase), state.settings.halfLengthMs).end;
}

/** Current game-clock time, never past the end of the current half. */
export function gameTime(state: MatchState, now: number): number {
  return clockElapsed(state.clock, now, halfEndMs(state));
}

/** Events shown in the summary (clock start/stop is noise there). */
export function summaryEvents(state: MatchState): MatchEvent[] {
  return state.events.filter((e) => e.type !== 'CLOCK_START' && e.type !== 'CLOCK_STOP');
}

export function eventsOfType<T extends MatchEvent['type']>(
  state: MatchState,
  type: T,
  team?: TeamId,
): Extract<MatchEvent, { type: T }>[] {
  return state.events.filter(
    (e): e is Extract<MatchEvent, { type: T }> =>
      e.type === type && (team === undefined || e.team === team),
  );
}
