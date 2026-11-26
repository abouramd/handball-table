import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { paint, TOUCH } from '../../theme';

interface Props {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

/** Native switch; the whole row is the target, not just the small switch. */
export function ToggleRow({ label, hint, value, onChange }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value }}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: paint.run, false: paint.bandHigh }}
        thumbColor={paint.bone}
        ios_backgroundColor={paint.bandHigh}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1, paddingRight: 12 },
  label: { color: paint.bone, fontSize: 17, fontWeight: '600' },
  hint: { color: paint.boneMuted, fontSize: 14, marginTop: 2 },
});
