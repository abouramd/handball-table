import { halfTimeRemaining } from '../periods';
import { gameTime } from '../selectors';
import { MINUTE, SECOND, setup } from './helpers';

describe('half transitions', () => {
  it('first START begins the 1st half', () => {
    const m = setup().do({ type: 'START_CLOCK' });
    expect(m.state.phase).toBe('FIRST_HALF');
    m.wait(10 * SECOND);
    expect(gameTime(m.state, m.now)).toBe(10 * SECOND);
  });

  it('stops exactly at 30:00 and vibrates long', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(30 * MINUTE - 1);
    expect(m.state.phase).toBe('FIRST_HALF');
    expect(m.alerts).toHaveLength(0);

    m.wait(250); // tick lands 249 ms past the buzzer
    expect(m.state.phase).toBe('HALF_TIME');
    expect(m.state.clock).toEqual({ accumulatedMs: 30 * MINUTE, runningSince: null });
    expect(m.alerts).toEqual([{ key: 'half:1:end', pattern: 'long' }]);
    expect(m.state.events.at(-1)).toMatchObject({ type: 'HALF_END', gameMs: 30 * MINUTE, half: 1 });
  });

  it('stops exactly at the half end even if the app was backgrounded past it', () => {
    const m = setup().do({ type: 'START_CLOCK' }).sleep(45 * MINUTE).wait(0);
    expect(m.state.phase).toBe('HALF_TIME');
    expect(gameTime(m.state, m.now)).toBe(30 * MINUTE);
  });

  it('respects a custom half length', () => {
    const m = setup({ halfLengthMs: 20 * MINUTE }).do({ type: 'START_CLOCK' }).wait(21 * MINUTE);
    expect(m.state.phase).toBe('HALF_TIME');
    expect(gameTime(m.state, m.now)).toBe(20 * MINUTE);
  });

  it('runs the half-time break only when started, then vibrates and waits', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(30 * MINUTE);
    m.alerts.length = 0;

    m.wait(5 * MINUTE);
    expect(halfTimeRemaining(m.state.halfTime, m.now)).toBeNull(); // not started yet

    m.do({ type: 'START_HALF_TIME_BREAK' }).wait(9 * MINUTE);
    expect(halfTimeRemaining(m.state.halfTime, m.now)).toBe(1 * MINUTE);
    expect(m.alerts).toHaveLength(0);

    m.wait(1 * MINUTE);
    expect(m.alerts).toEqual([{ key: 'halftime:end', pattern: 'long' }]);
    expect(m.state.phase).toBe('HALF_TIME'); // waits for the user

    m.wait(1 * MINUTE);
    expect(m.alerts).toHaveLength(1); // no repeat vibration
  });

  it('2nd half continues from 30:00 and stops exactly at 60:00, ending the match', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(30 * MINUTE);
    m.do({ type: 'START_CLOCK' });
    expect(m.state.phase).toBe('SECOND_HALF');
    expect(m.state.halfTime).toBeNull();
    m.wait(1 * MINUTE);
    expect(gameTime(m.state, m.now)).toBe(31 * MINUTE);

    m.wait(40 * MINUTE);
    expect(m.state.phase).toBe('ENDED');
    expect(gameTime(m.state, m.now)).toBe(60 * MINUTE);
    expect(m.alertKeys()).toEqual(['half:1:end', 'half:2:end']);
    expect(m.state.events.slice(-2).map((e) => e.type)).toEqual(['HALF_END', 'MATCH_END']);
  });

  it('starting the 2nd half during the break cancels the break', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(30 * MINUTE);
    m.do({ type: 'START_HALF_TIME_BREAK' }).wait(2 * MINUTE).do({ type: 'START_CLOCK' }).wait(10 * MINUTE);
    expect(m.alertKeys()).not.toContain('halftime:end');
  });

  it('ignores actions after the match ended', () => {
    const m = setup().do({ type: 'END_MATCH' });
    const s = m.state;
    m.do({ type: 'GOAL', team: 'A' }).do({ type: 'START_CLOCK' });
    expect(m.state).toBe(s);
  });

  it('a TICK with nothing to do returns the same state object', () => {
    const m = setup().do({ type: 'START_CLOCK' });
    const s = m.state;
    m.wait(SECOND);
    expect(m.state).toBe(s);
  });
});

describe('clock adjustment', () => {
  it('adjusts by seconds and sets exact time, clamped to the current half', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(10 * MINUTE).do({ type: 'STOP_CLOCK' });
    m.do({ type: 'ADJUST_CLOCK', deltaMs: 5 * SECOND });
    expect(gameTime(m.state, m.now)).toBe(10 * MINUTE + 5 * SECOND);
    m.do({ type: 'ADJUST_CLOCK', deltaMs: -20 * MINUTE });
    expect(gameTime(m.state, m.now)).toBe(0);
    m.do({ type: 'SET_CLOCK', gameMs: 45 * MINUTE });
    expect(gameTime(m.state, m.now)).toBe(30 * MINUTE);
    expect(m.state.events.filter((e) => e.type === 'CLOCK_ADJUST')).toHaveLength(3);
  });

  it('in the 2nd half it is clamped to 30:00–60:00', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(30 * MINUTE).do({ type: 'START_CLOCK' }).do({ type: 'STOP_CLOCK' });
    m.do({ type: 'SET_CLOCK', gameMs: 10 * MINUTE });
    expect(gameTime(m.state, m.now)).toBe(30 * MINUTE);
  });

  it('adjusting a running clock keeps it running', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'SET_CLOCK', gameMs: 5 * MINUTE }).wait(SECOND);
    expect(gameTime(m.state, m.now)).toBe(5 * MINUTE + SECOND);
  });
});
