jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MINUTE } from '../../logic';
import { FACTORY_DEFAULTS, useSettingsStore } from '../settingsStore';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('saved defaults', () => {
  it('survive closing and reopening the app', async () => {
    await useSettingsStore.persist.rehydrate();
    const saved = {
      settings: { ...FACTORY_DEFAULTS.settings, halfLengthMs: 20 * MINUTE, timeoutsPerTeam: 2 },
      teamA: { name: 'Lions U16', color: '#2E7D32' },
      teamB: { name: 'Rovers', color: '#6A1B9A' },
    };
    useSettingsStore.getState().saveDefaults(saved);
    await flush();

    // "Close the app": wipe memory back to factory values, keep only what's on the phone.
    useSettingsStore.setState({ defaults: FACTORY_DEFAULTS, hydrated: false }, false);
    await AsyncStorage.setItem(
      'handball-table/defaults',
      JSON.stringify({ state: { defaults: saved }, version: 1 }),
    );

    // "Reopen": load from storage.
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().hydrated).toBe(true);
    expect(useSettingsStore.getState().defaults).toEqual(saved);
  });

  it('fills in settings added by a newer version and keeps "no limit" (null)', async () => {
    await AsyncStorage.setItem(
      'handball-table/defaults',
      JSON.stringify({
        state: { defaults: { teamA: FACTORY_DEFAULTS.teamA, teamB: FACTORY_DEFAULTS.teamB, settings: { halfLengthMs: 25 * MINUTE, timeoutsPerTeam: null } } },
        version: 1,
      }),
    );
    await useSettingsStore.persist.rehydrate();
    const s = useSettingsStore.getState().defaults.settings;
    expect(s.halfLengthMs).toBe(25 * MINUTE);
    expect(s.timeoutsPerTeam).toBeNull();
    expect(s.suspensionLengthMs).toBe(FACTORY_DEFAULTS.settings.suspensionLengthMs);
  });
});
