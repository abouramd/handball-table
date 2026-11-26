import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCountdown, halfTimeRemaining, type HalfTimeBreak } from '../logic';
import { caps, font, paint, tabular } from '../theme';

interface Props {
  halfTime: HalfTimeBreak | null;
  now: number;
  inverted?: boolean;
  onStartBreak: () => void;
  onStartSecondHalf: () => void;
}

/**
 * Half-time takes the stripe's place: an amber break band (start the
 * countdown, then watch it), and the green stripe that starts the 2nd half.
 */
export function HalfTimePanel({ halfTime, now, inverted, onStartBreak, onStartSecondHalf }: Props) {
  const remaining = halfTimeRemaining(halfTime, now);
  const over = remaining === 0;
  const flashOn = (over && Math.floor(now / 450) % 2 === 0) || inverted;

  return (
    <View>
      {remaining === null ? (
        <Pressable
          onPress={onStartBreak}
          accessibilityRole="button"
          accessibilityLabel={`Start half-time break, ${formatCountdown(halfTime?.durationMs ?? 0)}`}
          style={({ pressed }) => [styles.breakBand, pressed && styles.pressed]}
        >
          <View style={styles.row}>
            <Ionicons name="timer-outline" size={26} color={paint.stop} />
            <Text style={[caps(20, paint.stop)]}>Start break</Text>
          </View>
          <Text style={styles.breakTime}>{formatCountdown(halfTime?.durationMs ?? 0)}</Text>
        </Pressable>
      ) : (
        <View style={[styles.breakBand, flashOn && styles.breakFlash]} accessibilityLiveRegion="polite">
          <Text style={caps(18, flashOn ? paint.onStop : paint.stop)}>{over ? 'Break over' : 'Half-time break'}</Text>
          <Text style={[styles.breakTime, flashOn && { color: paint.onStop }]}>{formatCountdown(remaining)}</Text>
        </View>
      )}
      <Pressable
        onPress={onStartSecondHalf}
        accessibilityRole="button"
        accessibilityLabel="Start 2nd half"
        style={({ pressed }) => [styles.stripe, pressed && { opacity: 0.82 }]}
      >
        <Ionicons name="play" size={30} color={paint.onRun} />
        <Text style={styles.stripeWord}>Start 2nd half</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  breakBand: {
    height: 64,
    backgroundColor: paint.band,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  pressed: { backgroundColor: paint.bandHigh },
  breakFlash: { backgroundColor: paint.stop },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakTime: { color: paint.bone, fontFamily: font.numeral, fontSize: 40, ...tabular },
  stripe: { height: 84, backgroundColor: paint.run, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  stripeWord: { color: paint.onRun, fontFamily: font.numeral, fontSize: 40, letterSpacing: 2, textTransform: 'uppercase' },
});
