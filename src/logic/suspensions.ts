import type { Suspension, TeamId } from './types';

/**
 * Remaining suspension time, derived from the GAME clock: it only advances
 * while the clock runs, so suspensions pause automatically when the clock is
 * stopped (including timeouts) and carry over into the 2nd half because the
 * 2nd half continues counting from the half length.
 */
export function suspensionRemaining(s: Suspension, gameMs: number): number {
  return Math.max(0, s.durationMs - (gameMs - s.startGameMs));
}

/** Game-clock time at which the player may return, e.g. for "#7 until 32:15". */
export const suspensionEndGameMs = (s: Suspension): number => s.startGameMs + s.durationMs;

export function suspensionsForTeam(list: Suspension[], team: TeamId): Suspension[] {
  return list.filter((s) => s.team === team);
}

/** True once a suspension ran out: the chip flashes until it is acknowledged. */
export const isFlashing = (s: Suspension): boolean => s.endedAtWall !== undefined;

/** Removes an ENDED suspension's chip once the official confirms seeing it. Running ones are untouched. */
export function acknowledgeSuspension(list: Suspension[], id: string): Suspension[] {
  const s = list.find((x) => x.id === id);
  if (!s || s.endedAtWall === undefined) return list;
  return list.filter((x) => x.id !== id);
}

export interface SuspensionUpdate {
  suspensions: Suspension[];
  /** Suspensions that ran out in this update (need a vibration). */
  justEnded: Suspension[];
}

/**
 * Marks suspensions that ran out (they then flash until acknowledged) and
 * reactivates any that have time left again (after a backwards clock correction).
 */
export function updateSuspensions(list: Suspension[], gameMs: number, now: number): SuspensionUpdate {
  const justEnded: Suspension[] = [];
  const next: Suspension[] = [];
  let changed = false;

  for (const s of list) {
    const remaining = suspensionRemaining(s, gameMs);
    if (s.endedAtWall === undefined) {
      if (remaining === 0) {
        const ended = { ...s, endedAtWall: now };
        justEnded.push(ended);
        next.push(ended);
        changed = true;
      } else {
        next.push(s);
      }
    } else if (remaining > 0) {
      const { endedAtWall: _ignored, ...active } = s;
      next.push(active);
      changed = true;
    } else {
      // Ended: keeps flashing until acknowledged (ACK_SUSPENSION), never auto-removed,
      // so an official who looked away cannot miss it.
      next.push(s);
    }
  }

  return { suspensions: changed ? next : list, justEnded };
}
