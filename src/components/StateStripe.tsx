import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, paint } from '../theme';

export type StripeState = 'ready' | 'running' | 'stopped';

interface Props {
  state: StripeState;
  onPress: () => void;
  /** Visual twin of a vibration: the stripe inverts for one beat. */
  inverted?: boolean;
  height: number;
}

const LOOK: Record<StripeState, { bg: string; fg: string; action: string; caption: string; icon: 'play' | 'stop' }> = {
  ready: { bg: paint.bone, fg: paint.wall, action: 'Start match', caption: 'Ready', icon: 'play' },
  running: { bg: paint.run, fg: paint.onRun, action: 'Stop', caption: 'Clock running', icon: 'stop' },
  stopped: { bg: paint.stop, fg: paint.onStop, action: 'Start', caption: 'Clock stopped', icon: 'play' },
};

/**
 * The hall's dado stripe: full-width, it wears the clock's state (green running,
 * amber stopped) and is itself the start/stop control. The action word is the
 * biggest thing on it; the state is the caption.
 */
export function StateStripe({ state, onPress, inverted, height }: Props) {
  const look = LOOK[state];
  const bg = inverted ? look.fg : look.bg;
  const fg = inverted ? look.bg : look.fg;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${look.action}. ${look.caption}.`}
      style={({ pressed }) => [styles.stripe, { height, backgroundColor: bg, opacity: pressed ? 0.82 : 1 }]}
    >
      <View style={styles.action}>
        <Ionicons name={look.icon} size={height * 0.36} color={fg} />
        <Text style={[styles.word, { color: fg, fontSize: height * 0.5 }]} numberOfLines={1} adjustsFontSizeToFit>
          {look.action}
        </Text>
      </View>
      <View style={styles.captionRow}>
        <View style={[styles.dot, { backgroundColor: fg }]} />
        <Text style={[styles.caption, { color: fg }]}>{look.caption}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stripe: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  word: { fontFamily: font.numeral, letterSpacing: 2, textTransform: 'uppercase' },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  caption: { fontFamily: font.display, fontSize: 15, letterSpacing: 1.6, textTransform: 'uppercase' },
});
