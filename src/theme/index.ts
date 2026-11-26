import { useWindowDimensions } from 'react-native';

/**
 * "Hall Wall": the screen is a club sports-hall wall. Horizontal painted bands
 * stacked edge to edge, stencil-white numerals, and one full-width stripe
 * that wears the game's state.
 */
export const paint = {
  wall: '#101417', // base wall paint (screen ground)
  band: '#1B2429', // lighter painted band (secondary surfaces, keys)
  bandHigh: '#26323A', // pressed / raised band
  line: '#2C3A42', // hairline between bands
  bone: '#E8E4DA', // stencil white: numerals and primary text
  boneMuted: '#9AA4A8', // secondary text on wall (≈7:1)
  run: '#2FBF71', // clock running
  onRun: '#06140C',
  stop: '#F2B233', // clock stopped / attention
  onStop: '#1A1203',
  alert: '#E5484D', // warnings, destructive
  onAlert: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.28)', // control ground painted over a team colour
};

/** One numeral face (Barlow Condensed) at fixed weights; the system face carries small UI text. */
export const font = {
  numeral: 'BarlowCondensed_800ExtraBold',
  display: 'BarlowCondensed_700Bold',
  label: 'BarlowCondensed_600SemiBold',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Minimum touch target (requirement: ≥ 64 px). */
export const TOUCH = 64;

/** Press targets inside a band get a small radius; bands themselves are square-cut. */
export const RADIUS = 12;

/** Tabular digits so numbers don't shift while counting. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

/** Tracked uppercase label in the numeral family. */
export const caps = (size = 15, color: string = paint.boneMuted) => ({
  fontFamily: font.display,
  fontSize: size,
  letterSpacing: size * 0.14,
  textTransform: 'uppercase' as const,
  color,
});

/** Black or white text, whichever reads better on `hex`. */
export function textOn(hex: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return paint.bone;
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35 ? '#0B0D0F' : '#FFFFFF';
}

/**
 * Scale factor for the big numerals, so the match screen fits from a small
 * iPhone SE (667 pt) to a large Android phone without scrolling.
 */
export function useScale(): number {
  const { height } = useWindowDimensions();
  return Math.min(1.1, Math.max(0.76, height / 844));
}

/**
 * Largest font size (≤ max) at which a numeral string like "47:12" fits in
 * `width`. Barlow Condensed ExtraBold digits are ~0.52 em wide, the colon ~0.28 em.
 * Measured up front so big numbers never truncate or wrap on any screen.
 */
export function fitNumeral(text: string, max: number, width: number): number {
  let em = 0;
  for (const ch of text) em += ch === ':' ? 0.28 : 0.53;
  return Math.floor(Math.min(max, width / Math.max(em, 1)));
}
