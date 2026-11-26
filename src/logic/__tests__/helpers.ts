import { DEFAULT_SETTINGS, MINUTE, SECOND } from '../defaults';
import { createMatch, reduce } from '../matchReducer';
import type { Alert, MatchAction, MatchState, Settings } from '../types';

export { MINUTE, SECOND };

/** Small driver: a match plus a fake wall clock, collecting all alerts fired. */
export function setup(overrides: Partial<Settings> = {}, t0 = 1_000_000) {
  let now = t0;
  let state: MatchState = createMatch({
    id: 'm1',
    now,
    settings: { ...DEFAULT_SETTINGS, ...overrides },
    teams: { A: { name: 'Home', color: '#D32F2F' }, B: { name: 'Away', color: '#1565C0' } },
  });
  const alerts: Alert[] = [];

  type ActionInput = MatchAction extends infer A ? (A extends MatchAction ? Omit<A, 'now'> : never) : never;

  const api = {
    get state() {
      return state;
    },
    get now() {
      return now;
    },
    alerts,
    /** Advance the fake wall clock and run a TICK. */
    wait(ms: number) {
      now += ms;
      return api.do({ type: 'TICK' });
    },
    /** Advance the wall clock WITHOUT ticking (simulates the app being backgrounded). */
    sleep(ms: number) {
      now += ms;
      return api;
    },
    do(action: ActionInput) {
      const r = reduce(state, { ...action, now } as MatchAction);
      state = r.state;
      alerts.push(...r.alerts);
      return api;
    },
    alertKeys: () => alerts.map((a) => a.key),
  };
  return api;
}
