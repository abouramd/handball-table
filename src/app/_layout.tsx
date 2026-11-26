import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/barlow-condensed';
import { Stack } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMatchTicker } from '../hooks/useMatchTicker';
import { useHistoryStore } from '../store/historyStore';
import { useMatchStore } from '../store/matchStore';
import { useSettingsStore } from '../store/settingsStore';
import { font, paint } from '../theme';

/** Keeps the screen on; mounted only while a match is open. */
function KeepAwake() {
  useKeepAwake('handball-match');
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  const matchHydrated = useMatchStore((s) => s.hydrated);
  const historyHydrated = useHistoryStore((s) => s.hydrated);
  // Importing the settings store here also starts loading the saved defaults at
  // app start, instead of only when the setup screen is first opened.
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const hydrated = matchHydrated && historyHydrated && settingsHydrated;

  // One-time move: a finished match saved before the history existed joins the list.
  useEffect(() => {
    if (!hydrated) return;
    const { match } = useMatchStore.getState();
    const history = useHistoryStore.getState();
    if (match?.phase === 'ENDED' && !history.matches.some((m) => m.id === match.id)) history.add(match);
  }, [hydrated]);
  const matchOpen = useMatchStore((s) => s.match !== null && s.match.phase !== 'ENDED');

  // Time-driven rules run on every screen while a match is open, even before
  // fonts finish loading, so no signal is ever late.
  useMatchTicker(hydrated && matchOpen);

  // A font failure falls back to the system face rather than blocking the match.
  const ready = hydrated && (fontsLoaded || !!fontError);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {matchOpen ? <KeepAwake /> : null}
      {ready ? (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: paint.wall },
            headerTintColor: paint.bone,
            headerTitleStyle: { fontFamily: font.display, fontSize: 22 },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: paint.wall },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="setup" options={{ title: 'NEW MATCH' }} />
          <Stack.Screen name="match" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="summary" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
      ) : (
        <View style={{ flex: 1, backgroundColor: paint.wall }} />
      )}
    </SafeAreaProvider>
  );
}
