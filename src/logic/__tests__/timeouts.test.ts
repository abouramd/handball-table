import { isRunning } from '../clock';
import { gameTime } from '../selectors';
import { canTakeTimeout, isTimeoutOver, timeoutElapsed, timeoutRemaining, timeoutsLeft, timeoutsUsed } from '../timeouts';
import { MINUTE, SECOND, setup } from './helpers';

const check = (m: ReturnType<typeof setup>, team: 'A' | 'B' = 'A') =>
  canTakeTimeout(m.state, team, gameTime(m.state, m.now));

/** Takes a timeout for `team` and lets it run out fully. */
const fullTimeout = (m: ReturnType<typeof setup>, team: 'A' | 'B' = 'A') =>
  m.do({ type: 'TIMEOUT', team }).wait(MINUTE).do({ type: 'START_CLOCK' });

describe('team timeouts', () => {
  it('stops the game clock immediately and does not auto-restart', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(5 * MINUTE);
    m.do({ type: 'TIMEOUT', team: 'B' });
    expect(isRunning(m.state.clock)).toBe(false);
    expect(m.state.timeout).toMatchObject({ team: 'B', durationMs: MINUTE });
    expect(m.state.events.at(-1)).toMatchObject({ type: 'TIMEOUT', team: 'B', gameMs: 5 * MINUTE });

    m.wait(2 * MINUTE);
    expect(isRunning(m.state.clock)).toBe(false);
    expect(gameTime(m.state, m.now)).toBe(5 * MINUTE);
  });

  it('vibrates short at 50 s and long at the end, once each', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' });
    const id = m.state.timeout!.id;
    m.wait(50 * SECOND - 1);
    expect(m.alerts).toHaveLength(0);
    m.wait(1);
    expect(m.alerts).toEqual([{ key: `to:${id}:warn`, pattern: 'short' }]);
    m.wait(5 * SECOND);
    expect(timeoutElapsed(m.state.timeout!, m.now)).toBe(55 * SECOND);
    expect(timeoutRemaining(m.state.timeout!, m.now)).toBe(5 * SECOND);
    m.wait(5 * SECOND).wait(SECOND);
    expect(m.alerts.map((a) => a.pattern)).toEqual(['short', 'long']);
  });

  it('counts up and keeps running past its length until the clock restarts', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' }).wait(50 * SECOND).wait(10 * SECOND).wait(15 * SECOND);
    expect(m.state.timeout).not.toBeNull();
    expect(timeoutElapsed(m.state.timeout!, m.now)).toBe(75 * SECOND);
    expect(isTimeoutOver(m.state.timeout!, m.now)).toBe(true);
    expect(timeoutRemaining(m.state.timeout!, m.now)).toBe(0); // countdown holds at 0:00
    expect(m.alerts).toHaveLength(2); // warning + end, no repeats while it runs over
    m.do({ type: 'START_CLOCK' });
    expect(m.state.timeout).toBeNull();
    expect(isRunning(m.state.clock)).toBe(true);
  });

  it('can be closed without restarting the clock', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' }).wait(30 * SECOND);
    m.do({ type: 'END_TIMEOUT' });
    expect(m.state.timeout).toBeNull();
    expect(isRunning(m.state.clock)).toBe(false);
  });

  it('after resuming late, only the end signal fires', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' }).sleep(3 * MINUTE).wait(0);
    expect(m.alerts.map((a) => a.pattern)).toEqual(['long']);
  });

  it('pressing START during the timeout ends it early', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' }).wait(20 * SECOND);
    m.do({ type: 'START_CLOCK' });
    expect(m.state.timeout).toBeNull();
    expect(isRunning(m.state.clock)).toBe(true);
    m.wait(MINUTE);
    expect(m.alerts).toHaveLength(0);
  });

  it('by default there is no limit: a team can take more than three', () => {
    const m = setup().do({ type: 'START_CLOCK' });
    expect(timeoutsLeft(m.state, 'A')).toBeNull();
    for (let i = 0; i < 5; i++) fullTimeout(m);
    expect(timeoutsUsed(m.state.events, 'A')).toBe(5);
    expect(check(m).ok).toBe(true);
  });

  it('with a limit set, counts remaining timeouts and blocks when none are left', () => {
    const m = setup({ timeoutsPerTeam: 3 }).do({ type: 'START_CLOCK' });
    expect(timeoutsLeft(m.state, 'A')).toBe(3);
    fullTimeout(m);
    fullTimeout(m);
    fullTimeout(m);
    expect(timeoutsLeft(m.state, 'A')).toBe(0);
    expect(timeoutsLeft(m.state, 'B')).toBe(3);
    expect(check(m)).toEqual({ ok: false, reason: 'No timeouts left' });
    const s = m.state;
    m.do({ type: 'TIMEOUT', team: 'A' });
    expect(m.state).toBe(s);
  });

  it('only during play and not while one is running', () => {
    const m = setup();
    expect(check(m)).toEqual({ ok: false, reason: 'Only during play' });
    m.do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' });
    expect(check(m, 'B')).toEqual({ ok: false, reason: 'Timeout in progress' });
    m.wait(MINUTE).do({ type: 'START_CLOCK' }).wait(30 * MINUTE);
    expect(m.state.phase).toBe('HALF_TIME');
    expect(check(m)).toEqual({ ok: false, reason: 'Only during play' });
  });

  it('optional: max 2 per half', () => {
    const m = setup({ maxTwoTimeoutsPerHalf: true }).do({ type: 'START_CLOCK' });
    fullTimeout(m);
    fullTimeout(m);
    expect(check(m)).toEqual({ ok: false, reason: 'Max 2 per half' });
    expect(check(m, 'B').ok).toBe(true);
    // The 3rd one is available again in the 2nd half.
    m.wait(30 * MINUTE).do({ type: 'START_CLOCK' });
    expect(m.state.phase).toBe('SECOND_HALF');
    expect(check(m).ok).toBe(true);
  });

  it('without the toggle, 3 in one half is allowed', () => {
    const m = setup().do({ type: 'START_CLOCK' });
    fullTimeout(m);
    fullTimeout(m);
    expect(check(m).ok).toBe(true);
  });

  it('optional: max 1 in the last 5 minutes of each half', () => {
    const m = setup({ maxOneInLast5Min: true }).do({ type: 'START_CLOCK' }).wait(10 * MINUTE);
    fullTimeout(m); // at 10:00, outside the window
    m.wait(15 * MINUTE); // 25:00 → window starts
    expect(check(m).ok).toBe(true);
    fullTimeout(m);
    expect(check(m)).toEqual({ ok: false, reason: 'Max 1 in last 5 min' });

    // 2nd half: window is 55:00–60:00.
    m.wait(10 * MINUTE).do({ type: 'START_CLOCK' }).wait(25 * MINUTE);
    expect(gameTime(m.state, m.now)).toBe(55 * MINUTE);
    expect(check(m).ok).toBe(true);
  });

  it('respects a custom timeout length (warning 10 s before the end)', () => {
    const m = setup({ timeoutLengthMs: 30 * SECOND }).do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' });
    m.wait(20 * SECOND);
    expect(m.alerts.map((a) => a.pattern)).toEqual(['short']);
    m.wait(10 * SECOND);
    expect(m.alerts.map((a) => a.pattern)).toEqual(['short', 'long']);
  });
});
