import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCountdown } from '../logic';
import { caps, font, paint, RADIUS, tabular, textOn, TOUCH } from '../theme';

interface Props {
  visible: boolean;
  teamName: string;
  teamColor: string;
  suspensionLengthMs: number;
  /** shirt is undefined when skipped. */
  onSubmit: (shirt: number | undefined) => void;
  onCancel: () => void;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

/** Number pad for the optional shirt number of a suspended player. */
export function ShirtNumberPad({ visible, teamName, teamColor, suspensionLengthMs, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (visible) setValue('');
  }, [visible]);

  const add = (d: string) => setValue((v) => (v.length >= 3 ? v : v + d));
  const fg = textOn(teamColor);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel} supportedOrientations={['portrait']}>
      <View style={styles.root}>
        <View style={[styles.head, { backgroundColor: teamColor }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headRow}>
              <Text style={caps(16, fg)}>
                {formatCountdown(suspensionLengthMs)} suspension · {teamName}
              </Text>
              <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={12} style={styles.close}>
                <Ionicons name="close" size={28} color={fg} />
              </Pressable>
            </View>
            <Text style={[styles.display, { color: fg }]} accessibilityLabel={value ? `Shirt number ${value}` : 'No shirt number yet'}>
              <Text style={{ opacity: 0.55 }}>#</Text>
              {value || <Text style={{ opacity: 0.35 }}>—</Text>}
            </Text>
          </SafeAreaView>
        </View>

        <View style={styles.pad}>
          {ROWS.map((row) => (
            <View key={row[0]} style={styles.padRow}>
              {row.map((d) => (
                <Key key={d} label={d} onPress={() => add(d)} />
              ))}
            </View>
          ))}
          <View style={styles.padRow}>
            <Key icon="backspace-outline" label="Delete digit" onPress={() => setValue((v) => v.slice(0, -1))} />
            <Key label="0" onPress={() => add('0')} />
            <Key icon="checkmark" label="Add suspension" primary onPress={() => onSubmit(value === '' ? undefined : Number(value))} />
          </View>
        </View>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Pressable
            onPress={() => onSubmit(undefined)}
            accessibilityRole="button"
            accessibilityLabel="Add suspension without a shirt number"
            style={({ pressed }) => [styles.skip, pressed && styles.keyPressed]}
          >
            <Text style={caps(19, paint.bone)}>No number · add now</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Key({
  label,
  icon,
  primary,
  onPress,
}: {
  label: string;
  icon?: 'backspace-outline' | 'checkmark';
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.key, primary && styles.primary, pressed && (primary ? styles.primaryPressed : styles.keyPressed)]}
    >
      {icon ? (
        <Ionicons name={icon} size={34} color={primary ? paint.onRun : paint.bone} />
      ) : (
        <Text style={styles.keyText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: paint.wall },
  head: { paddingHorizontal: 20, paddingBottom: 8 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 56 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  display: { fontFamily: font.numeral, fontSize: 96, lineHeight: 100, includeFontPadding: false, ...tabular },
  // Four rows share the free height: keys grow on tall phones, never below the touch target.
  pad: { flex: 1, gap: 8, padding: 12, justifyContent: 'center' },
  padRow: { flex: 1, maxHeight: 96, minHeight: TOUCH, flexDirection: 'row', gap: 8 },
  key: {
    flex: 1,
    borderRadius: RADIUS,
    backgroundColor: paint.band,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: paint.bandHigh },
  primary: { backgroundColor: paint.run },
  primaryPressed: { opacity: 0.85 },
  keyText: { color: paint.bone, fontFamily: font.numeral, fontSize: 40 },
  footer: { paddingHorizontal: 12, paddingBottom: 8 },
  skip: { minHeight: TOUCH, borderRadius: RADIUS, borderWidth: 2, borderColor: paint.line, alignItems: 'center', justifyContent: 'center' },
});
