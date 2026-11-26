import { setClockTime, stopClock } from './clock';
import { currentHalf, halfBounds, isPlayingPhase } from './periods';
import { addGoal, removeGoal } from './score';
import { gameTime } from './selectors';
import type { MatchEvent, MatchState, RedoEntry } from './types';

/**
 * Whether an event can be reverted. Clock start/stop and half transitions are
 * not undoable: real time has passed, so those are fixed with the clock
 * adjustment instead. A clock adjustment can only be undone within its own half.
 */
export function isUndoable(event: MatchEvent, state: MatchState): boolean {
  switch (event.type) {
    case 'GOAL':
    case 'GOAL_REMOVED':
    case 'TIMEOUT':
    case 'SUSPENSION':
    case 'SUSPENSION_DELETED':
      return true;
    case 'CLOCK_ADJUST':
      return isPlayingPhase(state.phase) && event.half === currentHalf(state.phase);
    default:
      return false;
  }
}

/** Index of the most recent undoable event, or -1. Non-undoable events are skipped over. */
export function lastUndoableIndex(state: MatchState): number {
  for (let i = state.events.length - 1; i >= 0; i--) {
    if (isUndoable(state.events[i], state)) return i;
  }
  return -1;
}

export const canUndo = (state: MatchState): boolean =>
  state.phase !== 'ENDED' && lastUndoableIndex(state) !== -1;

/** Reverts the last undoable action and removes it from the event log. */
export function undoLast(state: MatchState, now: number): MatchState {
  if (state.phase === 'ENDED') return state;
  const index = lastUndoableIndex(state);
  if (index === -1) return state;

  const event = state.events[index];
  const events = state.events.filter((_, i) => i !== index);
  const entry: RedoEntry = { event };
  if (event.type === 'SUSPENSION') entry.suspension = state.suspensions.find((s) => s.id === event.suspensionId);
  const next: MatchState = { ...state, events, redo: [...(state.redo ?? []), entry] };

  switch (event.type) {
    case 'GOAL':
      next.teams = { ...state.teams, [event.team]: removeGoal(state.teams[event.team]) };
      break;
    case 'GOAL_REMOVED':
      next.teams = { ...state.teams, [event.team]: addGoal(state.teams[event.team]) };
      break;
    case 'TIMEOUT':
      // Gives the timeout back. The game clock stays stopped: the user restarts it.
      if (state.timeout?.id === event.id) next.timeout = null;
      break;
    case 'SUSPENSION':
      next.suspensions = state.suspensions.filter((s) => s.id !== event.suspensionId);
      break;
    case 'SUSPENSION_DELETED': {
      const { endedAtWall: _ignored, ...restored } = event.suspension;
      next.suspensions = [...state.suspensions, restored];
      break;
    }
    case 'CLOCK_ADJUST': {
      // Revert by the same delta, so time that ran since the adjustment is kept.
      const { start, end } = halfBounds(event.half, state.settings.halfLengthMs);
      const target = gameTime(state, now) - (event.toMs - event.fromMs);
      next.clock = setClockTime(state.clock, Math.min(end, Math.max(start, target)), now);
      break;
    }
  }
  return next;
}

/** The action Redo would re-apply, if any. */
export function nextRedo(state: MatchState): RedoEntry | undefined {
  const stack = state.redo ?? [];
  return stack[stack.length - 1];
}

/** Redo is available when there is an undone action that still makes sense now. */
export function canRedo(state: MatchState): boolean {
  const entry = nextRedo(state);
  if (!entry || state.phase === 'ENDED') return false;
  const e = entry.event;
  switch (e.type) {
    // A clock correction only makes sense in the half it was made in.
    case 'CLOCK_ADJUST':
      return isPlayingPhase(state.phase) && e.half === currentHalf(state.phase);
    case 'GOAL_REMOVED':
      return state.teams[e.team].score > 0;
    case 'TIMEOUT': {
      // Never take a team over a limit it has reached since.
      const limit = state.settings.timeoutsPerTeam;
      const used = state.events.filter((x) => x.type === 'TIMEOUT' && x.team === e.team).length;
      return limit === null || used < limit;
    }
    default:
      return true;
  }
}

/**
 * Re-applies the most recently undone action and puts its event back in the
 * log (same id, game time and half as originally recorded).
 */
export function redoLast(state: MatchState, now: number): MatchState {
  if (!canRedo(state)) return state;
  const stack = state.redo ?? [];
  const { event, suspension } = stack[stack.length - 1];
  const next: MatchState = { ...state, redo: stack.slice(0, -1), events: [...state.events, event] };

  switch (event.type) {
    case 'GOAL':
      next.teams = { ...state.teams, [event.team]: addGoal(state.teams[event.team]) };
      break;
    case 'GOAL_REMOVED':
      next.teams = { ...state.teams, [event.team]: removeGoal(state.teams[event.team]) };
      break;
    case 'TIMEOUT': {
      // Back on the count. If its time hasn't run out yet, stop the clock and reopen it.
      const durationMs = state.settings.timeoutLengthMs;
      if (!state.timeout && now - event.wallTime < durationMs) {
        const end = halfBounds(currentHalf(state.phase), state.settings.halfLengthMs).end;
        next.clock = stopClock(state.clock, now, end);
        next.timeout = { id: event.id, team: event.team, startedAt: event.wallTime, durationMs };
      }
      break;
    }
    case 'SUSPENSION':
      if (suspension && !state.suspensions.some((s) => s.id === suspension.id)) {
        next.suspensions = [...state.suspensions, suspension];
      }
      break;
    case 'SUSPENSION_DELETED':
      next.suspensions = state.suspensions.filter((s) => s.id !== event.suspension.id);
      break;
    case 'CLOCK_ADJUST': {
      const { start, end } = halfBounds(event.half, state.settings.halfLengthMs);
      const target = gameTime(state, now) + (event.toMs - event.fromMs);
      next.clock = setClockTime(state.clock, Math.min(end, Math.max(start, target)), now);
      break;
    }
  }
  return next;
}
