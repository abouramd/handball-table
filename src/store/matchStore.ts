import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createMatch, reduce, type MatchAction, type MatchState, type NewMatchParams } from '../logic';
import { vibrate } from '../services/haptics';

/** Any match action without `now`: the store stamps it with Date.now(). */
export type MatchCommand = MatchAction extends infer A ? (A extends MatchAction ? Omit<A, 'now'> : never) : never;

interface MatchStore {
  match: MatchState | null;
  /** True once the saved match has been loaded from storage. */
  hydrated: boolean;
  /** Wall time of the last vibration (not persisted): the UI flashes its visual twin. */
  lastAlertAt: number;
  dispatch: (command: MatchCommand) => void;
  startNewMatch: (params: Omit<NewMatchParams, 'id' | 'now'>) => void;
  clearMatch: () => void;
}

/**
 * Thin wrapper around the pure reducer. The full match state is persisted to
 * AsyncStorage on every change, so a crash, app kill or phone lock never loses
 * the match. Because all times are timestamps, restoring it later gives the
 * correct clock values.
 */
export const useMatchStore = create<MatchStore>()(
  persist(
    (set, get) => ({
      match: null,
      hydrated: false,
      lastAlertAt: 0,
      dispatch: (command) => {
        const { match } = get();
        if (!match) return;
        const { state, alerts } = reduce(match, { ...command, now: Date.now() } as MatchAction);
        if (state !== match) set({ match: state });
        // Several alerts at once (e.g. resumed late): the strongest wins.
        if (alerts.length > 0) {
          set({ lastAlertAt: Date.now() });
          const order = ['long', 'doubleShort', 'short'] as const;
          vibrate(order.find((p) => alerts.some((a) => a.pattern === p))!);
        }
      },
      startNewMatch: (params) => {
        const now = Date.now();
        set({ match: createMatch({ ...params, id: `m${now}`, now }) });
      },
      clearMatch: () => set({ match: null }),
    }),
    {
      name: 'handball-table/match',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ match: s.match }),
      onRehydrateStorage: () => () => useMatchStore.setState({ hydrated: true }),
    },
  ),
);
