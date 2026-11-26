---
version: 1
slug: "src-app-match-tsx"
primary_target: "src/app/match.tsx"
related_targets: ["src/app/index.tsx","src/app/setup.tsx","src/app/summary.tsx"]
---

# Match surface (and app-wide world)

Mode: Operate. One official at the table desk, eyes on the court, acting on whistles at arm's length in a noisy, bright sports hall.

Scope: all four screens (home, setup, match, summary) plus overlays (timeout, shirt number, clock correction, half-time). Product change in this round: team timeouts count UP from 0:00, signal at length−10 s and at length, keep counting past length until the clock is restarted or the timeout closed.

## Direction contract

THESIS: The screen is the club hall wall: horizontal painted bands stacked edge to edge, and one full-width stripe (the dado stripe) that wears the game's state and is the start/stop control. Refuses the category default of grey rounded cards floating on black.

OWN-WORLD: Near-black blue-grey wall paint (#101417) with a lighter band paint (#1B2429); bone-white stencil paint (#E8E4DA) for numerals; state paint green #2FBF71 running, amber #F2B233 stopped, red #E5484D for warnings; team colours painted as full-bleed bands, never pills. One numeral face, Barlow Condensed ExtraBold, at three fixed sizes (clock, score, chips); system face for small UI text. Square-cut bands, 12 px radius only on press targets inside bands.

STORY: The official glances and reads the time and score instantly, hits the stripe on the whistle, taps a team band to score, and every signal is felt (vibration) and seen (the stripe inverts for one beat).

FIRST VIEWPORT: Top bar (home, undo with what it undoes, end). Clock band: period label in tracked caps, clock at ~150 pt condensed. State stripe full width ~92 pt: action word large left, state caption right. Two team bands fill the rest, each its own paint: name, score ~112 pt, −1 / +1, timeout (left count), + suspension, suspension chips (#shirt amber + time).

FORM: Hall Wall, position 6 of my ordered list, seed:8f928f98db049117. Raises: one numeral face on fixed scale steps (Botanical Folio); one focal number per state (Catalog Sleeve); one numeral form at three sizes (Bitmap Specimen); stripe inverts for one beat as the visual twin of every vibration (Datamatics).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
