import { gameTime } from '../selectors';
import { suspensionRemaining } from '../suspensions';
import { MINUTE, SECOND, setup } from './helpers';

const remainingOf = (m: ReturnType<typeof setup>, i = 0) =>
  suspensionRemaining(m.state.suspensions[i], gameTime(m.state, m.now));

describe('suspensions', () => {
  it('counts down only while the game clock runs', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE);
    m.do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 7 });
    expect(m.state.suspensions[0]).toMatchObject({ team: 'A', shirt: 7, startGameMs: MINUTE });

    m.wait(30 * SECOND);
    expect(remainingOf(m)).toBe(90 * SECOND);

    m.do({ type: 'STOP_CLOCK' }).wait(5 * MINUTE); // paused
    expect(remainingOf(m)).toBe(90 * SECOND);

    m.do({ type: 'START_CLOCK' }).wait(10 * SECOND);
    expect(remainingOf(m)).toBe(80 * SECOND);
  });

  it('pauses during a team timeout', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'ADD_SUSPENSION', team: 'B' }).wait(20 * SECOND);
    m.do({ type: 'TIMEOUT', team: 'A' }).wait(60 * SECOND);
    expect(remainingOf(m)).toBe(100 * SECOND);
  });

  it('supports any number at once, for both teams, and skipping the shirt number', () => {
    const m = setup().do({ type: 'START_CLOCK' });
    m.do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 7 })
      .do({ type: 'ADD_SUSPENSION', team: 'A' })
      .do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 11 })
      .do({ type: 'ADD_SUSPENSION', team: 'B', shirt: 3 });
    expect(m.state.suspensions).toHaveLength(4);
    expect(m.state.suspensions[1].shirt).toBeUndefined();
    expect(new Set(m.state.suspensions.map((s) => s.id)).size).toBe(4);
  });

  it('carries remaining time over into the 2nd half', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(29 * MINUTE);
    m.do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 4 }).wait(2 * MINUTE); // half ends at 30:00
    expect(m.state.phase).toBe('HALF_TIME');
    expect(remainingOf(m)).toBe(MINUTE);

    m.do({ type: 'START_HALF_TIME_BREAK' }).wait(10 * MINUTE);
    expect(remainingOf(m)).toBe(MINUTE); // does not run during half-time

    m.do({ type: 'START_CLOCK' }).wait(30 * SECOND);
    expect(remainingOf(m)).toBe(30 * SECOND);
    m.wait(30 * SECOND);
    expect(m.alertKeys()).toContain(`susp:${m.state.suspensions[0].id}:end`);
  });

  it('vibrates double-short on expiry, then keeps flashing until acknowledged', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'ADD_SUSPENSION', team: 'A' });
    const id = m.state.suspensions[0].id;
    m.wait(2 * MINUTE - 1);
    expect(m.alerts).toHaveLength(0);

    m.wait(1);
    expect(m.alerts).toEqual([{ key: `susp:${id}:end`, pattern: 'doubleShort' }]);
    expect(m.state.suspensions[0].endedAtWall).toBe(m.now);

    m.wait(5 * MINUTE);
    expect(m.state.suspensions).toHaveLength(1); // never disappears on its own
    expect(m.alerts).toHaveLength(1); // and vibrates only once

    m.do({ type: 'ACK_SUSPENSION', id });
    expect(m.state.suspensions).toHaveLength(0);
    // The log keeps it for the summary.
    expect(m.state.events.filter((e) => e.type === 'SUSPENSION')).toHaveLength(1);
  });

  it('acknowledging only removes ended suspensions, never a running one', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'ADD_SUSPENSION', team: 'A' }).wait(MINUTE);
    const s = m.state;
    m.do({ type: 'ACK_SUSPENSION', id: m.state.suspensions[0].id });
    expect(m.state).toBe(s);
  });

  it('an ended suspension survives half-time and an app restart until acknowledged', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(28 * MINUTE).do({ type: 'ADD_SUSPENSION', team: 'B' }).wait(2 * MINUTE);
    expect(m.state.phase).toBe('HALF_TIME');
    const restored = JSON.parse(JSON.stringify(m.state));
    expect(restored.suspensions[0].endedAtWall).toBeDefined();
  });

  it('can be deleted when entered by mistake (no vibration)', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'ADD_SUSPENSION', team: 'B', shirt: 9 });
    const id = m.state.suspensions[0].id;
    m.do({ type: 'DELETE_SUSPENSION', id }).wait(5 * MINUTE);
    expect(m.state.suspensions).toHaveLength(0);
    expect(m.alerts).toHaveLength(0);
    expect(m.state.events.at(-1)).toMatchObject({ type: 'SUSPENSION_DELETED', team: 'B', shirt: 9 });
  });

  it('a backwards clock correction reactivates an expired (still flashing) suspension', () => {
    const m = setup().do({ type: 'START_CLOCK' }).do({ type: 'ADD_SUSPENSION', team: 'A' }).wait(2 * MINUTE);
    m.do({ type: 'STOP_CLOCK' }).do({ type: 'ADJUST_CLOCK', deltaMs: -10 * SECOND });
    expect(m.state.suspensions[0].endedAtWall).toBeUndefined();
    expect(remainingOf(m)).toBe(10 * SECOND);
  });

  it('rejects invalid shirt numbers', () => {
    const m = setup().do({ type: 'ADD_SUSPENSION', team: 'A', shirt: -1 }).do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 1.5 });
    expect(m.state.suspensions.map((s) => s.shirt)).toEqual([undefined, undefined]);
  });
});
