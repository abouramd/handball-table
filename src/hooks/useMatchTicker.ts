import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useMatchStore } from '../store/matchStore';

/**
 * Drives time-based rules (half end, suspension expiry, timeout/half-time
 * signals) while a match is open, on every screen. Each TICK recomputes from
 * Date.now(), so it is exact even after the app was in the background.
 */
export function useMatchTicker(active: boolean, intervalMs = 200): void {
  useEffect(() => {
    if (!active) return;
    const tick = () => useMatchStore.getState().dispatch({ type: 'TICK' });
    tick();
    const id = setInterval(tick, intervalMs);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [active, intervalMs]);
}
