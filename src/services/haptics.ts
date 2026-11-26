import { Platform, Vibration } from 'react-native';
import type { VibrationPattern } from '../logic';

/**
 * All alerts are vibration only (no sounds).
 *
 * Android honours pulse durations: [wait, vibrate, wait, vibrate, ...].
 * iOS ignores durations (each pulse is a fixed ~0.4 s); the array values are
 * the pauses between pulses, so "long" is several pulses back to back.
 */
const ANDROID: Record<VibrationPattern, number[]> = {
  short: [0, 300],
  long: [0, 1500],
  doubleShort: [0, 200, 150, 200],
};

const IOS: Record<VibrationPattern, number[]> = {
  short: [0],
  long: [0, 1, 1, 1],
  doubleShort: [0, 250],
};

export function vibrate(pattern: VibrationPattern): void {
  try {
    Vibration.vibrate(Platform.OS === 'ios' ? IOS[pattern] : ANDROID[pattern]);
  } catch {
    // Vibration unavailable (simulator/web): ignore.
  }
}
