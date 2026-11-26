# Handball Table

Timekeeper & scorekeeper app for the table officials' desk at youth and friendly
handball matches. One phone, portrait, dark theme, large touch targets.

Built with Expo (SDK 58), React Native, TypeScript, expo-router and Zustand.

## Links

- Landing page (Android download): https://handball-table.vercel.app
- Releases (APK files): https://github.com/abouramd/handball-table/releases
- Expo project and builds: https://expo.dev/accounts/abouramd/projects/handball-table

The landing page lives in `landing/` and deploys to Vercel on every push to
`master` that changes `landing/` (other commits are skipped).

## Releasing a new Android version

1. Bump `version` and `android.versionCode` in `app.json`.
2. Build the APK: `npx eas-cli@latest build -p android --profile preview`.
3. Download the APK from the build page and attach it to a new GitHub release:
   `gh release create v1.1.0 handball-table.apk --title "Handball Table 1.1.0"`.
4. In `landing/vercel.json`, point the `/handball-table.apk` redirect at the new
   release, and update the version and size in `landing/index.html`. Push, and
   Vercel redeploys the landing page.

## Features

- **Match setup**: team names and colors, half length (20 / 25 / 30 / custom),
  optional timeout limit per team (off by default), timeout length, optional
  timeout restrictions, suspension
  length, half-time break length, "Save as default".
- **Game clock**: counts up (1st half 0:00 → 30:00, 2nd half 30:00 → 60:00),
  stops automatically at exactly the end of each half. Hold the clock to correct it.
- **Score**: +1 / −1 per team (never below 0).
- **Team timeouts**: no limit by default. The team's button counts the
  timeouts taken (0, 1, 2, 3, 4…). You can set a limit in setup, and the button
  then shows "1 / 3". A timeout stops the clock and opens a full-screen
  countdown (1:00 → 0:00) in the team's color, with a short vibration at 0:10
  left and a long one at 0:00. It then stays open ("time is up +0:07") until you
  start the clock on the whistle or close it.
- **Visual twin of every vibration**: the state stripe (or timeout screen)
  inverts for one beat, so a missed buzz is still seen.
- **Suspensions**: optional shirt number. Countdown chips run only while the
  game clock runs and carry over into the 2nd half. When one ends it vibrates
  and the chip keeps flashing "IN" until you tap it to confirm you saw it.
  Tap a running chip to delete one entered by mistake.
- **Undo and Redo** (goals, timeouts, suspensions, clock corrections); each button
  names what it will act on. A new action after Undo clears Redo, like in any editor.
- **Event log** and **match summary**.
- The match is saved after every change: a crash, app kill or phone lock never
  loses it. On launch, the home screen offers "Resume match in progress".
- The screen stays awake while a match is open. All alerts are vibrations (no sounds).

## Run it on your phone (Expo Go)

Requirements: Node.js 20+ and the **Expo Go** app on your phone
([iOS](https://apps.apple.com/app/expo-go/id982107779) /
[Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).

```bash
npm install
npx expo start
```

A QR code appears in the terminal.

- **Android**: open Expo Go and scan the QR code.
- **iOS**: scan the QR code with the Camera app, then tap the banner to open it in Expo Go.

The phone and computer must be on the same Wi-Fi network. If that doesn't work
(e.g. a sports hall or company network), use a tunnel: `npx expo start --tunnel`.

## Tests

All timer and rule logic lives in pure functions in `src/logic` and is covered
by Jest unit tests (clock math, half transitions, suspension pausing and
carry-over, timeout limits, undo, summary helpers):

```bash
npm test
npm run typecheck
```

## Build installable apps (EAS Build)

[EAS Build](https://docs.expo.dev/build/introduction/) builds the app in the
cloud; you don't need Xcode or Android Studio. You need a free Expo account.

```bash
npm install -g eas-cli      # or use: npx eas-cli@latest <command>
eas login
eas build:configure         # creates eas.json, links the project
```

Before the first build, change the app identifiers in `app.json`
(`ios.bundleIdentifier` and `android.package`, currently `com.handballtable.app`)
to something unique to you, e.g. `com.yourname.handballtable`.

### Android APK (install directly, no Play Store)

Add an APK profile to `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {}
  }
}
```

```bash
eas build -p android --profile preview
```

When the build finishes, open the link (or scan its QR code) on the phone to
download and install the APK. You may need to allow "Install unknown apps".

For the Google Play Store, use `eas build -p android --profile production`
(produces an `.aab`) and `eas submit -p android`.

### iOS

iOS builds need a paid **Apple Developer Program** membership.

- **Your own / test devices (ad hoc)**: register each device with
  `eas device:create`, then run `eas build -p ios --profile preview`.
  Install from the link the build gives you.
- **TestFlight / App Store**: `eas build -p ios --profile production`, then
  `eas submit -p ios`, and install through TestFlight.

## Project structure

```
src/
├── app/            # Screens (expo-router): home, setup, match, summary
├── components/     # Match UI pieces + ui/ (buttons, stepper, toggles, color picker)
├── hooks/          # useNow (display refresh), useMatchTicker (drives time rules)
├── logic/          # Pure rules + Jest tests (no React, no Date.now())
├── services/       # Vibration patterns
├── store/          # Zustand stores persisted with AsyncStorage
└── theme/          # Colors, spacing, sizes
```

### How the timing works

- The game clock stores `accumulatedMs` plus `runningSince` (a timestamp).
  Elapsed time is always computed from `Date.now()`, never by counting
  interval ticks, so there is no drift and the time is correct after the app was
  in the background.
- A suspension stores the **game-clock** time when it was given. Its remaining
  time is derived from the game clock, so it pauses whenever the clock is
  stopped (including during timeouts) and carries over into the 2nd half.
  This matches how officials note a suspension ("#7 until 32:15").
- `src/logic/matchReducer.ts` is the single pure state transition
  `(state, action) → { state, alerts }`. The store calls it and vibrates for the
  alerts it returns. Alerts that already fired are remembered in the saved state,
  so a vibration never repeats after a restart.

### Known limitation

A phone can't vibrate for an app that is in the background or locked unless the
app schedules notifications. The screen stays awake during a match, so this is
rare. If the phone does get locked, the clock stays correct and any due alert
fires as soon as the app is reopened.
