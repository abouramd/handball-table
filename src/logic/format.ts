/** Count-up display: floors to the second, e.g. 1799999 → "29:59". */
export function formatClock(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
}

/**
 * Countdown display: ceils to the second, so "1:00" shows until a full second
 * has passed and "0:00" only appears when time is really up.
 */
export function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
}
