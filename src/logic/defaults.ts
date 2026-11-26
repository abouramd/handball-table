import type { Settings } from './types';

export const MINUTE = 60_000;
export const SECOND = 1_000;

export const DEFAULT_SETTINGS: Settings = {
  halfLengthMs: 30 * MINUTE,
  timeoutsPerTeam: null, // youth/friendly: no limit, the app just counts
  timeoutLengthMs: 1 * MINUTE,
  maxTwoTimeoutsPerHalf: false,
  maxOneInLast5Min: false,
  suspensionLengthMs: 2 * MINUTE,
  halfTimeLengthMs: 10 * MINUTE,
};

export const HALF_LENGTH_PRESETS_MIN = [20, 25, 30] as const;

/** 8 preset team colors, all readable with white text. */
export const TEAM_COLORS = [
  '#D32F2F', // red
  '#1565C0', // blue
  '#2E7D32', // green
  '#F9A825', // yellow
  '#6A1B9A', // purple
  '#EF6C00', // orange
  '#00838F', // teal
  '#424242', // dark grey
] as const;

/** Timeout warning fires this long before the timeout ends (50 s into a 1:00 timeout). */
export const TIMEOUT_WARNING_BEFORE_END_MS = 10 * SECOND;

/** The "last 5 minutes" window used by the optional timeout restriction. */
export const LAST_MINUTES_WINDOW_MS = 5 * MINUTE;
