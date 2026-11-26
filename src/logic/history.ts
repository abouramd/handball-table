import type { MatchState } from './types';

/** How many finished matches are kept; the oldest drop off beyond this. */
export const HISTORY_LIMIT = 100;

/**
 * Adds a finished match to the history, newest first. Saving the same match
 * again (same id) replaces its entry instead of duplicating it.
 */
export function addToHistory(list: MatchState[], match: MatchState, limit = HISTORY_LIMIT): MatchState[] {
  const rest = list.filter((m) => m.id !== match.id);
  return [match, ...rest].slice(0, limit);
}

export function removeFromHistory(list: MatchState[], id: string): MatchState[] {
  return list.some((m) => m.id === id) ? list.filter((m) => m.id !== id) : list;
}

/** "Sat 22 Nov 2026", in the phone's language. */
export function matchDate(match: MatchState): string {
  return new Date(match.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Date split for a list row: "Thu 26 Nov" over "2026". */
export function matchDateParts(match: MatchState): { day: string; year: string } {
  const d = new Date(match.createdAt);
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/,/g, '');
  return { day, year: String(d.getFullYear()) };
}
