import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, TEAM_COLORS, type Settings } from '../logic';

export interface TeamSetup {
  name: string;
  color: string;
}

export interface SetupDefaults {
  settings: Settings;
  teamA: TeamSetup;
  teamB: TeamSetup;
}

export const FACTORY_DEFAULTS: SetupDefaults = {
  settings: DEFAULT_SETTINGS,
  teamA: { name: 'Home', color: TEAM_COLORS[0] },
  teamB: { name: 'Away', color: TEAM_COLORS[1] },
};

interface SettingsStore {
  defaults: SetupDefaults;
  saveDefaults: (d: SetupDefaults) => void;
}

/** "Save as default": the next match setup starts from these values. */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      defaults: FACTORY_DEFAULTS,
      saveDefaults: (defaults) => set({ defaults }),
    }),
    {
      name: 'handball-table/defaults',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Merge so settings added in later versions get their default values.
      merge: (persisted, current) => {
        const p = (persisted as Partial<SettingsStore> | undefined)?.defaults;
        if (!p) return current;
        return {
          ...current,
          defaults: { ...FACTORY_DEFAULTS, ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } },
        };
      },
    },
  ),
);
