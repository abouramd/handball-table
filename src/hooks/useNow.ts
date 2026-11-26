import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Current wall time, refreshed every `intervalMs`, and immediately when the
 * app returns to the foreground. Only triggers re-renders: all time values
 * are computed from timestamps, so a late or skipped refresh never causes drift.
 */
export function useNow(intervalMs = 200): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(Date.now()));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [intervalMs]);
  return now;
}
