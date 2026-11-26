# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Ships to iOS and Android from one React Native + Expo codebase. Confirmed: ONE custom design language on both platforms (not native-per-OS styling); each OS's conventions are respected for safe areas, back gestures, system dialogs, keyboard and vibration.

## Users
One person at the table officials' desk (timekeeper + scorekeeper combined) during youth and friendly handball matches. Often a volunteer, parent or club member rather than a trained official. Holds the phone in one hand, eyes mostly on the court, glancing down to act on a whistle.

## Product Purpose
Replace the paper sheet, stopwatch and separate countdown timers at the table with one phone: game clock, score, team timeouts, 2-minute suspensions, half-time, and a match report. Success = the official never misses a whistle-driven action, never loses the match state, and finishes with a correct record.

## Operating Context
- Sports halls: noisy, mixed lighting, sometimes bright; phone on the table or in hand, viewed at arm's length.
- Actions are triggered by referee whistles and must be done in under a second: start/stop clock, goal, timeout, suspension.
- Feedback is by vibration only (no sounds: halls are loud and sounds would be confusing).
- A match lasts 2 × 20–30 min plus a break; the screen must never sleep, and the state must survive a crash, kill or lock.

## Capabilities and Constraints
- Game clock counts up per half (0 → H, then H → 2H) and stops exactly at the end of each half.
- Team timeouts stop the game clock; the game clock never auto-restarts. No limit on the number of timeouts by default (the app counts them up); an optional per-team limit can be set.
- Suspensions run on the game clock only and carry over into the 2nd half; any number at once; optional shirt number.
- Optional youth/friendly-off rules: max 2 timeouts per half, max 1 in last 5 minutes.
- Undo and redo of the last actions; manual clock correction; event log feeding a summary.
- Portrait phone only, English UI, dark by default, touch targets ≥ 64 px, one-thumb use.
- Timer logic is pure and unit-tested in `src/logic`; UI must not reimplement rules.

## Brand Commitments
Name: "Handball Table". No logo or brand assets exist yet.

## Evidence on Hand
None: no testimonials, users, or club partnerships. Do not invent any.

## Product Principles
1. Glanceable first: the clock and score must read from arm's length in a bright hall.
2. Whistle-speed actions: the frequent actions are the biggest, closest targets; rare or destructive ones are smaller and guarded.
3. Never lose the match: every change is persisted; mistakes are undoable rather than prevented by friction.
4. Say what the rules say: disabled actions explain why; timers show what officials expect to see.

## Accessibility & Inclusion
High contrast in bright light; never rely on color alone (team color always paired with the team name); large tabular numerals; screen-reader labels on every control.
