# AGENTS.md

## Cursor Cloud specific instructions

### Overview

HealthTrack is a standalone mobile health app built with **React + Vite + Capacitor**. There is no backend server — all data is stored locally on the device. AI food analysis calls the **Gemini API directly from the client** (key stored in app settings). The app is packaged as an Android APK via Capacitor.

### Running services

- **Frontend (dev)**: `cd app && npm run dev -- --host 0.0.0.0`

No backend required. Opens at `http://localhost:5173`.

### Tests

- **Frontend**: `cd app && npm run test` — Vitest + jsdom, no backend or API keys needed.
- **Lint**: `cd app && npm run lint` — ESLint. Note: the codebase has some pre-existing lint errors.

- **Visual check**: `cd app && npm run visual` — starts Vite, seeds ~75 days of demo data, screenshots every page in a Galaxy A56-sized viewport (Playwright/Chromium) into `app/.visual/` and fails on uncaught JS errors. Options are documented at the top of `app/scripts/visual/visual-check.mjs`.

See `CONTRIBUTING.md` for TDD conventions and test file locations.

### Autonomous improvement routine

A scheduled Claude routine improves the app every 2 hours. Its charter, backlog, research notes and per-run reports live in `journal/` (start with `journal/README.md`). User-visible changes get an entry in `app/src/data/changelog/` (one JSON file per change), shown in-app on the « Nouveautés » page.

### iOS parity routine (separate, runs in parallel)

A second scheduled routine, « Halcya iOS — parité avec Android » (hourly at :59 Paris time, sessions tagged `healthtrack-ios-routine`, PRs titled `[iOS] …`), ports the app to iOS and keeps the iOS version at the same feature level and version number as the Google Play version. Its charter, parity matrix and reports live in `journal/ios/` (start with `journal/ios/README.md`). The Android/product routine (`[Auto]` PRs) leads the product; the iOS routine follows and must never slow it down or change Android behaviour.

Ownership, so the two routines never step on each other:

- **iOS routine only**: `app/ios/**`, `app/scripts/ios/**`, `app/store-ios/**`, `.github/workflows/ios-*.yml`, `journal/ios/**`. The Android routine does not edit these, does not touch `[iOS]` PRs, and an `ios-*` workflow failing is not an Android failure to fix.
- **Android routine only**: `app/android/**`, the other workflows, `app/store/**`, `app/scripts/play/**`, and the rest of `journal/`. The iOS routine reads them but never writes there.
- **Shared** (`app/src/**`, `relay/**`, package files, Capacitor/Vite config): iOS changes must be additive, minimal and behind a platform/variant check (`Capacitor.getPlatform() === 'ios'` or the `appstore` distribution), with zero behaviour change for the `play` and `sideload` variants. Don't remove or "clean up" an iOS hook you find in shared code: the Android tests cover it on purpose.

### Gotchas

- AI food analysis requires a `GEMINI_API_KEY` set in the app's Settings page (stored locally, never in the repo).
- To build an APK: see `app/BUILD_APK.md`. CI builds are triggered automatically on push to `main`.
- The in-app update banner calls `https://api.github.com/repos/spreadzenox/HealthTrack/releases/latest` — the repo must be **public** for this to work without authentication.
