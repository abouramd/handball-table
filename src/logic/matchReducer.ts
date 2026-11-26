import { initialClock, isRunning, setClockTime, startClock, stopClock } from './clock';
import { TIMEOUT_WARNING_BEFORE_END_MS } from './defaults';
import { currentHalf, halfBounds, halfTimeRemaining, isPlayingPhase } from './periods';
import { addGoal, removeGoal } from './score';
import { gameTime, halfEndMs } from './selectors';
import { acknowledgeSuspension, updateSuspensions } from './suspensions';
import { canTakeTimeout, timeoutElapsed } from './timeouts';
import type {
  Alert,
  MatchAction,
  MatchEvent,
  MatchState,
  ReduceResult,
  Settings,
  TeamId,
  VibrationPattern,
} from './types';
import { redoLast, undoLast } from './undo';

export interface NewMatchParams {
  id: string;
  now: number;
  settings: Settings;
  teams: Record<TeamId, { name: string; color: string }>;
}

export function createMatch({ id, now, settings, teams }: NewMatchParams): MatchState {
  return {
    id,
    createdAt: now,
    settings,
    teams: {
      A: { ...teams.A, score: 0 },
      B: { ...teams.B, score: 0 },
    },
    phase: 'PRE_MATCH',
    clock: initialClock(),
    suspensions: [],
    timeout: null,
    halfTime: null,
    events: [],
    seq: 0,
    firedAlerts: [],
    redo: [],
  };
}

/** Distributive Omit so each event variant keeps its own fields. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type EventInput = DistributiveOmit<MatchEvent, 'id' | 'wallTime' | 'gameMs' | 'half'>;

/** Appends an event stamped with the current game time and half. Mutates the draft. */
function pushEvent(draft: MatchState, now: number, input: EventInput): MatchEvent {
  draft.seq += 1;
  const event = {
    ...input,
    id: `e${draft.seq}`,
    wallTime: now,
    gameMs: gameTime(draft, now),
    half: currentHalf(draft.phase),
  } as MatchEvent;
  draft.events = [...draft.events, event];
  return event;
}

/** Collects alerts, skipping any that already fired (keys are persisted in state). */
function alertCollector(draft: MatchState) {
  const alerts: Alert[] = [];
  const fire = (key: string, pattern: VibrationPattern, silent = false) => {
    if (draft.firedAlerts.includes(key)) return;
    draft.firedAlerts = [...draft.firedAlerts, key];
    if (!silent) alerts.push({ key, pattern });
  };
  return { alerts, fire };
}

/**
 * Brings time-driven state up to date for `now`: half end, suspension expiry,
 * timeout and half-time countdowns. Runs before and after every action, so it
 * is also correct when the app was backgrounded across one of these moments.
 */
export function advance(state: MatchState, now: number): ReduceResult {
  const draft: MatchState = { ...state };
  const { alerts, fire } = alertCollector(draft);

  // 1. Half end: stop at EXACTLY 30:00 / 60:00, however late we got here.
  if (isPlayingPhase(draft.phase) && isRunning(draft.clock)) {
    const end = halfEndMs(draft);
    if (gameTime(draft, now) >= end) {
      const half = currentHalf(draft.phase);
      draft.clock = stopClock(draft.clock, now, end);
      pushEvent(draft, now, { type: 'HALF_END' });
      fire(`half:${half}:end`, 'long');
      if (half === 1) {
        draft.phase = 'HALF_TIME';
        draft.halfTime = { startedAt: null, durationMs: draft.settings.halfTimeLengthMs };
      } else {
        pushEvent(draft, now, { type: 'MATCH_END' });
        draft.phase = 'ENDED';
      }
    }
  }

  // 2. Suspensions (measured on the game clock).
  const susp = updateSuspensions(draft.suspensions, gameTime(draft, now), now);
  draft.suspensions = susp.suspensions;
  for (const s of susp.justEnded) fire(`susp:${s.id}:end`, 'doubleShort');

  // 3. Team timeout (wall clock, counts up). It stays open past its length
  //    until the clock is restarted or the timeout is closed.
  if (draft.timeout) {
    const t = draft.timeout;
    const elapsed = timeoutElapsed(t, now);
    if (elapsed >= t.durationMs) {
      // If we resumed after the end, skip the stale warning and only signal the end.
      fire(`to:${t.id}:warn`, 'short', true);
      fire(`to:${t.id}:end`, 'long');
    } else if (t.durationMs > TIMEOUT_WARNING_BEFORE_END_MS && elapsed >= t.durationMs - TIMEOUT_WARNING_BEFORE_END_MS) {
      fire(`to:${t.id}:warn`, 'short');
    }
  }

  // 4. Half-time break countdown.
  if (draft.phase === 'HALF_TIME' && halfTimeRemaining(draft.halfTime, now) === 0) {
    fire('halftime:end', 'long');
  }

  // Keep the same object when nothing changed, so frequent ticks don't trigger saves or re-renders.
  const unchanged = (Object.keys(draft) as (keyof MatchState)[]).every((k) => draft[k] === state[k]);
  return { state: unchanged ? state : draft, alerts };
}

/** Applies a user action (time-driven updates are handled by `advance`). */
function apply(state: MatchState, action: MatchAction): MatchState {
  const { now } = action;
  if (state.phase === 'ENDED' && action.type !== 'TICK') return state;

  const draft: MatchState = { ...state };

  switch (action.type) {
    case 'TICK':
      return state;

    case 'START_CLOCK': {
      if (isRunning(draft.clock)) return state;
      if (draft.phase === 'PRE_MATCH') draft.phase = 'FIRST_HALF';
      if (draft.phase === 'HALF_TIME') {
        // Starting the 2nd half: continues from the half length (30:00 → 60:00).
        draft.phase = 'SECOND_HALF';
        draft.halfTime = null;
        draft.clock = { accumulatedMs: draft.settings.halfLengthMs, runningSince: null };
      }
      draft.timeout = null; // the restart whistle ends a timeout early
      draft.clock = startClock(draft.clock, now);
      pushEvent(draft, now, { type: 'CLOCK_START' });
      return draft;
    }

    case 'STOP_CLOCK': {
      if (!isRunning(draft.clock)) return state;
      draft.clock = stopClock(draft.clock, now, halfEndMs(draft));
      pushEvent(draft, now, { type: 'CLOCK_STOP' });
      return draft;
    }

    case 'SET_CLOCK':
    case 'ADJUST_CLOCK': {
      if (draft.phase === 'HALF_TIME') return state;
      const { start, end } = halfBounds(currentHalf(draft.phase), draft.settings.halfLengthMs);
      const fromMs = gameTime(draft, now);
      const wanted = action.type === 'SET_CLOCK' ? action.gameMs : fromMs + action.deltaMs;
      const toMs = Math.min(end, Math.max(start, Math.round(wanted)));
      if (toMs === fromMs) return state;
      pushEvent(draft, now, { type: 'CLOCK_ADJUST', fromMs, toMs });
      draft.clock = setClockTime(draft.clock, toMs, now);
      return draft;
    }

    case 'GOAL': {
      draft.teams = { ...draft.teams, [action.team]: addGoal(draft.teams[action.team]) };
      pushEvent(draft, now, { type: 'GOAL', team: action.team });
      return draft;
    }

    case 'REMOVE_GOAL': {
      if (draft.teams[action.team].score === 0) return state;
      draft.teams = { ...draft.teams, [action.team]: removeGoal(draft.teams[action.team]) };
      pushEvent(draft, now, { type: 'GOAL_REMOVED', team: action.team });
      return draft;
    }

    case 'TIMEOUT': {
      if (!canTakeTimeout(draft, action.team, gameTime(draft, now)).ok) return state;
      draft.clock = stopClock(draft.clock, now, halfEndMs(draft));
      const event = pushEvent(draft, now, { type: 'TIMEOUT', team: action.team });
      draft.timeout = {
        id: event.id,
        team: action.team,
        startedAt: now,
        durationMs: draft.settings.timeoutLengthMs,
      };
      return draft;
    }

    case 'END_TIMEOUT': {
      if (!draft.timeout) return state;
      draft.timeout = null;
      return draft;
    }

    case 'ADD_SUSPENSION': {
      const shirt =
        action.shirt !== undefined && Number.isInteger(action.shirt) && action.shirt >= 0 && action.shirt <= 999
          ? action.shirt
          : undefined;
      draft.seq += 1;
      const id = `s${draft.seq}`;
      draft.suspensions = [
        ...draft.suspensions,
        {
          id,
          team: action.team,
          shirt,
          startGameMs: gameTime(draft, now),
          durationMs: draft.settings.suspensionLengthMs,
        },
      ];
      pushEvent(draft, now, { type: 'SUSPENSION', team: action.team, shirt, suspensionId: id });
      return draft;
    }

    case 'DELETE_SUSPENSION': {
      const s = draft.suspensions.find((x) => x.id === action.id);
      if (!s) return state;
      draft.suspensions = draft.suspensions.filter((x) => x.id !== action.id);
      pushEvent(draft, now, { type: 'SUSPENSION_DELETED', team: s.team, shirt: s.shirt, suspension: s });
      return draft;
    }

    case 'ACK_SUSPENSION': {
      // Not logged: the SUSPENSION event already records it for the summary.
      const next = acknowledgeSuspension(draft.suspensions, action.id);
      if (next === draft.suspensions) return state;
      draft.suspensions = next;
      return draft;
    }

    case 'START_HALF_TIME_BREAK': {
      if (draft.phase !== 'HALF_TIME' || !draft.halfTime || draft.halfTime.startedAt !== null) return state;
      draft.halfTime = { ...draft.halfTime, startedAt: now };
      return draft;
    }

    case 'END_MATCH': {
      draft.clock = stopClock(draft.clock, now, halfEndMs(draft));
      pushEvent(draft, now, { type: 'MATCH_END' });
      draft.phase = 'ENDED';
      draft.timeout = null;
      draft.halfTime = null;
      return draft;
    }

    case 'UNDO':
      return undoLast(state, now);

    case 'REDO':
      return redoLast(state, now);
  }
}

/**
 * The single entry point used by the store: catch up on time, apply the action,
 * then catch up again (e.g. an adjustment may have expired a suspension).
 */
/** New actions that make the redo list stale (like typing after undo in an editor). */
const CLEARS_REDO = new Set<MatchAction['type']>([
  'GOAL',
  'REMOVE_GOAL',
  'TIMEOUT',
  'ADD_SUSPENSION',
  'DELETE_SUSPENSION',
  'SET_CLOCK',
  'ADJUST_CLOCK',
]);

export function reduce(state: MatchState, action: MatchAction): ReduceResult {
  const before = advance(state, action.now);
  let applied = apply(before.state, action);
  if (applied !== before.state && CLEARS_REDO.has(action.type) && (applied.redo?.length ?? 0) > 0) {
    applied = { ...applied, redo: [] };
  }
  const after = applied === before.state ? { state: applied, alerts: [] } : advance(applied, action.now);
  return { state: after.state, alerts: [...before.alerts, ...after.alerts] };
}
