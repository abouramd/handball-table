import { isRunning } from '../clock';
import { gameTime, summaryEvents } from '../selectors';
import { timeoutsUsed } from '../timeouts';
import { canUndo } from '../undo';
import { MINUTE, SECOND, setup } from './helpers';

describe('score', () => {
  it('adds and removes goals, logging game time', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(3 * MINUTE);
    m.do({ type: 'GOAL', team: 'A' }).do({ type: 'GOAL', team: 'A' }).do({ type: 'REMOVE_GOAL', team: 'A' });
    expect(m.state.teams.A.score).toBe(1);
    expect(m.state.events.find((e) => e.type === 'GOAL')).toMatchObject({ team: 'A', gameMs: 3 * MINUTE, half: 1 });
  });

  it('never goes below 0 (and logs nothing then)', () => {
    const m = setup().do({ type: 'REMOVE_GOAL', team: 'B' });
    expect(m.state.teams.B.score).toBe(0);
    expect(m.state.events).toHaveLength(0);
  });

  it('a goal entered after the buzzer is stamped 30:00 in the 1st half', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(31 * MINUTE).do({ type: 'GOAL', team: 'B' });
    expect(m.state.events.at(-1)).toMatchObject({ type: 'GOAL', gameMs: 30 * MINUTE, half: 1 });
  });
});

describe('undo', () => {
  it('reverts goals and goal removals', () => {
    const m = setup().do({ type: 'GOAL', team: 'A' }).do({ type: 'GOAL', team: 'B' });
    m.do({ type: 'UNDO' });
    expect(m.state.teams).toMatchObject({ A: { score: 1 }, B: { score: 0 } });
    m.do({ type: 'REMOVE_GOAL', team: 'A' }).do({ type: 'UNDO' });
    expect(m.state.teams.A.score).toBe(1);
    expect(m.state.events.map((e) => e.type)).toEqual(['GOAL']);
  });

  it('reverts a timeout: gives it back and closes the overlay, clock stays stopped', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'TIMEOUT', team: 'A' });
    m.do({ type: 'UNDO' });
    expect(m.state.timeout).toBeNull();
    expect(timeoutsUsed(m.state.events, 'A')).toBe(0);
    expect(isRunning(m.state.clock)).toBe(false);
  });

  it('reverts adding and deleting a suspension', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 7 }).wait(30 * SECOND);
    const id = m.state.suspensions[0].id;
    m.do({ type: 'DELETE_SUSPENSION', id }).do({ type: 'UNDO' });
    expect(m.state.suspensions).toHaveLength(1);
    expect(m.state.suspensions[0]).toMatchObject({ id, shirt: 7, startGameMs: 0 });
    m.do({ type: 'UNDO' });
    expect(m.state.suspensions).toHaveLength(0);
    expect(m.state.events.filter((e) => e.type.startsWith('SUSPENSION'))).toHaveLength(0);
  });

  it('reverts a clock adjustment by its delta, keeping time that ran since', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'ADJUST_CLOCK', deltaMs: 10 * SECOND });
    m.wait(5 * SECOND).do({ type: 'UNDO' });
    expect(gameTime(m.state, m.now)).toBe(MINUTE + 5 * SECOND);
  });

  it('skips clock start/stop and half transitions, which are not undoable', () => {
    const m = setup().do({ type: 'GOAL', team: 'A' }).do({ type: 'START_CLOCK' }).wait(30 * MINUTE);
    expect(m.state.phase).toBe('HALF_TIME');
    m.do({ type: 'UNDO' });
    expect(m.state.teams.A.score).toBe(0);
    expect(m.state.phase).toBe('HALF_TIME');
    expect(canUndo(m.state)).toBe(false);
  });

  it('does not undo a clock adjustment from a previous half', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'ADJUST_CLOCK', deltaMs: SECOND });
    m.wait(30 * MINUTE).do({ type: 'START_CLOCK' });
    expect(canUndo(m.state)).toBe(false);
  });

  it('undo with nothing to undo is a no-op', () => {
    const m = setup();
    const s = m.state;
    m.do({ type: 'UNDO' });
    expect(m.state).toBe(s);
  });

  it('multiple undos walk back in order', () => {
    const m = setup().do({ type: 'GOAL', team: 'A' }).do({ type: 'GOAL', team: 'B' }).do({ type: 'GOAL', team: 'B' });
    m.do({ type: 'UNDO' }).do({ type: 'UNDO' });
    expect(m.state.teams).toMatchObject({ A: { score: 1 }, B: { score: 0 } });
  });
});

describe('event log', () => {
  it('records everything the summary needs', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(4 * MINUTE);
    m.do({ type: 'GOAL', team: 'A' })
      .do({ type: 'ADD_SUSPENSION', team: 'B', shirt: 12 })
      .wait(MINUTE)
      .do({ type: 'TIMEOUT', team: 'B' });
    expect(summaryEvents(m.state).map(({ type, team, gameMs, shirt }) => ({ type, team, gameMs, shirt }))).toEqual([
      { type: 'GOAL', team: 'A', gameMs: 4 * MINUTE, shirt: undefined },
      { type: 'SUSPENSION', team: 'B', gameMs: 4 * MINUTE, shirt: 12 },
      { type: 'TIMEOUT', team: 'B', gameMs: 5 * MINUTE, shirt: undefined },
    ]);
    expect(new Set(m.state.events.map((e) => e.id)).size).toBe(m.state.events.length);
  });

  it('state survives a JSON round-trip (persistence) and continues correctly', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'ADD_SUSPENSION', team: 'A' });
    const restored = JSON.parse(JSON.stringify(m.state));
    expect(restored).toEqual(m.state);
    expect(gameTime(restored, m.now + 10 * SECOND)).toBe(MINUTE + 10 * SECOND);
  });
});
