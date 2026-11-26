import { formatClock } from './format';
import type { MatchEvent, MatchState, TeamId } from './types';

type SuspensionEvent = Extract<MatchEvent, { type: 'SUSPENSION' }>;
type TimeoutEvent = Extract<MatchEvent, { type: 'TIMEOUT' }>;

/** Short human label for an event, e.g. for the Undo button: "Goal Home". */
export function describeEvent(e: MatchEvent, teams: MatchState['teams']): string {
  const team = e.team ? teams[e.team].name : '';
  const shirt = e.shirt !== undefined ? ` #${e.shirt}` : '';
  switch (e.type) {
    case 'GOAL':
      return `Goal ${team}`;
    case 'GOAL_REMOVED':
      return `−1 ${team}`;
    case 'TIMEOUT':
      return `Timeout ${team}`;
    case 'SUSPENSION':
      return `Suspension ${team}${shirt}`;
    case 'SUSPENSION_DELETED':
      return `Delete suspension ${team}${shirt}`;
    case 'CLOCK_ADJUST':
      return `Clock ${formatClock(e.fromMs)} → ${formatClock(e.toMs)}`;
    case 'CLOCK_START':
      return 'Clock start';
    case 'CLOCK_STOP':
      return 'Clock stop';
    case 'HALF_END':
      return `End of ${e.half === 1 ? '1st' : '2nd'} half`;
    case 'MATCH_END':
      return 'Match end';
  }
}

export function timeoutEvents(state: MatchState, team: TeamId): TimeoutEvent[] {
  return state.events
    .filter((e): e is TimeoutEvent => e.type === 'TIMEOUT' && e.team === team)
    .sort((a, b) => a.gameMs - b.gameMs); // a redone event is appended to the log, so order by game time
}

/** Suspensions given to a team, excluding ones deleted as mistakes. */
export function suspensionEvents(state: MatchState, team: TeamId): SuspensionEvent[] {
  const deleted = new Set(
    state.events.flatMap((e) => (e.type === 'SUSPENSION_DELETED' ? [e.suspension.id] : [])),
  );
  return state.events
    .filter((e): e is SuspensionEvent => e.type === 'SUSPENSION' && e.team === team && !deleted.has(e.suspensionId))
    .sort((a, b) => a.gameMs - b.gameMs);
}

/** Score at the end of the 1st half, rebuilt from the event log. */
export function halfTimeScore(state: MatchState): Record<TeamId, number> {
  const score = { A: 0, B: 0 };
  for (const e of state.events) {
    if (e.half !== 1 || !e.team) continue;
    if (e.type === 'GOAL') score[e.team] += 1;
    if (e.type === 'GOAL_REMOVED') score[e.team] = Math.max(0, score[e.team] - 1);
  }
  return score;
}
