import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/barlow-condensed';
import { Stack } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMatchTicker } from '../hooks/useMatchTicker';
import { useMatchStore } from '../store/matchStore';
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
  const hydrated = useMatchStore((s) => s.hydrated);
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
