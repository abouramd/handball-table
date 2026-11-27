import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { buildTimeline, halfTimeScore, type MatchState } from '../logic';
import { caps, font, paint, tabular, textOn } from '../theme';
import { hasTimelineEvents, MatchTimeline, TimelineHeader } from './MatchTimeline';

/** Width the card is laid out at; captured at 1080 px wide. */
export const SHARE_CARD_WIDTH = 390;

/**
 * The match report as one picture to share: score bands, the half-time /
 * date line and the full two-sided timeline, painted like the app.
 */
export type ShareCardRef = ComponentRef<typeof View>;

export function MatchShareCard({ match, ref }: { match: MatchState; ref?: Ref<ShareCardRef> }) {
  const ht = halfTimeScore(match);
  const entries = buildTimeline(match);
  const date = new Date(match.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.scoreBands}>
        {(['A', 'B'] as const).map((id) => {
          const t = match.teams[id];
          const fg = textOn(t.color);
          return (
            <View key={id} style={[styles.scoreBand, { backgroundColor: t.color }]}>
              <Text style={caps(16, fg)} numberOfLines={2}>
                {t.name}
              </Text>
              <Text style={[styles.score, { color: fg }]}>{t.score}</Text>
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

      <View style={styles.timeline}>
        {hasTimelineEvents(entries) ? <TimelineHeader match={match} /> : null}
        <MatchTimeline match={match} entries={entries} />
      </View>

      <View style={styles.footer}>
        <Text style={caps(13)}>
          Handball <Text style={{ color: paint.stop }}>Table</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: SHARE_CARD_WIDTH, backgroundColor: paint.wall },
  scoreBands: { flexDirection: 'row' },
  scoreBand: { flex: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  score: { fontFamily: font.numeral, fontSize: 108, lineHeight: 106, includeFontPadding: false, ...tabular },
  metaBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    minHeight: 48,
    backgroundColor: paint.band,
  },
  timeline: { paddingTop: 16, paddingBottom: 8 },
  footer: { alignItems: 'center', justifyContent: 'center', minHeight: 44, backgroundColor: paint.band },
});
