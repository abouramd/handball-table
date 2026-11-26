import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatClock } from '../logic';
import { caps, font, paint, RADIUS, tabular, TOUCH } from '../theme';
import { BigButton } from './ui/BigButton';

interface Props {
  visible: boolean;
  gameMs: number;
  running: boolean;
  /** e.g. "1st half · 0:00 – 30:00" */
  rangeLabel: string;
  onAdjust: (deltaMs: number) => void;
  onSet: (gameMs: number) => void;
  onClose: () => void;
}

const STEPS = [
  { label: '1 min', ms: 60_000 },
  { label: '10 s', ms: 10_000 },
  { label: '1 s', ms: 1_000 },
];

/** Manual time correction. Every change is logged and can be undone. */
export function ClockAdjustSheet({ visible, gameMs, running, rangeLabel, onAdjust, onSet, onClose }: Props) {
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  useEffect(() => {
    if (visible) {
      setMin('');
      setSec('');
    }
  }, [visible]);

  const canSet = min !== '' || sec !== '';
  const exactMs = (Number(min) || 0) * 60_000 + Math.min(59, Number(sec) || 0) * 1_000;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} supportedOrientations={['portrait']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={styles.headRow}>
            <Text style={caps(16, paint.bone)}>Correct game clock</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} style={styles.close}>
              <Ionicons name="close" size={28} color={paint.bone} />
            </Pressable>
          </View>

          <Text style={styles.time} accessibilityLiveRegion="polite">
            {formatClock(gameMs)}
          </Text>
          <Text style={[caps(13), styles.center]}>
            {running ? 'Clock running' : 'Clock stopped'} · {rangeLabel}
          </Text>

          <View style={styles.grid}>
            {STEPS.map((s) => (
              <View key={s.label} style={styles.pair}>
                <BigButton label={`− ${s.label}`} onPress={() => onAdjust(-s.ms)} style={styles.flex} />
                <BigButton label={`+ ${s.label}`} onPress={() => onAdjust(s.ms)} style={styles.flex} />
              </View>
            ))}
          </View>

          <Text style={[caps(14), styles.section]}>Set exact time</Text>
          <View style={styles.exact}>
            <TextInput
              value={min}
              onChangeText={(t) => setMin(t.replace(/\D/g, '').slice(0, 2))}
              placeholder="mm"
              placeholderTextColor={paint.boneMuted}
              keyboardType="number-pad"
              selectionColor={paint.stop}
              style={styles.input}
              accessibilityLabel="Minutes"
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              value={sec}
              onChangeText={(t) => setSec(t.replace(/\D/g, '').slice(0, 2))}
              placeholder="ss"
              placeholderTextColor={paint.boneMuted}
              keyboardType="number-pad"
              selectionColor={paint.stop}
              style={styles.input}
              accessibilityLabel="Seconds"
            />
            <BigButton
              label="Set"
              color={paint.stop}
              disabled={!canSet}
              onPress={() => {
                onSet(exactMs);
                setMin('');
                setSec('');
              }}
              style={styles.flex}
            />
          </View>

          <View style={styles.flex} />
          <Text style={[styles.note]}>Corrections appear in Undo.</Text>
          <BigButton label="Done" size="lg" color={paint.bone} onPress={onClose} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: paint.wall },
  flex: { flex: 1 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, paddingHorizontal: 16 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  time: { color: paint.bone, fontFamily: font.numeral, fontSize: 120, lineHeight: 122, textAlign: 'center', includeFontPadding: false, ...tabular },
  center: { textAlign: 'center' },
  grid: { gap: 8, marginTop: 20, paddingHorizontal: 16 },
  pair: { flexDirection: 'row', gap: 8 },
  section: { marginTop: 24, marginBottom: 8, paddingHorizontal: 16 },
  exact: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 16 },
  input: {
    width: 84,
    height: TOUCH,
    borderRadius: RADIUS,
    backgroundColor: paint.band,
    color: paint.bone,
    fontFamily: font.numeral,
    fontSize: 32,
    textAlign: 'center',
  },
  colon: { color: paint.bone, fontFamily: font.numeral, fontSize: 32 },
  note: { color: paint.boneMuted, fontSize: 14, textAlign: 'center', marginBottom: 8 },
});
