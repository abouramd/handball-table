import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TEAM_COLORS } from '../../logic';
import { font, paint, textOn } from '../../theme';

interface Props {
  value: string;
  onChange: (c: string) => void;
  /** Colour used by the other team: marked, still selectable. */
  taken?: string;
}

const NAMES: Record<string, string> = {
  '#D32F2F': 'Red',
  '#1565C0': 'Blue',
  '#2E7D32': 'Green',
  '#F9A825': 'Yellow',
  '#6A1B9A': 'Purple',
  '#EF6C00': 'Orange',
  '#00838F': 'Teal',
  '#424242': 'Grey',
};

/** Eight paint swatches in two rows of four. */
export function ColorPicker({ value, onChange, taken }: Props) {
  return (
    <View style={styles.grid}>
      {TEAM_COLORS.map((c) => {
        const selected = c === value;
        const fg = textOn(c);
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            accessibilityRole="radio"
            accessibilityLabel={`${NAMES[c] ?? c}${c === taken ? ', used by the other team' : ''}`}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.swatch, { backgroundColor: c, opacity: pressed ? 0.8 : 1 }, selected && styles.selected]}
          >
            {selected ? <Ionicons name="checkmark" size={30} color={fg} /> : null}
            {!selected && c === taken ? <Text style={[styles.taken, { color: fg }]}>OTHER</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: {
    flexBasis: '21%',
    flexGrow: 1,
    height: 64,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: { borderColor: paint.bone },
  taken: { fontFamily: font.display, fontSize: 13, letterSpacing: 1.5, opacity: 0.85 },
});
