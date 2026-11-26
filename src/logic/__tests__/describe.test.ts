import { describeEvent, halfTimeScore, suspensionEvents, timeoutEvents } from '../describe';
import { MINUTE, setup } from './helpers';

describe('summary helpers', () => {
  it('excludes deleted suspensions but keeps expired ones', () => {
    const m = setup().do({ type: 'START_CLOCK' });
    m.do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 7 }).do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 8 });
    m.do({ type: 'DELETE_SUSPENSION', id: m.state.suspensions[1].id }).wait(5 * MINUTE);
    m.do({ type: 'ACK_SUSPENSION', id: m.state.suspensions[0].id });
    expect(m.state.suspensions).toHaveLength(0);
    expect(suspensionEvents(m.state, 'A').map((e) => e.shirt)).toEqual([7]);
    expect(suspensionEvents(m.state, 'B')).toHaveLength(0);
  });

  it('computes the half-time score from the log', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'GOAL', team: 'A' }).do({ type: 'GOAL', team: 'B' });
    m.wait(31 * MINUTE).do({ type: 'GOAL', team: 'A' }); // late entry during half-time counts for the 1st half
    m.do({ type: 'START_CLOCK' }).do({ type: 'GOAL', team: 'B' });
    expect(halfTimeScore(m.state)).toEqual({ A: 2, B: 1 });
    expect(m.state.teams.B.score).toBe(2);
  });

  it('lists timeouts with their game time', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(12 * MINUTE).do({ type: 'TIMEOUT', team: 'B' });
    expect(timeoutEvents(m.state, 'B').map((e) => e.gameMs)).toEqual([12 * MINUTE]);
  });

  it('describes events for the undo button', () => {
    const m = setup().do({ type: 'GOAL', team: 'A' }).do({ type: 'ADD_SUSPENSION', team: 'B', shirt: 5 });
    expect(m.state.events.map((e) => describeEvent(e, m.state.teams))).toEqual(['Goal Home', 'Suspension Away #5']);
  });
});
