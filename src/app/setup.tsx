import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ColorPicker } from '../components/ui/ColorPicker';
import { Segmented } from '../components/ui/Segmented';
import { Stepper } from '../components/ui/Stepper';
import { ToggleRow } from '../components/ui/ToggleRow';
import { formatCountdown, HALF_LENGTH_PRESETS_MIN, MINUTE, SECOND, type Settings } from '../logic';
import { useMatchStore } from '../store/matchStore';
import { useSettingsStore, type TeamSetup } from '../store/settingsStore';
import { caps, font, paint, RADIUS, tabular, textOn, TOUCH } from '../theme';

type HalfChoice = (typeof HALF_LENGTH_PRESETS_MIN)[number] | 'custom';

const clampMin = (m: number) => Math.min(60, Math.max(1, Math.round(m) || 1));

export default function Setup() {
  const defaults = useSettingsStore((s) => s.defaults);
  const saveDefaults = useSettingsStore((s) => s.saveDefaults);
  const startNewMatch = useMatchStore((s) => s.startNewMatch);

  const [teamA, setTeamA] = useState<TeamSetup>(defaults.teamA);
  const [teamB, setTeamB] = useState<TeamSetup>(defaults.teamB);
  const [settings, setSettings] = useState<Settings>(defaults.settings);
  const [saved, setSaved] = useState(false);

  const halfMin = Math.round(settings.halfLengthMs / MINUTE);
  const [halfChoice, setHalfChoice] = useState<HalfChoice>(
    (HALF_LENGTH_PRESETS_MIN as readonly number[]).includes(halfMin) ? (halfMin as HalfChoice) : 'custom',
  );
  const [customMin, setCustomMin] = useState(String(halfMin));

  const update = (patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setSaved(false);
  };
  const editTeam = (set: (t: TeamSetup) => void) => (t: TeamSetup) => {
    set(t);
    setSaved(false);
  };

  const chooseHalf = (c: HalfChoice) => {
    setHalfChoice(c);
    update({ halfLengthMs: (c === 'custom' ? clampMin(Number(customMin)) : c) * MINUTE });
  };

  const teams = () => ({
    A: { name: teamA.name.trim() || 'Team A', color: teamA.color },
    B: { name: teamB.name.trim() || 'Team B', color: teamB.color },
  });

  const onSaveDefaults = () => {
    const t = teams();
    saveDefaults({ settings, teamA: t.A, teamB: t.B });
    setSaved(true);
  };

  const onStart = () => {
    startNewMatch({ settings, teams: teams() });
    router.replace('/match');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TeamEditor label="Home team" fallback="Team A" team={teamA} other={teamB.color} onChange={editTeam(setTeamA)} />
        <TeamEditor label="Away team" fallback="Team B" team={teamB} other={teamA.color} onChange={editTeam(setTeamB)} />

        <Band title="Half length" note={`Counts up 0:00 → ${halfMin}:00, then ${halfMin}:00 → ${halfMin * 2}:00`}>
          <Segmented<HalfChoice>
            accessibilityLabel="Half length"
            value={halfChoice}
            onChange={chooseHalf}
            options={[
              ...HALF_LENGTH_PRESETS_MIN.map((m) => ({ value: m as HalfChoice, label: `${m}`, caption: 'MIN' })),
              { value: 'custom', label: 'Other', caption: 'MIN' },
            ]}
          />
          {halfChoice === 'custom' ? (
            <View style={styles.customRow}>
              <TextInput
                value={customMin}
                onChangeText={(t) => {
                  const v = t.replace(/\D/g, '').slice(0, 2);
                  setCustomMin(v);
                  if (v) update({ halfLengthMs: clampMin(Number(v)) * MINUTE });
                }}
                keyboardType="number-pad"
                selectionColor={paint.stop}
                style={styles.customInput}
                accessibilityLabel="Minutes per half"
              />
              <Text style={styles.customLabel}>minutes per half (1–60)</Text>
            </View>
          ) : null}
        </Band>

        <Band title="Timeouts">
          <ToggleRow
            label="Limit timeouts per team"
            hint={settings.timeoutsPerTeam === null ? 'Off: no limit, the app counts them' : undefined}
            value={settings.timeoutsPerTeam !== null}
            onChange={(on) => update({ timeoutsPerTeam: on ? 3 : null })}
          />
          {settings.timeoutsPerTeam !== null ? (
            <Stepper
              label="Per team per match"
              value={settings.timeoutsPerTeam}
              min={1}
              max={9}
              step={1}
              onChange={(v) => update({ timeoutsPerTeam: v })}
            />
          ) : null}
          <Stepper
            label="Length"
            value={settings.timeoutLengthMs}
            min={30 * SECOND}
            max={3 * MINUTE}
            step={10 * SECOND}
            format={formatCountdown}
            onChange={(v) => update({ timeoutLengthMs: v })}
          />
          <ToggleRow label="Max 2 per half" value={settings.maxTwoTimeoutsPerHalf} onChange={(v) => update({ maxTwoTimeoutsPerHalf: v })} />
          <ToggleRow
            label="Max 1 in the last 5 minutes"
            hint="Of each half"
            value={settings.maxOneInLast5Min}
            onChange={(v) => update({ maxOneInLast5Min: v })}
          />
        </Band>

        <Band title="Suspensions and break">
          <Stepper
            label="Suspension"
            value={settings.suspensionLengthMs}
            min={30 * SECOND}
            max={5 * MINUTE}
            step={30 * SECOND}
            format={formatCountdown}
            onChange={(v) => update({ suspensionLengthMs: v })}
          />
          <Stepper
            label="Half-time break"
            value={settings.halfTimeLengthMs}
            min={1 * MINUTE}
            max={30 * MINUTE}
            step={1 * MINUTE}
            format={formatCountdown}
            onChange={(v) => update({ halfTimeLengthMs: v })}
          />
        </Band>

        <View style={styles.saveWrap}>
          <Pressable
            onPress={onSaveDefaults}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Saved as default for the next match' : 'Save these settings as default'}
            style={({ pressed }) => [styles.save, pressed && styles.savePressed]}
          >
            <Ionicons name={saved ? 'checkmark-circle' : 'bookmark-outline'} size={22} color={saved ? paint.run : paint.bone} />
            <Text style={caps(17, saved ? paint.run : paint.bone)}>{saved ? 'Saved as default' : 'Save as default'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Pressable onPress={onStart} accessibilityRole="button" accessibilityLabel="Start match" style={({ pressed }) => [styles.startStripe, pressed && { opacity: 0.85 }]}>
        <SafeAreaView edges={['bottom']} style={styles.startInner}>
          <Ionicons name="play" size={30} color={paint.onRun} />
          <Text style={styles.startWord}>Go to match</Text>
        </SafeAreaView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

/** A full-width painted band with a tracked-caps title: sections are wall bands, not cards. */
function Band({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.band}>
      <Text style={caps(15)}>{title}</Text>
      {children}
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

function TeamEditor({
  label,
  fallback,
  team,
  other,
  onChange,
}: {
  label: string;
  fallback: string;
  team: TeamSetup;
  other: string;
  onChange: (t: TeamSetup) => void;
}) {
  const fg = textOn(team.color);
  return (
    <View style={styles.teamBand}>
      <View style={[styles.teamPaint, { backgroundColor: team.color }]}>
        <Text style={caps(14, fg)}>{label}</Text>
        <TextInput
          value={team.name}
          onChangeText={(name) => onChange({ ...team, name })}
          placeholder={fallback}
          placeholderTextColor={fg === '#FFFFFF' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}
          maxLength={18}
          selectionColor={fg}
          returnKeyType="done"
          style={[styles.nameInput, { color: fg, borderBottomColor: fg }]}
          accessibilityLabel={`${label} name`}
        />
      </View>
      <View style={styles.swatches}>
        <ColorPicker value={team.color} taken={other} onChange={(color) => onChange({ ...team, color })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: paint.wall },
  content: { paddingBottom: 24 },
  teamBand: { borderBottomWidth: 1, borderBottomColor: paint.line },
  teamPaint: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  nameInput: {
    fontFamily: font.numeral,
    fontSize: 40,
    minHeight: TOUCH,
    borderBottomWidth: 2,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  swatches: { paddingHorizontal: 20, paddingVertical: 14 },
  band: { paddingHorizontal: 20, paddingVertical: 18, gap: 10, borderBottomWidth: 1, borderBottomColor: paint.line },
  note: { color: paint.boneMuted, fontSize: 14, ...tabular },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customInput: {
    width: 96,
    height: TOUCH,
    borderRadius: RADIUS,
    backgroundColor: paint.band,
    color: paint.bone,
    fontFamily: font.numeral,
    fontSize: 32,
    textAlign: 'center',
  },
  customLabel: { color: paint.boneMuted, fontSize: 15 },
  saveWrap: { paddingHorizontal: 20, paddingTop: 20 },
  save: {
    minHeight: TOUCH,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: paint.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  savePressed: { backgroundColor: paint.band },
  startStripe: { backgroundColor: paint.run },
  startInner: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  startWord: { color: paint.onRun, fontFamily: font.numeral, fontSize: 36, letterSpacing: 2, textTransform: 'uppercase' },
});
