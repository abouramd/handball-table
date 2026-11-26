import type { Half, Phase } from './types';

/** Which half an action belongs to. Half-time counts as the 1st half (late entries). */
export function currentHalf(phase: Phase): Half {
  return phase === 'SECOND_HALF' || phase === 'ENDED' ? 2 : 1;
}

/** Game-clock bounds of a half: 1st = [0, H], 2nd = [H, 2H]. */
export function halfBounds(half: Half, halfLengthMs: number): { start: number; end: number } {
  return half === 1
    ? { start: 0, end: halfLengthMs }
    : { start: halfLengthMs, end: 2 * halfLengthMs };
}

export function isPlayingPhase(phase: Phase): boolean {
  return phase === 'FIRST_HALF' || phase === 'SECOND_HALF';
}

export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case 'PRE_MATCH':
      return 'Ready';
    case 'FIRST_HALF':
      return '1st half';
    case 'HALF_TIME':
      return 'Half-time';
    case 'SECOND_HALF':
      return '2nd half';
    case 'ENDED':
      return 'Full time';
  }
}

/** Remaining half-time break, or null if the countdown hasn't been started. */
export function halfTimeRemaining(
  halfTime: { startedAt: number | null; durationMs: number } | null,
  now: number,
): number | null {
  if (!halfTime || halfTime.startedAt === null) return null;
  return Math.max(0, halfTime.durationMs - (now - halfTime.startedAt));
}
