import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { matchDate, matchDateParts, type MatchState } from '../logic';
import { font, paint, tabular, TOUCH } from '../theme';

interface Props {
  match: MatchState;
  onOpen: () => void;
  onDelete: () => void;
}

/** One finished match: both teams with their paint and final score, the date, and delete. */
export function PastMatchRow({ match, onOpen, onDelete }: Props) {
  const { A, B } = match.teams;
  const date = matchDate(match);
  const parts = matchDateParts(match);
  // The losing score steps back so each result reads at a glance; a draw keeps both bright.
  const lost = (s: number, other: number) => s < other;
  const summary = `${A.name} ${A.score}, ${B.name} ${B.score}`;

  const confirmDelete = () =>
    Alert.alert('Delete this match?', `${A.name} ${A.score} – ${B.score} ${B.name}, ${date}. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${summary}, ${date}. Open match report`}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.teams}>
          {[A, B].map((t, i) => {
            const other = i === 0 ? B.score : A.score;
            return (
            <View key={i} style={styles.team}>
              <View style={[styles.swatch, { backgroundColor: t.color }]} />
              <Text style={styles.name} numberOfLines={1}>
                {t.name}
              </Text>
              <Text style={[styles.score, lost(t.score, other) && styles.scoreLost]}>{t.score}</Text>
            </View>
            );
          })}
        </View>
        <View style={styles.dateBox}>
          <Text style={styles.date}>{parts.day}</Text>
          <Text style={styles.year}>{parts.year}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={confirmDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete match ${summary}, ${date}`}
        hitSlop={4}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={22} color={paint.boneMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: paint.line },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 20, paddingVertical: 10, minHeight: TOUCH + 8 },
  pressed: { backgroundColor: paint.band },
  teams: { flex: 1, gap: 4 },
  team: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 12, height: 12, borderRadius: 2 },
  name: { flex: 1, color: paint.bone, fontFamily: font.display, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' },
  score: { color: paint.bone, fontFamily: font.numeral, fontSize: 24, minWidth: 30, textAlign: 'right', ...tabular },
  scoreLost: { color: paint.boneMuted },
  dateBox: { width: 80, alignItems: 'flex-end' },
  date: { color: paint.bone, fontSize: 13, fontWeight: '600' },
  year: { color: paint.boneMuted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  delete: { width: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
