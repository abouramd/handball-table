---
name: Handball Table
description: Clock, score, timeouts and suspensions for the officials' table, painted like a sports-hall wall.
colors:
  wall: "#101417"
  band: "#1B2429"
  band-high: "#26323A"
  line: "#2C3A42"
  bone: "#E8E4DA"
  bone-muted: "#9AA4A8"
  run: "#2FBF71"
  on-run: "#06140C"
  stop: "#F2B233"
  on-stop: "#1A1203"
  alert: "#E5484D"
  on-alert: "#FFFFFF"
  scrim: "rgba(0,0,0,0.28)"
  ink-dark: "#0B0D0F"
  team-red: "#D32F2F"
  team-blue: "#1565C0"
  team-green: "#2E7D32"
  team-yellow: "#F9A825"
  team-purple: "#6A1B9A"
  team-orange: "#EF6C00"
  team-teal: "#00838F"
  team-grey: "#424242"
typography:
  clock:
    fontFamily: "BarlowCondensed_800ExtraBold"
    fontSize: "150px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-1px"
    fontFeature: "tnum"
  timeout-clock:
    fontFamily: "BarlowCondensed_800ExtraBold"
    fontSize: "210px"
    fontWeight: 800
    letterSpacing: "-2px"
    fontFeature: "tnum"
  score:
    fontFamily: "BarlowCondensed_800ExtraBold"
    fontSize: "108px"
    fontWeight: 800
    lineHeight: 0.92
    fontFeature: "tnum"
  display:
    fontFamily: "BarlowCondensed_800ExtraBold"
    fontSize: "44px"
    fontWeight: 800
    letterSpacing: "2px"
  numeral-key:
    fontFamily: "BarlowCondensed_800ExtraBold"
    fontSize: "40px"
    fontWeight: 800
    fontFeature: "tnum"
  numeral-value:
    fontFamily: "BarlowCondensed_800ExtraBold"
    fontSize: "26px"
    fontWeight: 800
    letterSpacing: "0.5px"
    fontFeature: "tnum"
  chip:
    fontFamily: "BarlowCondensed_800ExtraBold"
    fontSize: "24px"
    fontWeight: 800
    fontFeature: "tnum"
  button-label:
    fontFamily: "BarlowCondensed_700Bold"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "1.2px"
  label-caps:
    fontFamily: "BarlowCondensed_700Bold"
    fontSize: "15px"
    fontWeight: 700
    letterSpacing: "0.14em"
  body:
    fontFamily: "System"
    fontSize: "17px"
    fontWeight: 600
  body-small:
    fontFamily: "System"
    fontSize: "12px"
    fontWeight: 600
rounded:
  none: "0px"
  press: "12px"
  press-inset: "9px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  touch: "64px"
components:
  state-stripe-ready:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.wall}"
    rounded: "{rounded.none}"
    height: "92px"
    padding: "0 20px"
  state-stripe-running:
    backgroundColor: "{colors.run}"
    textColor: "{colors.on-run}"
    rounded: "{rounded.none}"
    height: "92px"
    padding: "0 20px"
  state-stripe-stopped:
    backgroundColor: "{colors.stop}"
    textColor: "{colors.on-stop}"
    rounded: "{rounded.none}"
    height: "92px"
    padding: "0 20px"
  state-stripe-inverted-running:
    backgroundColor: "{colors.on-run}"
    textColor: "{colors.run}"
  button-goal:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.wall}"
    typography: "{typography.button-label}"
    rounded: "{rounded.press}"
    height: "76px"
    padding: "0 14px"
  button-in-band:
    backgroundColor: "{colors.scrim}"
    rounded: "{rounded.press}"
    height: "{spacing.touch}"
    padding: "0 14px"
  button-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.bone}"
    typography: "{typography.button-label}"
    rounded: "{rounded.press}"
    height: "{spacing.touch}"
    padding: "0 14px"
  button-band-pressed:
    backgroundColor: "{colors.band-high}"
  button-wall-band:
    backgroundColor: "{colors.run}"
    textColor: "{colors.on-run}"
    rounded: "{rounded.none}"
    height: "76px"
  stepper-key:
    backgroundColor: "{colors.band}"
    textColor: "{colors.bone}"
    rounded: "{rounded.press}"
    size: "64px"
  segmented:
    backgroundColor: "{colors.band}"
    rounded: "{rounded.press}"
    padding: "4px"
  segmented-selected:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.wall}"
    typography: "{typography.numeral-value}"
    rounded: "{rounded.press-inset}"
    height: "{spacing.touch}"
  suspension-chip:
    backgroundColor: "{colors.wall}"
    textColor: "{colors.bone}"
    typography: "{typography.chip}"
    height: "44px"
    padding: "0 10px"
  suspension-chip-flash:
    backgroundColor: "{colors.stop}"
    textColor: "{colors.on-stop}"
  top-bar-undo:
    backgroundColor: "{colors.band}"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    height: "56px"
  input-numeral:
    backgroundColor: "{colors.band}"
    textColor: "{colors.bone}"
    rounded: "{rounded.press}"
    height: "{spacing.touch}"
---

# Design System: Handball Table

## Overview

**Creative North Star: "The Hall Wall"**

The screen is the wall of a club sports hall: horizontal painted bands stacked edge to edge, numerals stencilled in bone-white paint, and one full-width dado stripe that wears the game's state and is itself the start/stop control. Every screen (home, setup, match, summary) and every overlay (timeout, shirt number, clock correction, half-time) is built as a stack of square-cut bands that run to both screen edges. Nothing floats. There are no cards, no tiles with gaps around them, no shadows; a surface is either wall or a band painted onto the wall.

Density is "read from arm's length in a bright, noisy hall". One focal number per state: the clock in the clock band, the score in each team band, the time left in a timeout. Numerals are huge and tabular, labels are small tracked capitals, and the frequent whistle actions (the stripe, +1) are the biggest and closest targets. Team colours are painted as full-bleed bands, always with the team name on them, never as pills or dots alone.

Every vibration has a visual twin: for one beat (650 ms) the stripe, the half-time band or the timeout screen swaps its ground and ink. The paint inverts; nothing slides, scales or glows.

The confirmed rejection is the category default: grey rounded cards floating on black.

**Key Characteristics:**
- Full-bleed, square-cut horizontal bands stacked edge to edge on a near-black blue-grey wall.
- One condensed numeral face (Barlow Condensed) for every number and every heading; the system face only for small UI text.
- State is paint: green running, amber stopped, red warning; the stripe carries it full width.
- 12 px radius only on press targets that sit inside a band; the bands themselves are square.
- One-beat inversion as the visual twin of each vibration.
- Every touch target at least 64 px.

## Colors

Wall paint and stencil paint, plus three state paints and eight team paints; colour always means something.

### Primary
- **Running Green** (run): the clock is running. Fills the state stripe while running, the "Start clock", "Start 2nd half", "Resume match" and "New match" stripes, the confirm key on the shirt pad and the "on" track of switches. Ink on it is **Pitch Dark Green** (on-run).
- **Stopped Amber** (stop): the clock is stopped or something needs attention. Fills the stripe while stopped, the timeout warning band, a flashing expired suspension chip, the shirt number on a chip, the half-time break label, and the second word of the "Handball / Table" wordmark. Ink on it is **Burnt Umber Ink** (on-stop).

### Secondary
- **Warning Red** (alert): time is up. A timeout that reaches 0:00 repaints the whole screen in it (or, when the team already wears red, the screen turns bone with red ink so the change still reads). Also destructive confirmations. Ink on it is white (on-alert), set at 19 pt bold where it carries a sentence.

### Tertiary
- **Team Paints** (team-red through team-grey): eight preset colours, all readable with white text, chosen per team in setup. They paint team bands, the resume band on home, the summary score bands and the full-screen timeout. Ink on any team paint is chosen by luminance (`textOn()`): ink-dark (#0B0D0F) above relative luminance 0.35, white below.

### Neutral
- **Hall Wall** (wall): the screen ground on every screen and overlay; also the ground of suspension chips painted onto a team band.
- **Painted Band** (band): secondary surfaces painted on the wall: the Undo band, keys, steppers, segmented strip, inputs, the summary meta band, the half-time break band.
- **Pressed Band** (band-high): the pressed state of any band or key, and the "off" track of switches.
- **Band Seam** (line): hairlines between stacked bands in setup and summary, and the 2 px outline of the two quiet outline buttons.
- **Stencil Bone** (bone): numerals and primary text on the wall; the +1 key; the "Ready" stripe before kick-off; the selected segment.
- **Faded Stencil** (bone-muted): secondary text on the wall (about 7:1 on wall): captions, hints, notes, report row labels.
- **Band Scrim** (scrim, rgba(0,0,0,0.28)): the ground of controls painted over a team colour (−1, Timeout, Suspension), so the team paint shows through.

### Named Rules
**The Paint Means State Rule.** Green, amber and red are reserved for clock state and warnings. They are never decoration, never a brand accent, never a category colour. The one exception the build makes is the amber second word of the home wordmark.

**The Name Beside Paint Rule.** A team colour never appears without the team name painted on it (or, in the summary report, next to it). Colour alone never identifies a team.

**The Ink By Luminance Rule.** Text on a team paint or on any user-chosen colour is always picked by `textOn()`, never hard-coded.

## Typography

**Display Font:** Barlow Condensed ExtraBold 800 (falls back to the system face if the font fails to load)
**Heading/Label Font:** Barlow Condensed Bold 700
**Body Font:** System face (San Francisco on iOS, Roboto on Android)

**Character:** A narrow sports-stencil numeral that fits a 150 pt "47:12" across a phone, paired with the quiet system face for anything that is read rather than glanced at.

### Hierarchy
- **Clock** (800, 150 px × `useScale()`, line-height 0.95, −1 px tracking, tabular): the game clock in the clock band. Sized by `fitNumeral()` against the widest value the half will reach ("00:00"), so it never changes size mid-half.
- **Timeout Clock** (800, up to 210 px via `fitNumeral()`, −2 px tracking, tabular): remaining time counting down on the full-screen timeout.
- **Score** (800, 108 px × `useScale()`, line-height 0.92, tabular): the score in each team band. Summary scores use 120 px; the home resume band uses 64 px.
- **Display** (800, 34–46 px, 2 px tracking, uppercase): stripe action words ("Stop", "Start", "Start clock", "Resume match"); the stripe word is set at half the stripe's height. The home wordmark uses 84 px.
- **Numeral Key / Value** (800, 40 px keys and break timer; 26–32 px values in buttons, segments, steppers and inputs; 22–24 px on chips and report rows; tabular wherever it counts).
- **Button Label** (700, 20 px md / 28 px lg / 40 px xl, 1.2 px tracking, uppercase): centred labels on painted buttons.
- **Label Caps** (700, 15 px default, tracking 0.14 em, uppercase, via `caps()`): period label over the clock, team names (19 px), stripe captions, status lines, section headings.
- **Body** (system, 600, 16–17 px): setting labels, split-button labels ("Timeout", "Suspension"), report row labels, the home tagline (17/24, max 300 px wide).
- **Body Small** (system, 600, 12 px): the Undo "what it reverts" line, button sublabels such as the reason a timeout is disabled.

### Named Rules
**The One Numeral Face Rule.** Every number on screen, and every display word, is Barlow Condensed ExtraBold. No second display face, no system digits for anything the official glances at.

**The Tabular Count Rule.** Any number that changes while the official watches (clock, score, countdowns, chip times, steppers) sets `tabular-nums`, so digits never shift.

**The Fit, Don't Wrap Rule.** Big numerals are sized up front with `fitNumeral()` or `adjustsFontSizeToFit`; they never truncate, wrap or jump size during play.

## Layout

Portrait phone only. Each screen is a vertical stack of full-width bands, top to bottom, with no side margins on the bands themselves; content inside a band takes 12–20 px horizontal padding.

The match screen stacks: top bar (56 px: 64 px Home target, the Undo band filling the middle, 64 px End target), clock band, the state stripe (92 px × min(1, scale + 0.08)), then two team bands side by side filling the remaining height. Each team band stacks name, score, the −1 / +1 row, the Timeout and Suspension split buttons, then a wrapping, scrolling row of suspension chips. At half-time the stripe is replaced by a 64 px amber-labelled break band plus an 84 px green "Start 2nd half" stripe.

`useScale()` scales the big numerals between 0.76 and 1.1 of their base size against a 844 pt reference height, so the match screen fits from a 667 pt iPhone SE to a large Android phone without scrolling. Below scale 0.9 the +1 key drops from 76 px to 64 px.

The spacing scale is 4 / 8 / 12 / 16 / 24 / 32 px; gaps inside a band are 8 px, between chips 6 px. The 64 px touch minimum is a layout token, not a guideline: buttons, keys, segments, inputs and stepper keys never render below it; setting rows are 72 px.

Overlays are full-screen modals in the same world: the timeout is a full-screen team-paint wall with a green start stripe pinned to the bottom edge above the safe area; the shirt pad and clock correction slide up as full wall screens.

## Elevation & Depth

Flat. There are no shadows anywhere and no blur. Depth is tonal and positional: wall (#101417) is the ground, a band is a lighter paint on it, a pressed band is lighter again, and a control over a team colour gets a translucent dark scrim. Stacked bands are separated by butting edge to edge, or by a 1 px seam line where two neutral bands meet.

### Named Rules
**The Painted, Not Lifted Rule.** A surface is painted on the wall, never raised off it. Pressed states darken or lighten the paint (band to band-high, a 0.18 black press shade on buttons, a slight 0.97 scale on painted buttons, opacity 0.82 on stripes); nothing gains a shadow.

## Shapes

Square-cut is the default: every band, stripe, the top bar's Undo band, the home action bands and the timeout status band have 0 radius and run to both screen edges. A 12 px radius (`RADIUS`) appears only on press targets that sit inside a band: painted buttons, stepper keys, number-pad keys, inputs, the segmented strip (whose inner segments use 9 px). Small round forms are limited to functional marks: the 8 px state dot on the stripe and the 10 px timeout progress track.

**The Square Band Rule.** If it runs edge to edge, it is square. If it sits inside a band and you press it, it gets 12 px. Nothing else is rounded.

## Components

### State Stripe (signature)
The hall's dado stripe: full width, about 92 px tall, square-cut, and the start/stop control itself.
- **States:** Ready (bone ground, wall ink, "Start match"), Running (green, "Stop", caption "Clock running"), Stopped (amber, "Start", caption "Clock stopped").
- **Layout:** play/stop icon (0.36 × height) and the action word (ExtraBold uppercase at 0.5 × height) on the left; an 8 px dot and the state caption in label caps on the right. The action is the biggest thing; the state is the caption.
- **Alert twin:** when `useAlertFlash()` is true (650 ms after any vibration) ground and ink swap.
- **Press:** opacity 0.82.

### Game Clock
The clock band on the wall: period label in bone label caps on the left, "Hold to correct" in faded caps on the right, then the clock numeral. Long press (500 ms) opens the clock correction sheet; pressed, the band paints to band.

### Team Band
A full-bleed band in the team's paint, two side by side. Name in 19 px label caps, score in the score numeral, then a row with a small −1 (scrim) and a wide +1 (bone ground, wall ink, 76 px), then the Timeout and Suspension split buttons on scrim (label left, numeral value right). The Timeout value counts timeouts taken up: "2" when the match has no limit (the default), "1 / 3" when setup set one. The Suspension value is the active count. When a timeout is not allowed, the button shows the rule's reason as its sublabel instead of the count.

### Buttons (BigButton)
- **Shape:** 12 px on press targets, 0 when used as a square wall band (`square`).
- **Sizes:** md 64 px / lg 76 px / xl 92 px minimum height; 14 px horizontal padding; minimum width 64 px.
- **Colour:** band by default; bone for +1; scrim inside team bands; green for the primary "New match" band on home. Ink defaults to `textOn()` of the ground.
- **Press:** scale 0.97 plus an 18% black shade. **Disabled:** opacity 0.6, keeping the label legible so the reason stays readable.
- **Split variant:** system 16 px label left, 26 px numeral value right.
- **Outline variant (setup save, shirt pad skip):** transparent with a 2 px line-colour border, 12 px radius.

### Suspension Chip
"#7 1:34" painted in wall colour onto the team band: 44 px tall, at least 86 px wide, growing to fill the row. Shirt number in amber numeral 22 px, remaining time in bone numeral 24 px. On expiry it gains an amber border, reads "IN" with a check icon, and flashes amber with dark ink on a 300 ms cycle until the official taps it to confirm they saw it (it is never removed on its own). Tapping a running chip offers delete via a confirm dialog.

### Top Bar
56 px. Bare 64 px Home (chevron) and End (flag) targets on the wall; the Undo band between them is the one painted band, naming what it will revert ("Undo / Goal Lions"). Disabled Undo drops to opacity 0.45 and reads "Nothing to undo".

### Timeout Overlay
The whole screen repaints in the team's colour. Team name and "Timeout" at 44 px display, time left counting down (1:00 to 0:00) at up to 210 px, a 10 px progress track on scrim that empties as time runs out, then the status ("1:00 timeout"). In the last 10 s a full-bleed amber band reads "Warning · 0:09 left"; at 0:00 the screen repaints in Warning Red (or bone with red ink for a red team), the track disappears, and while the overlay stays open a full-bleed band reads "Time is up +0:07". Bottom: a 64 px "Close timeout" band on 45% black, then a 96 px green "Start clock" stripe. Inverts for one beat on each signal.

### Half-Time Panel
Takes the stripe's place: a 64 px band with an amber "Start break" label and the break length; once running it counts down, and at zero flashes amber on a 450 ms cycle. Below it, an 84 px green "Start 2nd half" stripe.

### Inputs / Fields
- **Numeral input** (custom minutes, clock correction): 64 px tall, band ground, 12 px radius, bone ExtraBold 32 px centred.
- **Team name input** (setup): 40 px ExtraBold uppercase on the team paint with a 2 px underline, no box.

### Controls
- **Stepper:** label in system 17/600, then two 64 px band keys (minus, plus) around a 30 px numeral value.
- **Segmented:** one band strip with 4 px padding; segments 64 px tall; the selected segment is bone with wall ink; 26 px numeral labels with an 11 px caption.
- **Toggle Row:** the whole 72 px row toggles; native switch with green "on" track, band-high "off" track and bone thumb. A toggle can reveal the control it gates (setup's "Limit timeouts per team" reveals the timeouts stepper; off, its hint reads "Off: no limit, the app counts them").
- **Colour Picker:** eight team paints in two rows of four, 64 px tall; the selected swatch gets a 3 px bone border and a check; the other team's colour is marked "OTHER" but stays selectable.
- **Shirt Number Pad:** full-screen wall sheet with a 96 px numeral readout in the team paint and a 4-row grid of band keys (40 px numerals), growing with the screen between 64 and 96 px; the confirm key is green.

## Do's and Don'ts

### Do:
- **Do** run every band and stripe to both screen edges with 0 radius; stack bands edge to edge.
- **Do** reserve 12 px radius for press targets that sit inside a band.
- **Do** set every number in Barlow Condensed ExtraBold with tabular figures, sized with `fitNumeral()` or `useScale()` so it never wraps or jumps.
- **Do** make the stripe and +1 the largest, closest targets; keep rare and destructive actions (End, −1, delete chip) smaller and behind a confirm.
- **Do** keep every touch target at least 64 px.
- **Do** pair every vibration with a one-beat (650 ms) inversion of the stripe, break band or timeout screen.
- **Do** pick ink on team paint with `textOn()` and always show the team name on its paint.
- **Do** use band, band-high and scrim for depth and pressed states.

### Don't:
- **Don't** use grey rounded cards floating on black, or any tile with a gap around it on the wall.
- **Don't** add shadows, glows, blur or gradients.
- **Don't** paint team colours as pills, dots or chips standing alone; they are full-bleed bands with the name on them.
- **Don't** use green, amber or red for anything other than clock state, attention and warning.
- **Don't** introduce a second display face or set glanceable numbers in the system face.
- **Don't** signal with motion alone; the twin of a vibration is a paint inversion, not an animation.
