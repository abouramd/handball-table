import { useMatchStore } from '../store/matchStore';

/** One beat (ms) the UI stays inverted after a vibration. */
const BEAT_MS = 650;

/** True for one beat after any vibration: drives the visual twin of the alert. */
export function useAlertFlash(now: number): boolean {
  const lastAlertAt = useMatchStore((s) => s.lastAlertAt);
  return lastAlertAt > 0 && now - lastAlertAt < BEAT_MS;
}
