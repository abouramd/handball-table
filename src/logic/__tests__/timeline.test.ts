import { halfTimeScore } from '../describe';
import { buildTimeline } from '../timeline';
import { MINUTE, SECOND, setup } from './helpers';

const kinds = (m: ReturnType<typeof setup>) => buildTimeline(m.state).map((e) => e.kind);

describe('match timeline', () => {
  it('shows the running score after each goal and a −1 correction', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE);
    m.do({ type: 'GOAL', team: 'A' }).wait(MINUTE).do({ type: 'GOAL', team: 'B' }).wait(MINUTE).do({ type: 'GOAL', team: 'A' });
    m.wait(MINUTE).do({ type: 'REMOVE_GOAL', team: 'A' });
    const t = buildTimeline(m.state);
    expect(t.map((e) => ('score' in e ? `${e.kind} ${e.score.A}-${e.score.B}` : e.kind))).toEqual([
      'goal 1-0',
      'goal 1-1',
      'goal 2-1',
      'goalRemoved 1-1',
    ]);
    expect(t[0]).toMatchObject({ team: 'A', gameMs: MINUTE, half: 1 });
  });

  it('puts half-time after every 1st-half event, including a goal entered during the break', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(10 * MINUTE).do({ type: 'GOAL', team: 'A' });
    m.wait(21 * MINUTE); // half ends at 30:00
    m.do({ type: 'GOAL', team: 'B' }); // late entry during the break
    m.do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'GOAL', team: 'A' });
    const t = buildTimeline(m.state);
    expect(t.map((e) => e.kind)).toEqual(['goal', 'goal', 'halfTime', 'goal']);
    const ht = t.find((e) => e.kind === 'halfTime');
    expect(ht).toMatchObject({ gameMs: 30 * MINUTE, score: halfTimeScore(m.state) });
    expect(ht).toMatchObject({ score: { A: 1, B: 1 } });
  });

  it('suspensions carry shirt number and return time; deleted ones are left out', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(29 * MINUTE);
    m.do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 7 }).do({ type: 'ADD_SUSPENSION', team: 'B', shirt: 4 });
    m.do({ type: 'DELETE_SUSPENSION', id: m.state.suspensions[1].id });
    const t = buildTimeline(m.state);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ kind: 'suspension', team: 'A', shirt: 7, gameMs: 29 * MINUTE, returnMs: 31 * MINUTE });
  });

  it('an undone goal is absent from the timeline', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'GOAL', team: 'A' }).do({ type: 'UNDO' });
    expect(kinds(m)).toEqual([]);
  });

  it('a redone goal sits at its original game time, before later goals', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'GOAL', team: 'A' }).do({ type: 'UNDO' });
    // Clock start/stop keeps redo available; the redone goal is appended to the log after them.
    m.wait(5 * MINUTE).do({ type: 'STOP_CLOCK' }).do({ type: 'REDO' });
    m.do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'GOAL', team: 'B' });
    const t = buildTimeline(m.state);
    expect(t.map((e) => [e.kind, e.gameMs])).toEqual([
      ['goal', MINUTE],
      ['goal', 7 * MINUTE],
    ]);
    expect(t[1]).toMatchObject({ score: { A: 1, B: 1 } });
  });

  it('a match ended in the 1st half has full time but no half-time', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(5 * MINUTE).do({ type: 'GOAL', team: 'A' }).do({ type: 'END_MATCH' });
    expect(kinds(m)).toEqual(['goal', 'fullTime']);
  });

  it('a full match shows half-time and exactly one full-time line at 60:00', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(31 * MINUTE).do({ type: 'START_CLOCK' }).wait(31 * MINUTE);
    expect(m.state.phase).toBe('ENDED');
    const t = buildTimeline(m.state);
    expect(t.map((e) => e.kind)).toEqual(['halfTime', 'fullTime']);
    expect(t[1]).toMatchObject({ gameMs: 60 * MINUTE, score: { A: 0, B: 0 } });
  });

  it('never shows clock start/stop or clock corrections', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(SECOND).do({ type: 'STOP_CLOCK' });
    m.do({ type: 'ADJUST_CLOCK', deltaMs: 10 * SECOND }).do({ type: 'START_CLOCK' });
    expect(kinds(m)).toEqual([]);
  });

  it('keeps the real score after a backwards clock correction', () => {
    // Goal at 10:00, clock corrected back to 5:00, then the goal is taken back at 6:00.
    const m = setup().do({ type: 'START_CLOCK' }).wait(10 * MINUTE).do({ type: 'GOAL', team: 'A' });
    m.do({ type: 'STOP_CLOCK' }).do({ type: 'SET_CLOCK', gameMs: 5 * MINUTE }).do({ type: 'START_CLOCK' });
    m.wait(MINUTE).do({ type: 'REMOVE_GOAL', team: 'A' }).do({ type: 'END_MATCH' });
    expect(m.state.teams.A.score).toBe(0);
    const t = buildTimeline(m.state);
    // Displayed by game time, but each line keeps the score it really produced.
    expect(t.map((e) => [e.kind, 'score' in e ? `${e.score.A}-${e.score.B}` : ''])).toEqual([
      ['goalRemoved', '0-0'],
      ['goal', '1-0'],
      ['fullTime', '0-0'],
    ]);
  });

  it('full time always matches the scoreboard, half-time matches the report header', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'GOAL', team: 'B' });
    m.wait(30 * MINUTE).do({ type: 'GOAL', team: 'A' }); // late entry during the break
    m.do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'GOAL', team: 'B' }).do({ type: 'END_MATCH' });
    const t = buildTimeline(m.state);
    expect(t.find((e) => e.kind === 'halfTime')).toMatchObject({ score: halfTimeScore(m.state) });
    expect(t.at(-1)).toMatchObject({ kind: 'fullTime', score: { A: m.state.teams.A.score, B: m.state.teams.B.score } });
  });

  it('hides a return time that falls after the end of the match', () => {
    const m = setup().do({ type: 'START_CLOCK' }).wait(30 * MINUTE).do({ type: 'START_CLOCK' }).wait(29 * MINUTE);
    m.do({ type: 'ADD_SUSPENSION', team: 'A', shirt: 5 }).wait(2 * MINUTE); // match ends at 60:00
    const s = buildTimeline(m.state).find((e) => e.kind === 'suspension');
    expect(s).toMatchObject({ gameMs: 59 * MINUTE });
    expect(s).not.toHaveProperty('returnMs');
    // A suspension that ends before full time keeps its return time.
    const early = setup().do({ type: 'START_CLOCK' }).wait(MINUTE).do({ type: 'ADD_SUSPENSION', team: 'B' });
    expect(buildTimeline(early.state)[0]).toMatchObject({ kind: 'suspension', returnMs: 3 * MINUTE });
  });

  it('works for matches saved before redo existed', () => {
    const m = setup().do({ type: 'GOAL', team: 'B' });
    const { redo: _gone, ...old } = m.state;
    expect(buildTimeline(old).map((e) => e.kind)).toEqual(['goal']);
  });
});
