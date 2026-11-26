import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatClock,
  formatCountdown,
  TIMEOUT_WARNING_BEFORE_END_MS,
  timeoutElapsed,
  timeoutRemaining,
  type ActiveTimeout,
  type Team,
} from '../logic';
import { caps, fitNumeral, font, paint, tabular, textOn } from '../theme';

interface Props {
  timeout: ActiveTimeout | null;
  team: Team | null;
  now: number;
  /** One-beat inversion when a signal vibrates. */
  inverted?: boolean;
  onStartClock: () => void;
  onClose: () => void;
}

/**
 * Full-screen team timeout in the team's paint, counting down 1:00 → 0:00.
 * Warning signal 10 s before the end, end signal at 0:00. It then stays open
 * ("time is up +0:07") until the clock is restarted on the whistle.
 */
export function TimeoutOverlay({ timeout, team, now, inverted, onStartClock, onClose }: Props) {
  const { width } = useWindowDimensions();
  const visible = !!timeout && !!team;
  const elapsed = timeout ? timeoutElapsed(timeout, now) : 0;
  const remaining = timeout ? timeoutRemaining(timeout, now) : 0;
  const length = timeout?.durationMs ?? 60_000;
  const over = elapsed >= length;
  const warning = !over && elapsed >= length - TIMEOUT_WARNING_BEFORE_END_MS;

  // Past its length the whole screen repaints: overtime is its own state. Warning red,
  // unless the team already wears red, then stencil white with red ink so the change still reads.
  const teamColor = team?.color ?? paint.wall;
  const redTeam = isNear(teamColor, paint.alert);
  const ground = over ? (redTeam ? paint.bone : paint.alert) : teamColor;
  const ink = over ? (redTeam ? paint.alert : paint.onAlert) : textOn(ground);
  const statusBandColor = over ? (redTeam ? paint.alert : paint.bone) : paint.stop;
  const statusInk = over ? (redTeam ? paint.onAlert : paint.alert) : paint.onStop;
  const bg = inverted ? ink : ground;
  const fg = inverted ? ground : ink;
  // The bar empties as the countdown runs.
  const progress = Math.max(0, 1 - elapsed / length);

  const overBy = Math.max(0, elapsed - length);
  const status = over
    ? `Time is up +${formatClock(overBy)}`
    : warning
      ? `Warning · ${formatCountdown(length - elapsed)} left`
      : `${formatClock(length)} timeout`;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait']}>
      <View style={[styles.root, { backgroundColor: bg }]}>
        <SafeAreaView style={styles.flex} edges={['top']}>
          <View style={styles.head}>
            <Text style={[styles.team, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">
              {team?.name} · Timeout
            </Text>
          </View>
          <View style={styles.center} accessibilityLiveRegion="polite">
            <Text
              style={[styles.time, { color: fg, fontSize: fitNumeral(formatCountdown(remaining), 210, width - 40) }]}
              numberOfLines={1}
              accessibilityLabel={`Timeout ${formatCountdown(remaining)} left. ${status}`}
            >
              {formatCountdown(remaining)}
            </Text>
            {over ? null : (
              <View style={[styles.track, { backgroundColor: paint.scrim }]}>
                <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: fg }]} />
              </View>
            )}
            {warning || over ? (
              // Full-bleed status band: amber for the warning, bone on red once time is up.
              <View style={[styles.statusBand, { backgroundColor: statusBandColor }]}>
                <Text style={[caps(26, statusInk), tabular]}>{status}</Text>
              </View>
            ) : (
              <Text style={[caps(18, fg), styles.status]}>{status}</Text>
            )}
          </View>
          <Text style={[styles.hint, { color: fg }, over && styles.hintLarge]}>The game clock is stopped. Start it on the referee's whistle.</Text>
        </SafeAreaView>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close timeout without starting the clock"
          style={({ pressed }) => [styles.closeBand, pressed && styles.closePressed]}
        >
          <Ionicons name="close" size={22} color={paint.bone} />
          <Text style={caps(17, paint.bone)}>Close timeout</Text>
        </Pressable>
        <Pressable
          onPress={onStartClock}
          accessibilityRole="button"
          accessibilityLabel="Start game clock"
          style={({ pressed }) => [styles.startStripe, pressed && { opacity: 0.85 }]}
        >
          <SafeAreaView edges={['bottom']} style={styles.startInner}>
            <Ionicons name="play" size={34} color={paint.onRun} />
            <Text style={styles.startWord}>Start clock</Text>
          </SafeAreaView>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, paddingHorizontal: 20 },
  head: { paddingTop: 16, gap: 2 },
  team: { fontFamily: font.numeral, fontSize: 44, letterSpacing: 1, textTransform: 'uppercase' },
  center: { flex: 1, justifyContent: 'center' },
  time: { fontFamily: font.numeral, letterSpacing: -2, includeFontPadding: false, ...tabular },
  track: { height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%', borderRadius: 5 },
  status: { marginTop: 12 },
  statusBand: { marginTop: 14, marginHorizontal: -20, paddingHorizontal: 20, minHeight: 64, justifyContent: 'center' },
  hint: { fontSize: 15, fontWeight: '600', paddingBottom: 16 },
  // Large text (≥ 14 pt bold) so white on warning red clears 3:1.
  hintLarge: { fontSize: 19, fontWeight: '700' },
  closeBand: { height: 64, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  closePressed: { backgroundColor: 'rgba(0,0,0,0.6)' },
  startStripe: { backgroundColor: paint.run },
  startInner: { minHeight: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startWord: { color: paint.onRun, fontFamily: font.numeral, fontSize: 44, letterSpacing: 2, textTransform: 'uppercase' },
});

/** True when two #RRGGBB colours are close enough to read as the same paint. */
function isNear(a: string, b: string): boolean {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return false;
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 90;
}
