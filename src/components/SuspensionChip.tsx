import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCountdown, isFlashing, type Suspension } from '../logic';
import { font, paint, tabular } from '../theme';

interface Props {
  suspension: Suspension;
  remainingMs: number;
  now: number;
  onDelete: (id: string) => void;
  /** Ended chip tapped: the official confirms seeing it, the chip goes away. */
  onAcknowledge: (id: string) => void;
}

/**
 * "#7 1:34" painted on the wall colour. When it runs out it vibrates, flashes
 * amber and reads "IN" (the player may return), and KEEPS flashing until the
 * official taps it to confirm they saw it. Tapping a running chip offers
 * delete, for one entered by mistake.
 */
export function SuspensionChip({ suspension, remainingMs, now, onDelete, onAcknowledge }: Props) {
  const ended = isFlashing(suspension);
  const flashOn = ended && Math.floor(now / 300) % 2 === 0;
  const who = suspension.shirt !== undefined ? `#${suspension.shirt}` : 'No #';

  const confirmDelete = () =>
    Alert.alert(`Delete suspension ${who}?`, 'Only for a suspension entered by mistake. You can undo this.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(suspension.id) },
    ]);

  return (
    <Pressable
      onPress={ended ? () => onAcknowledge(suspension.id) : confirmDelete}
      accessibilityRole="button"
      accessibilityLabel={ended ? `Suspension ${who} over, player may return` : `Suspension ${who}, ${formatCountdown(remainingMs)} left`}
      accessibilityHint={ended ? 'Tap to confirm you saw it' : 'Tap to delete'}
      style={({ pressed }) => [styles.chip, ended && styles.ended, flashOn && styles.flash, pressed && styles.pressed]}
    >
      <Text style={[styles.who, flashOn && styles.dark, suspension.shirt === undefined && styles.noShirt]}>{who}</Text>
      {ended ? (
        <View style={styles.inRow}>
          <Text style={[styles.time, flashOn && styles.dark]}>IN</Text>
          <Ionicons name="checkmark-circle" size={22} color={flashOn ? paint.onStop : paint.stop} />
        </View>
      ) : (
        <Text style={[styles.time, flashOn && styles.dark]}>{formatCountdown(remainingMs)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    minWidth: 86,
    flexGrow: 1,
    backgroundColor: paint.wall,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ended: { borderColor: paint.stop },
  flash: { backgroundColor: paint.stop },
  pressed: { opacity: 0.75 },
  who: { color: paint.stop, fontFamily: font.numeral, fontSize: 22, ...tabular },
  noShirt: { fontSize: 15, letterSpacing: 1 },
  time: { color: paint.bone, fontFamily: font.numeral, fontSize: 24, ...tabular },
  dark: { color: paint.onStop },
  inRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
