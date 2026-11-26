import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { formatClock } from '../logic';
import { caps, fitNumeral, font, paint, tabular } from '../theme';

interface Props {
  gameMs: number;
  label: string;
  scale: number;
  /** Long-press opens the manual time correction. */
  onLongPress?: () => void;
}

/** Clock band: the period in tracked caps, the time in stencil numerals. */
export function GameClock({ gameMs, label, scale, onLongPress }: Props) {
  const { width } = useWindowDimensions();
  const text = formatClock(gameMs);
  // Fit the widest the clock will get in this match ("00:00") so it never jumps size mid-half.
  const size = fitNumeral(text.length >= 5 ? text : '00:00', Math.round(150 * scale), width - 32);
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={`Game clock ${formatClock(gameMs)}, ${label}`}
      accessibilityHint="Long press to correct the time"
      style={({ pressed }) => [styles.band, pressed && styles.pressed]}
    >
      <View style={styles.labelRow}>
        <Text style={caps(15, paint.bone)}>{label}</Text>
        <Text style={caps(12)}>Hold to correct</Text>
      </View>
      <Text
        style={[styles.time, { fontSize: size, lineHeight: size * 0.95 }]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  band: { paddingHorizontal: 16, paddingTop: 6 },
  pressed: { backgroundColor: paint.band },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  time: { color: paint.bone, fontFamily: font.numeral, letterSpacing: -1, includeFontPadding: false, ...tabular },
});
