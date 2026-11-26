import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addToHistory, removeFromHistory, type MatchState } from '../logic';

interface HistoryStore {
  /** Finished matches, newest first. */
  matches: MatchState[];
  hydrated: boolean;
  add: (match: MatchState) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/** Finished matches, kept on the phone (AsyncStorage) until deleted. */
export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      matches: [],
      hydrated: false,
      add: (match) => set((s) => ({ matches: addToHistory(s.matches, match) })),
      remove: (id) => set((s) => ({ matches: removeFromHistory(s.matches, id) })),
      clear: () => set({ matches: [] }),
    }),
    {
      name: 'handball-table/history',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ matches: s.matches }),
      onRehydrateStorage: () => () => useHistoryStore.setState({ hydrated: true }),
    },
  ),
);
