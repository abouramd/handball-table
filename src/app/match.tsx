import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClockAdjustSheet } from '../components/ClockAdjustSheet';
import { GameClock } from '../components/GameClock';
import { HalfTimePanel } from '../components/HalfTimePanel';
import { ShirtNumberPad } from '../components/ShirtNumberPad';
import { StateStripe, type StripeState } from '../components/StateStripe';
import { TeamBand } from '../components/TeamBand';
import { TimeoutOverlay } from '../components/TimeoutOverlay';
import { TopBar } from '../components/TopBar';
import { useAlertFlash } from '../hooks/useAlertFlash';
import { useNow } from '../hooks/useNow';
import {
  canRedo,
  canUndo,
  currentHalf,
  describeEvent,
  formatClock,
  gameTime,
  halfBounds,
  isRunning,
  lastUndoableIndex,
  nextRedo,
  phaseLabel,
  type TeamId,
} from '../logic';
import { useMatchStore } from '../store/matchStore';
import { paint, useScale } from '../theme';

export default function MatchScreen() {
  const match = useMatchStore((s) => s.match);
  const dispatch = useMatchStore((s) => s.dispatch);
  const now = useNow(200);
  const flash = useAlertFlash(now);
  const scale = useScale();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [suspensionTeam, setSuspensionTeam] = useState<TeamId | null>(null);

  const phase = match?.phase;
  useEffect(() => {
    if (!phase) router.replace('/');
    else if (phase === 'ENDED') router.replace('/summary');
  }, [phase]);

  if (!match) return null;

  const gameMs = gameTime(match, now);
  const running = isRunning(match.clock);
  const undoable = canUndo(match);
  const undoLabel = undoable ? describeEvent(match.events[lastUndoableIndex(match)], match.teams) : '';
  const redoable = canRedo(match);
  const redoEntry = nextRedo(match);
  const redoLabel = redoable && redoEntry ? describeEvent(redoEntry.event, match.teams) : '';
  const stripe: StripeState = match.phase === 'PRE_MATCH' ? 'ready' : running ? 'running' : 'stopped';
  const bounds = halfBounds(currentHalf(match.phase), match.settings.halfLengthMs);

  const endMatch = () =>
    Alert.alert('End the match now?', 'The clock stops and the match report opens. This cannot be undone.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'End match', style: 'destructive', onPress: () => dispatch({ type: 'END_MATCH' }) },
    ]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TopBar
        onHome={() => router.navigate('/')}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onEnd={endMatch}
        canUndo={undoable}
        canRedo={redoable}
        undoLabel={undoLabel}
        redoLabel={redoLabel}
      />

      {/* During the break the clock is frozen and the break countdown is the focal number,
          so the clock steps down and the team bands keep room on short phones. */}
      <GameClock
        gameMs={gameMs}
        label={phaseLabel(match.phase)}
        scale={match.phase === 'HALF_TIME' ? scale * 0.5 : scale}
        onLongPress={() => setAdjustOpen(true)}
      />

      {match.phase === 'HALF_TIME' ? (
        <HalfTimePanel
          halfTime={match.halfTime}
          now={now}
          inverted={flash}
          onStartBreak={() => dispatch({ type: 'START_HALF_TIME_BREAK' })}
          onStartSecondHalf={() => dispatch({ type: 'START_CLOCK' })}
        />
      ) : (
        <StateStripe
          state={stripe}
          inverted={flash}
          height={Math.round(92 * Math.min(1, scale + 0.08))}
          onPress={() => dispatch({ type: running ? 'STOP_CLOCK' : 'START_CLOCK' })}
        />
      )}

      <View style={styles.teams}>
        {(['A', 'B'] as const).map((id) => (
          <TeamBand
            key={id}
            teamId={id}
            match={match}
            gameMs={gameMs}
            now={now}
            scale={scale}
            dispatch={dispatch}
            onAddSuspension={setSuspensionTeam}
          />
        ))}
      </View>

      <TimeoutOverlay
        timeout={match.timeout}
        team={match.timeout ? match.teams[match.timeout.team] : null}
        now={now}
        inverted={flash}
        onStartClock={() => dispatch({ type: 'START_CLOCK' })}
        onClose={() => dispatch({ type: 'END_TIMEOUT' })}
      />
      <ShirtNumberPad
        visible={suspensionTeam !== null}
        teamName={suspensionTeam ? match.teams[suspensionTeam].name : ''}
        teamColor={suspensionTeam ? match.teams[suspensionTeam].color : paint.band}
        suspensionLengthMs={match.settings.suspensionLengthMs}
        onCancel={() => setSuspensionTeam(null)}
        onSubmit={(shirt) => {
          if (suspensionTeam) dispatch({ type: 'ADD_SUSPENSION', team: suspensionTeam, shirt });
          setSuspensionTeam(null);
        }}
      />
      <ClockAdjustSheet
        visible={adjustOpen}
        gameMs={gameMs}
        running={running}
        rangeLabel={`${phaseLabel(match.phase)} · ${formatClock(bounds.start)}–${formatClock(bounds.end)}`}
        onAdjust={(deltaMs) => dispatch({ type: 'ADJUST_CLOCK', deltaMs })}
        onSet={(ms) => dispatch({ type: 'SET_CLOCK', gameMs: ms })}
        onClose={() => setAdjustOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: paint.wall },
  teams: { flex: 1, flexDirection: 'row' },
});
