import { addToHistory, removeFromHistory } from '../history';
import { createMatch } from '../matchReducer';
import { DEFAULT_SETTINGS } from '../defaults';
import type { MatchState } from '../types';

const match = (id: string, scoreA = 0): MatchState => {
  const m = createMatch({
    id,
    now: 1_000,
    settings: DEFAULT_SETTINGS,
    teams: { A: { name: 'Home', color: '#D32F2F' }, B: { name: 'Away', color: '#1565C0' } },
  });
  return { ...m, phase: 'ENDED', teams: { ...m.teams, A: { ...m.teams.A, score: scoreA } } };
};

describe('match history', () => {
  it('keeps matches newest first', () => {
    let h: MatchState[] = [];
    h = addToHistory(h, match('m1'));
    h = addToHistory(h, match('m2'));
    expect(h.map((m) => m.id)).toEqual(['m2', 'm1']);
  });

  it('saving the same match again replaces it instead of duplicating', () => {
    let h = addToHistory([], match('m1', 3));
    h = addToHistory(h, match('m2'));
    h = addToHistory(h, match('m1', 4));
    expect(h.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(h[0].teams.A.score).toBe(4);
  });

  it('drops the oldest beyond the limit', () => {
    let h: MatchState[] = [];
    for (let i = 1; i <= 5; i++) h = addToHistory(h, match(`m${i}`), 3);
    expect(h.map((m) => m.id)).toEqual(['m5', 'm4', 'm3']);
  });

  it('removes one match by id, and is a no-op for an unknown id', () => {
    const h = addToHistory(addToHistory([], match('m1')), match('m2'));
    expect(removeFromHistory(h, 'm1').map((m) => m.id)).toEqual(['m2']);
    expect(removeFromHistory(h, 'nope')).toBe(h);
  });
});
