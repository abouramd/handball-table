/**
 * Domain types for a single handball match.
 *
 * Everything time-related is stored as timestamps (epoch ms) or accumulated
 * durations, never as tick counts, so state can be recomputed exactly after
 * the app was backgrounded, killed or restored from storage.
 */

export type TeamId = 'A' | 'B';
export const TEAM_IDS: readonly TeamId[] = ['A', 'B'];

export type Half = 1 | 2;

export interface Settings {
  halfLengthMs: number;
  /** Max team timeouts per match; null = no limit (count only). */
  timeoutsPerTeam: number | null;
  timeoutLengthMs: number;
  /** Optional rule: a team may take at most 2 timeouts in one half. */
  maxTwoTimeoutsPerHalf: boolean;
  /** Optional rule: a team may take at most 1 timeout in the last 5 minutes of a half. */
  maxOneInLast5Min: boolean;
  suspensionLengthMs: number;
  halfTimeLengthMs: number;
}

export interface Team {
  name: string;
  color: string;
  score: number;
}

/**
 * Timestamp-based game clock (counts up).
 * elapsed = accumulatedMs + (runningSince !== null ? now - runningSince : 0)
 */
export interface GameClock {
  accumulatedMs: number;
  runningSince: number | null;
}

export type Phase = 'PRE_MATCH' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'ENDED';

export interface Suspension {
  id: string;
  team: TeamId;
  shirt?: number;
  /**
   * Game-clock time when the suspension was given. Remaining time is derived
   * from the game clock, so it pauses whenever the game clock is stopped and
   * carries over into the 2nd half automatically.
   */
  startGameMs: number;
  durationMs: number;
  /** Wall time when it ran out. The chip keeps flashing until the official acknowledges it. */
  endedAtWall?: number;
}

export interface ActiveTimeout {
  /** Id of the TIMEOUT event that started it. */
  id: string;
  team: TeamId;
  /** Wall clock: the game clock is stopped during a timeout. */
  startedAt: number;
  durationMs: number;
}

export interface HalfTimeBreak {
  /** null = break countdown not started yet (waiting for the user). */
  startedAt: number | null;
  durationMs: number;
}

interface EventBase {
  id: string;
  wallTime: number;
  /** Game clock time at which the event happened. */
  gameMs: number;
  half: Half;
  team?: TeamId;
  shirt?: number;
}

export type MatchEvent = EventBase &
  (
    | { type: 'GOAL'; team: TeamId }
    | { type: 'GOAL_REMOVED'; team: TeamId }
    | { type: 'TIMEOUT'; team: TeamId }
    | { type: 'SUSPENSION'; team: TeamId; suspensionId: string }
    /** Keeps a full copy so undo can restore it. */
    | { type: 'SUSPENSION_DELETED'; team: TeamId; suspension: Suspension }
    | { type: 'CLOCK_START' }
    | { type: 'CLOCK_STOP' }
    | { type: 'CLOCK_ADJUST'; fromMs: number; toMs: number }
    | { type: 'HALF_END' }
    | { type: 'MATCH_END' }
  );

export type MatchEventType = MatchEvent['type'];

/** One undone action, with what is needed to re-apply it. */
export interface RedoEntry {
  event: MatchEvent;
  /** For an undone SUSPENSION: the suspension as it was, to restore it exactly. */
  suspension?: Suspension;
}

export interface MatchState {
  id: string;
  createdAt: number;
  settings: Settings;
  teams: Record<TeamId, Team>;
  phase: Phase;
  clock: GameClock;
  suspensions: Suspension[];
  timeout: ActiveTimeout | null;
  halfTime: HalfTimeBreak | null;
  events: MatchEvent[];
  /**
   * Actions reverted by Undo, most recent last, so Redo can re-apply them.
   * Cleared by any new scoring/timeout/suspension/correction action.
   * Optional so matches saved by older versions still load.
   */
  redo?: RedoEntry[];
  /** Monotonic counter used to generate ids, keeping the reducer pure. */
  seq: number;
  /** Keys of alerts already fired, so a vibration never repeats (even after a restart). */
  firedAlerts: string[];
}

export type VibrationPattern = 'short' | 'long' | 'doubleShort';

export interface Alert {
  key: string;
  pattern: VibrationPattern;
}

export type MatchAction =
  | { type: 'TICK'; now: number }
  | { type: 'START_CLOCK'; now: number }
  | { type: 'STOP_CLOCK'; now: number }
  | { type: 'SET_CLOCK'; gameMs: number; now: number }
  | { type: 'ADJUST_CLOCK'; deltaMs: number; now: number }
  | { type: 'GOAL'; team: TeamId; now: number }
  | { type: 'REMOVE_GOAL'; team: TeamId; now: number }
  | { type: 'TIMEOUT'; team: TeamId; now: number }
  | { type: 'END_TIMEOUT'; now: number }
  | { type: 'ADD_SUSPENSION'; team: TeamId; shirt?: number; now: number }
  | { type: 'DELETE_SUSPENSION'; id: string; now: number }
  /** Official saw that an ended suspension is over: remove its chip. */
  | { type: 'ACK_SUSPENSION'; id: string; now: number }
  | { type: 'START_HALF_TIME_BREAK'; now: number }
  | { type: 'END_MATCH'; now: number }
  | { type: 'UNDO'; now: number }
  | { type: 'REDO'; now: number };

export interface ReduceResult {
  state: MatchState;
  /** Vibrations that became due during this transition. */
  alerts: Alert[];
}
