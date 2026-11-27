import { halfTimeScore } from './describe';
import { suspensionEndGameMs } from './suspensions';
import type { Half, MatchEvent, MatchState, TeamId } from './types';

export type Score = Record<TeamId, number>;

/** One line of the match timeline shown in the match report. */
export type TimelineEntry =
  | { kind: 'goal'; id: string; team: TeamId; gameMs: number; half: Half; score: Score }
  | { kind: 'goalRemoved'; id: string; team: TeamId; gameMs: number; half: Half; score: Score }
  | { kind: 'timeout'; id: string; team: TeamId; gameMs: number; half: Half }
  /** returnMs is omitted when the player's return would fall after the end of the match. */
  | { kind: 'suspension'; id: string; team: TeamId; shirt?: number; gameMs: number; half: Half; returnMs?: number }
  | { kind: 'halfTime'; id: string; gameMs: number; score: Score }
  | { kind: 'fullTime'; id: string; gameMs: number; score: Score };

/**
 * Builds the match timeline from the event log: goals (with the running
 * score), −1 corrections, timeouts, suspensions, half-time and full time.
 * Clock start/stop and clock corrections are left out on purpose.
 *
 * Ordering: by half, then game time, then log order. A redone action is
 * appended to the log, so sorting puts it back at the minute it happened.
 * The half-time marker comes after every 1st-half event, so a goal entered
 * late during the break still counts before it. Full time is always last.
 *
 * Scores: each goal line shows the score that goal really produced, worked
 * out in LOG order (the order the scoreboard applied them). Sorting only
 * decides where a line is shown. After a backwards clock correction, a −1
 * can sit at an earlier game time than the goal it took back; recounting in
 * display order would then drift from the scoreboard. Half-time and full time
 * use the report header's half-time score and the final scoreboard.
 */
export function buildTimeline(match: MatchState): TimelineEntry[] {
  // Score after each goal/−1, in the order the scoreboard applied them.
  const scoreAfter = new Map<string, Score>();
  const running: Score = { A: 0, B: 0 };
  for (const e of match.events) {
    if (e.type === 'GOAL') running[e.team] += 1;
    else if (e.type === 'GOAL_REMOVED') running[e.team] = Math.max(0, running[e.team] - 1);
    else continue;
    scoreAfter.set(e.id, { ...running });
  }
  const finalScore: Score = { A: match.teams.A.score, B: match.teams.B.score };
  const matchEnd =
    match.events.find((e) => e.type === 'MATCH_END')?.gameMs ?? 2 * match.settings.halfLengthMs;

  const deleted = new Set(
    match.events.flatMap((e) => (e.type === 'SUSPENSION_DELETED' ? [e.suspension.id] : [])),
  );

  // Rank: 0 = ordinary event, 1 = half-time marker (end of its half), 2 = full time.
  const keyed = match.events
    .map((e, index) => ({ e, index }))
    .filter(({ e }) => isTimelineEvent(e, deleted))
    .map(({ e, index }) => ({
      e,
      index,
      half: e.type === 'MATCH_END' ? 3 : e.half,
      rank: e.type === 'MATCH_END' ? 2 : e.type === 'HALF_END' ? 1 : 0,
    }))
    .sort((a, b) => a.half - b.half || a.rank - b.rank || a.e.gameMs - b.e.gameMs || a.index - b.index);

  const entries: TimelineEntry[] = [];
  let seenFullTime = false;

  for (const { e } of keyed) {
    switch (e.type) {
      case 'GOAL':
        entries.push({ kind: 'goal', id: e.id, team: e.team, gameMs: e.gameMs, half: e.half, score: scoreAfter.get(e.id)! });
        break;
      case 'GOAL_REMOVED':
        entries.push({ kind: 'goalRemoved', id: e.id, team: e.team, gameMs: e.gameMs, half: e.half, score: scoreAfter.get(e.id)! });
        break;
      case 'TIMEOUT':
        entries.push({ kind: 'timeout', id: e.id, team: e.team, gameMs: e.gameMs, half: e.half });
        break;
      case 'SUSPENSION': {
        const s = match.suspensions.find((x) => x.id === e.suspensionId);
        const durationMs = s?.durationMs ?? match.settings.suspensionLengthMs;
        const returnMs = suspensionEndGameMs({ id: e.suspensionId, team: e.team, startGameMs: e.gameMs, durationMs });
        entries.push({
          kind: 'suspension',
          id: e.id,
          team: e.team,
          shirt: e.shirt,
          gameMs: e.gameMs,
          half: e.half,
          ...(returnMs <= matchEnd ? { returnMs } : {}),
        });
        break;
      }
      case 'HALF_END':
        if (e.half === 1) entries.push({ kind: 'halfTime', id: e.id, gameMs: e.gameMs, score: halfTimeScore(match) });
        break;
      case 'MATCH_END':
        // A match ended at 60:00 logs HALF_END (half 2) then MATCH_END; keep one full-time line.
        if (!seenFullTime) entries.push({ kind: 'fullTime', id: e.id, gameMs: e.gameMs, score: finalScore });
        seenFullTime = true;
        break;
    }
  }
  return entries;
}

function isTimelineEvent(e: MatchEvent, deletedSuspensions: Set<string>): boolean {
  switch (e.type) {
    case 'GOAL':
    case 'GOAL_REMOVED':
    case 'TIMEOUT':
    case 'HALF_END':
    case 'MATCH_END':
      return true;
    case 'SUSPENSION':
      return !deletedSuspensions.has(e.suspensionId);
    default:
      return false; // clock start/stop, clock corrections, suspension deletions
  }
}
