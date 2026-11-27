import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildTimeline, formatClock, halfTimeScore, matchDate, suspensionEvents, timeoutEvents, type Half, type MatchState, type TeamId } from '../logic';
import { hasTimelineEvents, MatchTimeline, TimelineHeader } from '../components/MatchTimeline';
import { MatchShareCard } from '../components/MatchShareCard';
import { Segmented } from '../components/ui/Segmented';
import { useShareMatchImage } from '../hooks/useShareMatchImage';
import { useHistoryStore } from '../store/historyStore';
import { useMatchStore } from '../store/matchStore';
import { caps, font, paint, tabular, textOn } from '../theme';

const halfName = (h: Half) => (h === 1 ? '1st half' : '2nd half');

export default function Summary() {
  // With ?id= it shows a match from the history; without, the match that just ended.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const current = useMatchStore((s) => s.match);
  const clearMatch = useMatchStore((s) => s.clearMatch);
  const saved = useHistoryStore((s) => (id ? s.matches.find((m) => m.id === id) : undefined));
  const removeFromHistory = useHistoryStore((s) => s.remove);
  const match = id ? saved : current;
  const [tab, setTab] = useState<'report' | 'timeline'>('report');
  const { available: canShare, sharing, share, cardRef } = useShareMatchImage();

  useEffect(() => {
    if (!match) router.replace('/');
  }, [match]);
  if (!match) return null;

  const ht = halfTimeScore(match);
  const timeline = tab === 'timeline' ? buildTimeline(match) : [];
  const pinHeader = hasTimelineEvents(timeline);
  const date = matchDate(match);
  const shortDate = new Date(match.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  const deleteMatch = () =>
    Alert.alert(
      'Delete this match?',
      `${match.teams.A.name} ${match.teams.A.score} – ${match.teams.B.score} ${match.teams.B.name}, ${date}. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            router.dismissTo('/');
            removeFromHistory(match.id);
            if (current?.id === match.id) clearMatch();
          },
        },
      ],
    );

  return (
    <View style={styles.root}>
      {/* Child 3 is the timeline's team header: pinned while the timeline scrolls. */}
      <ScrollView contentContainerStyle={styles.content} stickyHeaderIndices={pinHeader ? [3] : undefined}>
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
          <Text style={[caps(15), tabular, styles.meta]} numberOfLines={1} adjustsFontSizeToFit>
            Half-time {ht.A}–{ht.B} · {shortDate}
          </Text>
        </View>

        <View style={styles.tabs}>
          <Segmented<'report' | 'timeline'>
            accessibilityLabel="Match details"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'report', label: 'Report' },
              { value: 'timeline', label: 'Timeline' },
            ]}
          />
        </View>

        {pinHeader ? <TimelineHeader match={match} /> : null}
        {tab === 'report' ? (
          <View>
            {(['A', 'B'] as const).map((id) => (
              <TeamReport key={id} match={match} team={id} />
            ))}
          </View>
        ) : (
          <MatchTimeline match={match} entries={timeline} />
        )}

        {/* Rare and destructive: at the end of the report, behind a confirm. */}
        <Pressable
          onPress={deleteMatch}
          accessibilityRole="button"
          accessibilityLabel="Delete this match"
          style={({ pressed }) => [styles.deleteBand, pressed && { backgroundColor: paint.bandHigh }]}
        >
          <Ionicons name="trash-outline" size={20} color={paint.alert} />
          <Text style={caps(15, paint.alert)}>Delete this match</Text>
        </Pressable>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <IconKey icon="home-outline" label="Home" onPress={() => router.dismissTo('/')} />
        {canShare ? (
          <IconKey icon="share-social-outline" label="Share match as image" busy={sharing} onPress={share} />
        ) : null}
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

      {/* Drawn off-screen only while an image is being made. */}
      {sharing ? (
        <View style={styles.offscreen} pointerEvents="none">
          <MatchShareCard ref={cardRef} match={match} />
        </View>
      ) : null}
    </View>
  );
}

/** Compact icon key for the footer's secondary actions. */
function IconKey({
  icon,
  label,
  busy,
  onPress,
}: {
  icon: 'home-outline' | 'share-social-outline';
  label: string;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
      style={({ pressed }) => [styles.iconKey, (pressed || busy) && { backgroundColor: paint.bandHigh }]}
    >
      {busy ? <ActivityIndicator color={paint.bone} /> : <Ionicons name={icon} size={26} color={paint.bone} />}
    </Pressable>
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
  report: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 16 },
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
  meta: { flexShrink: 1, marginLeft: 12, textAlign: 'right' },
  tabs: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16 },
  deleteBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 64,
    marginTop: 32,
    backgroundColor: paint.band,
  },
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  iconKey: { width: 64, minHeight: 76, borderRadius: 12, backgroundColor: paint.band, alignItems: 'center', justifyContent: 'center' },
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
