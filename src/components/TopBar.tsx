import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, paint } from '../theme';

interface Props {
  onHome: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onEnd: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** What Undo will revert, e.g. "Goal Lions". */
  undoLabel: string;
  /** What Redo will re-apply. */
  redoLabel: string;
}

/**
 * Home · [Undo | Redo] · End. Rare actions: smaller than the match controls.
 * Undo and Redo share the one painted band, each naming what it acts on.
 */
export function TopBar({ onHome, onUndo, onRedo, onEnd, canUndo, canRedo, undoLabel, redoLabel }: Props) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onHome}
        accessibilityRole="button"
        accessibilityLabel="Home"
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={26} color={paint.bone} />
      </Pressable>

      <View style={styles.history}>
        <HistoryButton icon="arrow-undo" word="Undo" what={undoLabel} enabled={canUndo} onPress={onUndo} grow={1.35} />
        <View style={styles.divider} />
        <HistoryButton icon="arrow-redo" word="Redo" what={redoLabel} enabled={canRedo} onPress={onRedo} grow={1} />
      </View>

      <Pressable
        onPress={onEnd}
        accessibilityRole="button"
        accessibilityLabel="End match"
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}
      >
        <Ionicons name="flag" size={22} color={paint.bone} />
      </Pressable>
    </View>
  );
}

function HistoryButton({
  icon,
  word,
  what,
  enabled,
  onPress,
  grow,
}: {
  icon: 'arrow-undo' | 'arrow-redo';
  word: string;
  what: string;
  enabled: boolean;
  onPress: () => void;
  grow: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={enabled ? `${word} ${what}` : `Nothing to ${word.toLowerCase()}`}
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [styles.historyBtn, { flex: grow }, pressed && styles.pressed, !enabled && styles.disabled]}
    >
      <Ionicons name={icon} size={20} color={paint.bone} />
      <View style={styles.text}>
        <Text style={styles.word}>{word}</Text>
        <Text style={styles.what} numberOfLines={1}>
          {enabled ? what : '—'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Bare targets on the wall; the history pair is the one painted band (square-cut, like the rest of the wall).
  bar: { flexDirection: 'row', alignItems: 'stretch', height: 56 },
  side: { width: 56, alignItems: 'center', justifyContent: 'center' },
  history: { flex: 1, flexDirection: 'row', backgroundColor: paint.band },
  divider: { width: 1, backgroundColor: paint.line, marginVertical: 10 },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, minWidth: 64 },
  text: { flexShrink: 1 },
  word: { color: paint.bone, fontFamily: font.display, fontSize: 18, letterSpacing: 1.5, textTransform: 'uppercase' },
  what: { color: paint.boneMuted, fontSize: 12, fontWeight: '600' },
  pressed: { backgroundColor: paint.bandHigh },
  disabled: { opacity: 0.4 },
});
