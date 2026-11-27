import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  canTakeTimeout,
  suspensionRemaining,
  suspensionsForTeam,
  timeoutsUsed,
  type MatchState,
  type TeamId,
} from '../logic';
import type { MatchCommand } from '../store/matchStore';
import { caps, font, paint, tabular, textOn } from '../theme';
import { SuspensionChip } from './SuspensionChip';
import { BigButton } from './ui/BigButton';

interface Props {
  teamId: TeamId;
  match: MatchState;
  gameMs: number;
  now: number;
  scale: number;
  dispatch: (c: MatchCommand) => void;
  onAddSuspension: (team: TeamId) => void;
}

/**
 * A team's painted band: full-bleed in the team colour, its name always beside
 * the colour (never colour alone). +1 is the biggest, closest target; −1 is
 * small and set apart.
 */
export function TeamBand({ teamId, match, gameMs, now, scale, dispatch, onAddSuspension }: Props) {
  const team = match.teams[teamId];
  const fg = textOn(team.color);
  // Counts UP: taken so far, and the limit only when the match has one.
  const used = timeoutsUsed(match.events, teamId);
  const limit = match.settings.timeoutsPerTeam;
  const count = limit === null ? `${used}` : `${used} / ${limit}`;
  const toCheck = canTakeTimeout(match, teamId, gameMs);
  const suspensions = suspensionsForTeam(match.suspensions, teamId);
  const ended = match.phase === 'ENDED';
  const scoreSize = Math.round(108 * scale);

  return (
    <View style={[styles.band, { backgroundColor: team.color }]}>
      <Text style={[caps(19, fg), styles.name]} numberOfLines={1} adjustsFontSizeToFit>
        {team.name}
      </Text>
      <Text
        style={[styles.score, { color: fg, fontSize: scoreSize, lineHeight: scoreSize * 0.92 }]}
        accessibilityLabel={`${team.name} score ${team.score}`}
      >
        {team.score}
      </Text>

      <View style={styles.scoreRow}>
        <BigButton
          label="−1"
          onPress={() => dispatch({ type: 'REMOVE_GOAL', team: teamId })}
          disabled={ended || team.score === 0}
          color={paint.scrim}
          textColor={fg}
          accessibilityLabel={`Remove a goal from ${team.name}`}
        />
        <BigButton
          label="+1"
          size={scale >= 0.9 ? 'lg' : 'md'}
          onPress={() => dispatch({ type: 'GOAL', team: teamId })}
          disabled={ended}
          color={paint.bone}
          textColor={paint.wall}
          style={styles.flex}
          accessibilityLabel={`Goal ${team.name}`}
        />
      </View>

      <BigButton
        label="Timeout"
        value={toCheck.ok ? count : undefined}
        sublabel={toCheck.ok ? undefined : toCheck.reason}
        align="split"
        onPress={() => dispatch({ type: 'TIMEOUT', team: teamId })}
        disabled={!toCheck.ok}
        color={paint.scrim}
        textColor={fg}
        accessibilityLabel={`Team timeout ${team.name}, ${used} taken${limit === null ? '' : ` of ${limit}`}${toCheck.ok ? '' : `. ${toCheck.reason}`}`}
      />
      <BigButton
        label="Suspension"
        icon="add"
        // Active count, so it's clear more chips are listed below on small phones.
        value={suspensions.length > 0 ? String(suspensions.length) : undefined}
        align="split"
        onPress={() => onAddSuspension(teamId)}
        disabled={ended}
        color={paint.scrim}
        textColor={fg}
        accessibilityLabel={`Add a suspension for ${team.name}${suspensions.length ? `, ${suspensions.length} running` : ''}`}
      />

      <ScrollView style={styles.chips} contentContainerStyle={styles.chipsContent} showsVerticalScrollIndicator={false}>
        {suspensions.map((s) => (
          <SuspensionChip
            key={s.id}
            suspension={s}
            remainingMs={suspensionRemaining(s, gameMs)}
            now={now}
            onDelete={(id) => dispatch({ type: 'DELETE_SUSPENSION', id })}
            onAcknowledge={(id) => dispatch({ type: 'ACK_SUSPENSION', id })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { flex: 1, paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  // Fixed parts never shrink; only the scrolling chip row gives up space on short screens.
  name: { letterSpacing: 2.4, flexShrink: 0 },
  score: { fontFamily: font.numeral, includeFontPadding: false, marginTop: -2, flexShrink: 0, ...tabular },
  scoreRow: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  flex: { flex: 1 },
  chips: { flex: 1, minHeight: 0, marginHorizontal: -2 },
  chipsContent: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 2, paddingBottom: 12 },
});
