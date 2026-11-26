import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, paint, RADIUS, tabular, TOUCH } from '../../theme';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
}

/** − value + row with large painted keys. */
export function Stepper({ label, value, onChange, min, max, step, format = String }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Key icon="remove" label={`Decrease ${label}`} disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} />
        <Text style={styles.value} accessibilityLabel={`${label} ${format(value)}`}>
          {format(value)}
        </Text>
        <Key icon="add" label={`Increase ${label}`} disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} />
      </View>
    </View>
  );
}

function Key({ icon, onPress, disabled, label }: { icon: 'add' | 'remove'; onPress: () => void; disabled: boolean; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed, disabled && styles.keyDisabled]}
    >
      <Ionicons name={icon} size={28} color={paint.bone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: TOUCH + 8 },
  label: { color: paint.bone, fontSize: 17, fontWeight: '600', flex: 1, paddingRight: 8 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  key: { width: TOUCH, height: TOUCH, borderRadius: RADIUS, backgroundColor: paint.band, alignItems: 'center', justifyContent: 'center' },
  keyPressed: { backgroundColor: paint.bandHigh },
  keyDisabled: { opacity: 0.35 },
  value: { color: paint.bone, fontFamily: font.numeral, fontSize: 30, minWidth: 76, textAlign: 'center', ...tabular },
});
