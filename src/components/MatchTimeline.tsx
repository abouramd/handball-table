import { StyleSheet, Text, View } from 'react-native';
import { formatClock, type MatchState, type Score, type TeamId, type TimelineEntry } from '../logic';
import { caps, font, paint, tabular, textOn } from '../theme';

/** True when the timeline has anything besides the half-time / full-time markers. */
export const hasTimelineEvents = (entries: TimelineEntry[]) =>
  entries.some((e) => e.kind !== 'halfTime' && e.kind !== 'fullTime');

/**
 * Two-sided match timeline: home events on the left, away events on the
 * right, game time on a centre band that runs the length of the list. The
 * side says which team it was, so rows never repeat the team name; the
 * pinned header paints both teams with their names.
 */
export function MatchTimeline({ match, entries }: { match: MatchState; entries: TimelineEntry[] }) {
  if (!hasTimelineEvents(entries)) {
    return <Text style={styles.empty}>No goals, timeouts or suspensions recorded.</Text>;
  }
  return (
    <View>
      {entries.map((e) => (
        <Entry key={e.id} entry={e} match={match} />
      ))}
    </View>
  );
}

/** Team paint, names and the centre band; pinned while the timeline scrolls. */
export function TimelineHeader({ match }: { match: MatchState }) {
  const { A, B } = match.teams;
  return (
    <View style={styles.head} accessibilityRole="header" accessibilityLabel={`${A.name} on the left, ${B.name} on the right`}>
      <View style={[styles.headSide, styles.left, { backgroundColor: A.color }]}>
        <Text style={[caps(15, textOn(A.color)), styles.alignRight]} numberOfLines={3}>
          {A.name}
        </Text>
      </View>
      <View style={styles.spine}>
        <Text style={caps(12)}>Time</Text>
      </View>
      <View style={[styles.headSide, styles.right, { backgroundColor: B.color }]}>
        <Text style={caps(15, textOn(B.color))} numberOfLines={3}>
          {B.name}
        </Text>
      </View>
    </View>
  );
}

function Entry({ entry: e, match }: { entry: TimelineEntry; match: MatchState }) {
  const teams = match.teams;
  // Screen readers get both team names, never a bare "3 to 4".
  const scoreSpoken = (s: Score) => `${teams.A.name} ${s.A}, ${teams.B.name} ${s.B}`;

  if (e.kind === 'halfTime' || e.kind === 'fullTime') {
    const label = e.kind === 'halfTime' ? 'Half-time' : 'Full time';
    return (
      <View
        style={[styles.marker, e.kind === 'fullTime' && styles.markerFull]}
        accessible
        accessibilityLabel={`${label} at ${formatClock(e.gameMs)}, ${scoreSpoken(e.score)}`}
      >
        <View style={[styles.side, styles.left]}>
          <Text style={caps(16, paint.bone)}>{label}</Text>
        </View>
        <View style={styles.spineClear}>
          <Text style={styles.time}>{formatClock(e.gameMs)}</Text>
        </View>
        <View style={[styles.side, styles.right]}>
          <Text style={styles.markerScore}>
            {e.score.A}–{e.score.B}
          </Text>
        </View>
      </View>
    );
  }

  const team = teams[e.team];
  let title: string;
  let detail: string | undefined;
  let score: Score | undefined;
  let a11y: string;

  switch (e.kind) {
    case 'goal':
      title = 'Goal';
      score = e.score;
      a11y = `goal ${team.name}. ${scoreSpoken(e.score)}`;
      break;
    case 'goalRemoved':
      title = '−1 Goal';
      score = e.score;
      a11y = `goal removed from ${team.name}. ${scoreSpoken(e.score)}`;
      break;
    case 'timeout':
      title = 'Timeout';
      a11y = `timeout ${team.name}`;
      break;
    case 'suspension':
      title = 'Suspension';
      detail = [e.shirt !== undefined ? `#${e.shirt}` : null, e.returnMs !== undefined ? `back ${formatClock(e.returnMs)}` : null]
        .filter(Boolean)
        .join(' · ') || undefined;
      a11y = `suspension ${e.shirt !== undefined ? `number ${e.shirt}, ` : ''}${team.name}${
        e.returnMs !== undefined ? `, back at ${formatClock(e.returnMs)}` : ''
      }`;
      break;
  }

  const isA = e.team === 'A';
  const removed = e.kind === 'goalRemoved';
  const event = (
    <View style={[styles.event, isA ? styles.eventA : styles.eventB]}>
      <View style={[styles.eventText, isA && styles.alignEnd]}>
        <Text style={[styles.title, removed && styles.muted]}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {score ? <ScorePair score={score} scorer={e.team} muted={removed} /> : null}
    </View>
  );

  return (
    <View style={styles.row} accessible accessibilityLabel={`${formatClock(e.gameMs)}, ${a11y}`}>
      <View style={[styles.side, styles.left]}>{isA ? event : null}</View>
      <View style={styles.spine}>
        <Text style={[styles.time, e.kind !== 'goal' && styles.muted]}>{formatClock(e.gameMs)}</Text>
      </View>
      <View style={[styles.side, styles.right]}>{isA ? null : event}</View>
    </View>
  );
}

/** "7–5", home first. The side that just changed is bright, the other muted. */
function ScorePair({ score, scorer, muted }: { score: Score; scorer: TeamId; muted?: boolean }) {
  const dim = (t: TeamId) => (muted || t !== scorer ? styles.faint : undefined);
  return (
    <Text style={styles.score}>
      <Text style={dim('A')}>{score.A}</Text>
      <Text style={styles.faint}>–</Text>
      <Text style={dim('B')}>{score.B}</Text>
    </Text>
  );
}

const SPINE_W = 64;

const styles = StyleSheet.create({
  empty: { color: paint.boneMuted, fontSize: 16, paddingHorizontal: 18, paddingTop: 24 },

  head: { flexDirection: 'row', minHeight: 48, backgroundColor: paint.wall },
  headSide: { flex: 1, justifyContent: 'center', paddingVertical: 8 },
  alignRight: { textAlign: 'right' },

  row: { flexDirection: 'row', minHeight: 56 },
  side: { flex: 1, justifyContent: 'center', paddingVertical: 8 },
  left: { alignItems: 'flex-end', paddingLeft: 12, paddingRight: 14 },
  right: { alignItems: 'flex-start', paddingLeft: 14, paddingRight: 12 },
  // The centre band: one painted strip running down the list.
  spine: { width: SPINE_W, alignItems: 'center', justifyContent: 'center', backgroundColor: paint.band },
  spineClear: { width: SPINE_W, alignItems: 'center', justifyContent: 'center' },

  event: { alignItems: 'center', gap: 12 },
  eventA: { flexDirection: 'row' },
  eventB: { flexDirection: 'row-reverse' },
  eventText: { flexShrink: 1 },
  alignEnd: { alignItems: 'flex-end' },

  time: { color: paint.bone, fontFamily: font.numeral, fontSize: 20, ...tabular },
  title: { color: paint.bone, fontFamily: font.display, fontSize: 18, letterSpacing: 1.2, textTransform: 'uppercase' },
  detail: { color: paint.boneMuted, fontSize: 13, fontWeight: '600', marginTop: 1, ...tabular },
  score: { color: paint.bone, fontFamily: font.numeral, fontSize: 26, flexShrink: 0, ...tabular },
  muted: { color: paint.boneMuted },
  // The unchanged side of a score: dimmer than bone-muted so the change reads at a glance (≈3.4:1, large numerals).
  faint: { color: '#5E6A70' },

  marker: { flexDirection: 'row', minHeight: 56, backgroundColor: paint.bandHigh },
  markerFull: { minHeight: 64 },
  markerScore: { color: paint.bone, fontFamily: font.numeral, fontSize: 26, ...tabular },
});
