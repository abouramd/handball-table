import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, paint, RADIUS, tabular, TOUCH } from '../../theme';

interface Props<T extends string | number> {
  options: { value: T; label: string; caption?: string }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel?: string;
}

/** Segmented control: one painted strip, the selected segment in stencil white. */
export function Segmented<T extends string | number>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${o.label}${o.caption ? ` ${o.caption}` : ''}`}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.item, selected && styles.selected, pressed && !selected && styles.pressed]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{o.label}</Text>
            {o.caption ? <Text style={[styles.caption, selected && styles.selectedText]}>{o.caption}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: paint.band, borderRadius: RADIUS, padding: 4, gap: 4 },
  item: { flex: 1, minHeight: TOUCH, borderRadius: RADIUS - 3, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: paint.bandHigh },
  selected: { backgroundColor: paint.bone },
  text: { color: paint.bone, fontFamily: font.numeral, fontSize: 26, ...tabular },
  caption: { color: paint.boneMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: -2 },
  selectedText: { color: paint.wall },
});
