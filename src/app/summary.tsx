import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../components/ui/BigButton';
import { formatClock, halfTimeScore, suspensionEvents, timeoutEvents, type Half, type MatchState, type TeamId } from '../logic';
import { useMatchStore } from '../store/matchStore';
import { caps, font, paint, tabular, textOn } from '../theme';

const halfName = (h: Half) => (h === 1 ? '1st half' : '2nd half');

export default function Summary() {
  const match = useMatchStore((s) => s.match);

  useEffect(() => {
    if (!match) router.replace('/');
  }, [match]);
  if (!match) return null;

  const ht = halfTimeScore(match);
  const date = new Date(match.createdAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scoreBands}>
          {(['A', 'B'] as const).map((id) => {
            const t = match.teams[id];
            const fg = textOn(t.color);
            return (
              <View key={id} style={[styles.scoreBand, { backgroundColor: t.color }]}>
                <SafeAreaView edges={['top']}>
                  <Text style={caps(16, fg)} numberOfLines={1} adjustsFontSizeToFit>
                    {t.name}
                  </Text>
                  <Text style={[styles.score, { color: fg }]} accessibilityLabel={`${t.name} ${t.score}`}>
                    {t.score}
                  </Text>
                </SafeAreaView>
              </View>
            );
          })}
        </View>
        <View style={styles.metaBand}>
          <Text style={caps(15, paint.bone)}>Full time</Text>
          <Text style={[caps(15), tabular]}>
            Half-time {ht.A}–{ht.B} · {date}
          </Text>
        </View>

        {(['A', 'B'] as const).map((id) => (
          <TeamReport key={id} match={match} team={id} />
        ))}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <BigButton label="Home" icon="home-outline" onPress={() => router.dismissTo('/')} style={styles.home} />
        <Pressable
          onPress={() => router.replace('/setup')}
          accessibilityRole="button"
          accessibilityLabel="Set up a new match"
          style={({ pressed }) => [styles.newStripe, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="add" size={28} color={paint.onRun} />
          <Text style={styles.newWord}>New match</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

/** One team's record: timeouts and suspensions with their game time. */
function TeamReport({ match, team }: { match: MatchState; team: TeamId }) {
  const t = match.teams[team];
  const timeouts = timeoutEvents(match, team);
  const suspensions = suspensionEvents(match, team);
  return (
    <View style={styles.report}>
      <View style={styles.reportHead}>
        <View style={[styles.swatch, { backgroundColor: t.color }]} />
        <Text style={styles.reportName}>{t.name}</Text>
      </View>

      <Row
        label="Timeouts"
        value={match.settings.timeoutsPerTeam === null ? String(timeouts.length) : `${timeouts.length} of ${match.settings.timeoutsPerTeam}`}
        strong
      />
      {timeouts.map((e) => (
        <Row key={e.id} label={halfName(e.half)} value={formatClock(e.gameMs)} />
      ))}

      <Row label="Suspensions" value={String(suspensions.length)} strong />
      {suspensions.map((e) => (
        <Row key={e.id} label={e.shirt !== undefined ? `#${e.shirt}` : 'No shirt number'} value={formatClock(e.gameMs)} accent={e.shirt !== undefined} />
      ))}
    </View>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <View style={[styles.row, strong && styles.rowStrong]}>
      <Text style={[strong ? caps(15, paint.bone) : styles.rowLabel, accent && styles.accent]}>{label}</Text>
      <Text style={[strong ? styles.rowValueStrong : styles.rowValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: paint.wall },
  content: { paddingBottom: 24 },
  scoreBands: { flexDirection: 'row' },
  scoreBand: { flex: 1, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  score: { fontFamily: font.numeral, fontSize: 120, lineHeight: 118, includeFontPadding: false, ...tabular },
  metaBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    minHeight: 52,
    backgroundColor: paint.band,
  },
  report: { paddingHorizontal: 18, paddingTop: 22 },
  reportHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  swatch: { width: 14, height: 14, borderRadius: 3 },
  reportName: { color: paint.bone, fontFamily: font.numeral, fontSize: 30, textTransform: 'uppercase', letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paint.line,
    paddingLeft: 24,
  },
  rowStrong: { paddingLeft: 0, marginTop: 8 },
  rowLabel: { color: paint.boneMuted, fontSize: 16, fontWeight: '600' },
  accent: { color: paint.stop, fontFamily: font.numeral, fontSize: 22 },
  rowValue: { color: paint.bone, fontFamily: font.numeral, fontSize: 22, ...tabular },
  rowValueStrong: { color: paint.bone, fontFamily: font.numeral, fontSize: 22, ...tabular },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, backgroundColor: paint.wall },
  home: { width: 120 },
  newStripe: {
    flex: 1,
    minHeight: 76,
    borderRadius: 12,
    backgroundColor: paint.run,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  newWord: { color: paint.onRun, fontFamily: font.numeral, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase' },
});
