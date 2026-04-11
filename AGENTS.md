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

See `CONTRIBUTING.md` for TDD conventions and test file locations.

### Gotchas

- AI food analysis requires a `GEMINI_API_KEY` set in the app's Settings page (stored locally, never in the repo).
- To build an APK: see `app/BUILD_APK.md`. CI builds are triggered automatically on push to `main`.
- The in-app update banner calls `https://api.github.com/repos/spreadzenox/HealthTrack/releases/latest` — the repo must be **public** for this to work without authentication.
