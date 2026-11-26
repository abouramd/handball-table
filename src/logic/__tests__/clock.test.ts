import { clockElapsed, initialClock, setClockTime, startClock, stopClock } from '../clock';
import { formatClock, formatCountdown } from '../format';

describe('clock math', () => {
  it('computes elapsed from timestamps, not ticks', () => {
    let c = startClock(initialClock(), 1000);
    expect(clockElapsed(c, 1000)).toBe(0);
    expect(clockElapsed(c, 61_000)).toBe(60_000);
    c = stopClock(c, 11_000);
    expect(c).toEqual({ accumulatedMs: 10_000, runningSince: null });
    // Stopped: wall time passing does not change it.
    expect(clockElapsed(c, 999_999)).toBe(10_000);
  });

  it('accumulates across multiple start/stop cycles', () => {
    let c = initialClock();
    c = stopClock(startClock(c, 0), 5_000);
    c = stopClock(startClock(c, 100_000), 103_000);
    expect(clockElapsed(c, 200_000)).toBe(8_000);
  });

  it('start and stop are idempotent', () => {
    const c = startClock(initialClock(), 0);
    expect(startClock(c, 500)).toBe(c);
    const s = stopClock(c, 1000);
    expect(stopClock(s, 2000)).toBe(s);
  });

  it('clamps to a maximum', () => {
    const c = startClock(initialClock(), 0);
    expect(clockElapsed(c, 50_000, 30_000)).toBe(30_000);
    expect(stopClock(c, 50_000, 30_000).accumulatedMs).toBe(30_000);
  });

  it('setClockTime keeps the running state', () => {
    const running = setClockTime(startClock(initialClock(), 0), 42_000, 10_000);
    expect(clockElapsed(running, 12_000)).toBe(44_000);
    const stopped = setClockTime(initialClock(), 42_000, 10_000);
    expect(clockElapsed(stopped, 99_000)).toBe(42_000);
  });
});

describe('formatting', () => {
  it('formats count-up time by flooring', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(59_999)).toBe('0:59');
    expect(formatClock(30 * 60_000)).toBe('30:00');
    expect(formatClock(60 * 60_000)).toBe('60:00');
  });

  it('formats countdowns by ceiling', () => {
    expect(formatCountdown(60_000)).toBe('1:00');
    expect(formatCountdown(59_001)).toBe('1:00');
    expect(formatCountdown(59_000)).toBe('0:59');
    expect(formatCountdown(94_000)).toBe('1:34');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-5)).toBe('0:00');
  });
});
