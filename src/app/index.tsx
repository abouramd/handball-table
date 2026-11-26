import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PastMatchRow } from '../components/PastMatchRow';
import { BigButton } from '../components/ui/BigButton';
import { useNow } from '../hooks/useNow';
import { formatClock, gameTime, phaseLabel, type MatchState } from '../logic';
import { useHistoryStore } from '../store/historyStore';
import { useMatchStore } from '../store/matchStore';
import { caps, font, paint, tabular, textOn } from '../theme';

export default function Home() {
  const match = useMatchStore((s) => s.match);
  const clearMatch = useMatchStore((s) => s.clearMatch);
  const history = useHistoryStore((s) => s.matches);
  const removeFromHistory = useHistoryStore((s) => s.remove);
  const clearHistory = useHistoryStore((s) => s.clear);
  const inProgress = !!match && match.phase !== 'ENDED';
  const hasHistory = history.length > 0;

  const newMatch = () => {
    if (!inProgress) return router.push('/setup');
    Alert.alert('Start a new match?', 'The match in progress will be discarded.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New match', style: 'destructive', onPress: () => router.push('/setup') },
    ]);
  };

  const deleteMatch = (id: string) => {
    removeFromHistory(id);
    // The just-finished match is also kept as "current"; drop it too so it can't come back.
    if (match?.id === id && match.phase === 'ENDED') clearMatch();
  };

  const deleteAll = () =>
    Alert.alert(
      `Delete all ${history.length} matches?`,
      'Every saved match report on this phone will be removed. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            if (match?.phase === 'ENDED') clearMatch();
          },
        },
      ],
    );

  const title = (
    <View style={[styles.title, hasHistory && styles.titleCompact]}>
      <Text style={[styles.wordmark, hasHistory && styles.wordmarkCompact]}>
        Handball{hasHistory ? ' ' : '\n'}
        <Text style={styles.amber}>Table</Text>
      </Text>
      {hasHistory ? null : (
        <Text style={styles.tagline}>Clock, score, timeouts and suspensions for the officials' table.</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {hasHistory ? (
        <FlatList
          data={history}
          keyExtractor={(m) => m.id}
          ListHeaderComponent={
            <>
              {title}
              <View style={styles.listHead}>
                <Text style={caps(15, paint.bone)}>
                  Past matches <Text style={[caps(15), tabular]}>{history.length}</Text>
                </Text>
                <Pressable
                  onPress={deleteAll}
                  accessibilityRole="button"
                  accessibilityLabel="Delete all past matches"
                  hitSlop={8}
                  style={({ pressed }) => [styles.deleteAll, pressed && { opacity: 0.6 }]}
                >
                  <Text style={caps(13)}>Delete all</Text>
                </Pressable>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <PastMatchRow
              match={item}
              onOpen={() => router.push({ pathname: '/summary', params: { id: item.id } })}
              onDelete={() => deleteMatch(item.id)}
            />
          )}
          style={styles.flex}
        />
      ) : (
        <>
          {title}
          <View style={styles.flex} />
        </>
      )}

      {inProgress && match ? <ResumeBand match={match} /> : null}

      {/* Square-cut bands butted into the wall stack, never floating tiles. */}
      <BigButton
        label="New match"
        icon="add"
        size={inProgress ? 'md' : 'lg'}
        square
        color={inProgress ? paint.band : paint.run}
        onPress={newMatch}
      />
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
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
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
  flex: { flex: 1 },
  title: { paddingHorizontal: 20, paddingTop: 40 },
  titleCompact: { paddingTop: 20, paddingBottom: 8 },
  wordmark: { color: paint.bone, fontFamily: font.numeral, fontSize: 84, lineHeight: 78, letterSpacing: 1, textTransform: 'uppercase' },
  wordmarkCompact: { fontSize: 44, lineHeight: 48 },
  amber: { color: paint.stop },
  tagline: { color: paint.boneMuted, fontSize: 17, lineHeight: 24, marginTop: 16, maxWidth: 300 },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: paint.line,
  },
  deleteAll: { paddingVertical: 8 },
  resumeHead: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 12 },
  resumeTeams: { flexDirection: 'row' },
  resumeTeam: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  resumeScore: { fontFamily: font.numeral, fontSize: 64, lineHeight: 66, includeFontPadding: false, ...tabular },
  resumeStripe: { height: 76, backgroundColor: paint.run, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  resumeWord: { color: paint.onRun, fontFamily: font.numeral, fontSize: 34, letterSpacing: 2, textTransform: 'uppercase' },
});
