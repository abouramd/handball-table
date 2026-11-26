import { isRunning } from '../clock';
import { gameTime } from '../selectors';
import { timeoutsUsed } from '../timeouts';
import { canRedo, nextRedo } from '../undo';
import { MINUTE, SECOND, setup } from './helpers';

describe('redo', () => {
  it('re-applies an undone goal, and undo/redo can go back and forth', () => {
    const m = setup().do({ type: 'GOAL', team: 'A' }).do({ type: 'GOAL', team: 'A' });
    m.do({ type: 'UNDO' }).do({ type: 'UNDO' });
    expect(m.state.teams.A.score).toBe(0);
    expect(nextRedo(m.state)?.event.type).toBe('GOAL');
    m.do({ type: 'REDO' });
    expect(m.state.teams.A.score).toBe(1);
    m.do({ type: 'REDO' });
    expect(m.state.teams.A.score).toBe(2);
    expect(canRedo(m.state)).toBe(false);
    m.do({ type: 'UNDO' }).do({ type: 'REDO' });
    expect(m.state.teams.A.score).toBe(2);
    expect(m.state.events.filter((e) => e.type === 'GOAL')).toHaveLength(2);
  });

  it('keeps the original game time of the redone event', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(3 * MINUTE).do({ type: 'GOAL', team: 'B' });
    m.do({ type: 'UNDO' }).wait(MINUTE).do({ type: 'REDO' });
    expect(m.state.events.at(-1)).toMatchObject({ type: 'GOAL', team: 'B', gameMs: 3 * MINUTE });
  });

  it('a new action clears redo; starting/stopping the clock does not', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'GOAL', team: 'A' }).do({ type: 'UNDO' });
    m.do({ type: 'STOP_CLOCK' }).do({ type: 'START_CLOCK' });
    expect(canRedo(m.state)).toBe(true);
    m.do({ type: 'GOAL', team: 'B' });
    expect(canRedo(m.state)).toBe(false);
  });

  it('restores an undone suspension with its remaining time, and re-deletes a deleted one', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 7 });
    const s = m.state.suspensions[0];
    m.wait(30 * SECOND).do({ type: 'UNDO' });
    expect(m.state.suspensions).toHaveLength(0);
    m.do({ type: 'REDO' });
    expect(m.state.suspensions).toEqual([s]);

    m.do({ type: 'DELETE_SUSPENSION', id: s.id }).do({ type: 'UNDO' });
    expect(m.state.suspensions).toHaveLength(1);
    m.do({ type: 'REDO' });
    expect(m.state.suspensions).toHaveLength(0);
  });

  it('re-opens a timeout that is still within its time and stops the clock again', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' }).wait(5 * SECOND);
    m.do({ type: 'UNDO' }).do({ type: 'START_CLOCK' }).wait(5 * SECOND).do({ type: 'REDO' });
    expect(timeoutsUsed(m.state.events, 'A')).toBe(1);
    expect(m.state.timeout?.team).toBe('A');
    expect(isRunning(m.state.clock)).toBe(false);
  });

  it('a redone timeout whose time has passed only counts, without reopening', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' }).do({ type: 'UNDO' });
    m.do({ type: 'START_CLOCK' }).wait(2 * MINUTE).do({ type: 'REDO' });
    expect(timeoutsUsed(m.state.events, 'A')).toBe(1);
    expect(m.state.timeout).toBeNull();
    expect(isRunning(m.state.clock)).toBe(true);
  });

  it('re-applies a clock correction by the same amount', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'STOP_CLOCK' });
    m.do({ type: 'ADJUST_CLOCK', deltaMs: 10 * SECOND }).do({ type: 'UNDO' });
    expect(gameTime(m.state, m.now)).toBe(MINUTE);
    m.do({ type: 'REDO' });
    expect(gameTime(m.state, m.now)).toBe(MINUTE + 10 * SECOND);
  });

  it('never redoes a timeout past a limit reached since', () => {
    const m = setup({ timeoutsPerTeam: 1 }).do({ type: 'START_CLOCK' }).do({ type: 'TIMEOUT', team: 'A' }).do({ type: 'UNDO' });
    // Taking a new timeout clears redo anyway; check the guard directly via a stale stack.
    const stale = { ...m.state, events: [...m.state.events, { ...m.state.redo![0].event, id: 'other' }] };
    expect(canRedo(stale)).toBe(false);
  });

  it('works on matches saved before redo existed', () => {
    const m = setup().do({ type: 'GOAL', team: 'A' });
    const { redo: _gone, ...old } = m.state;
    expect(canRedo(old)).toBe(false);
  });
});
