import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../components/ui/BigButton';
import { useNow } from '../hooks/useNow';
import { formatClock, gameTime, phaseLabel, type MatchState } from '../logic';
import { useMatchStore } from '../store/matchStore';
import { caps, font, paint, tabular, textOn } from '../theme';

export default function Home() {
  const match = useMatchStore((s) => s.match);
  const inProgress = !!match && match.phase !== 'ENDED';

  const newMatch = () => {
    if (!inProgress) return router.push('/setup');
    Alert.alert('Start a new match?', 'The match in progress will be discarded.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New match', style: 'destructive', onPress: () => router.push('/setup') },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.title}>
        <Text style={styles.wordmark}>Handball</Text>
        <Text style={[styles.wordmark, styles.wordmarkSecond]}>Table</Text>
        <Text style={styles.tagline}>Clock, score, timeouts and suspensions for the officials' table.</Text>
      </View>

      <View style={styles.spacer} />

      {inProgress && match ? <ResumeBand match={match} /> : null}

      {/* Square-cut bands butted into the wall stack, never floating tiles. */}
      <View style={styles.actions}>
        {match?.phase === 'ENDED' ? (
          <BigButton label="Last match report" icon="document-text-outline" square onPress={() => router.push('/summary')} />
        ) : null}
        <BigButton
          label="New match"
          icon="add"
          size={inProgress ? 'md' : 'lg'}
          square
          color={inProgress ? paint.band : paint.run}
          onPress={newMatch}
        />
      </View>
    </SafeAreaView>
  );
}

/** The paused match as two team bands; the whole thing is the resume control. */
function ResumeBand({ match }: { match: MatchState }) {
  const now = useNow(500);
  return (
    <Pressable
      onPress={() => router.push('/match')}
      accessibilityRole="button"
      accessibilityLabel={`Resume match in progress. ${match.teams.A.name} ${match.teams.A.score}, ${match.teams.B.name} ${match.teams.B.score}. ${phaseLabel(match.phase)}, ${formatClock(gameTime(match, now))}`}
      style={({ pressed }) => [styles.resume, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.resumeHead}>
        <Text style={[caps(15, paint.bone), tabular]}>
          {phaseLabel(match.phase)} · {formatClock(gameTime(match, now))}
        </Text>
      </View>
      <View style={styles.resumeTeams}>
        {(['A', 'B'] as const).map((id) => {
          const t = match.teams[id];
          const fg = textOn(t.color);
          return (
            <View key={id} style={[styles.resumeTeam, { backgroundColor: t.color }]}>
              <Text style={caps(15, fg)} numberOfLines={1}>
                {t.name}
              </Text>
              <Text style={[styles.resumeScore, { color: fg }]}>{t.score}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.resumeStripe}>
        <Ionicons name="play" size={26} color={paint.onRun} />
        <Text style={styles.resumeWord}>Resume match</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: paint.wall },
  title: { paddingHorizontal: 20, paddingTop: 40 },
  wordmark: { color: paint.bone, fontFamily: font.numeral, fontSize: 84, lineHeight: 78, letterSpacing: 1, textTransform: 'uppercase' },
  wordmarkSecond: { color: paint.stop },
  tagline: { color: paint.boneMuted, fontSize: 17, lineHeight: 24, marginTop: 16, maxWidth: 300 },
  spacer: { flex: 1 },
  resume: {},
  resumeHead: { paddingHorizontal: 20, paddingBottom: 8 },
  resumeTeams: { flexDirection: 'row' },
  resumeTeam: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  resumeScore: { fontFamily: font.numeral, fontSize: 64, lineHeight: 66, includeFontPadding: false, ...tabular },
  resumeStripe: { height: 76, backgroundColor: paint.run, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  resumeWord: { color: paint.onRun, fontFamily: font.numeral, fontSize: 34, letterSpacing: 2, textTransform: 'uppercase' },
  actions: {},
});
