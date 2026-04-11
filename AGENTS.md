# AGENTS.md

## Cursor Cloud specific instructions

### Overview

HealthTrack is a health data hub with a **Python FastAPI backend** (port 8000) and a **React + Vite frontend** (port 5173). Data is stored in SQLite (auto-created `healthtrack.db`). No external databases or Docker required.

### Running services

- **Backend**: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Frontend**: `cd app && npm run dev -- --host 0.0.0.0` (proxies `/api` and `/health` to backend on port 8000)

Both must run simultaneously for full E2E testing.

### Tests

- **Backend**: `cd backend && pytest tests/ -v` — 23 tests, no API keys needed (providers mocked, temp SQLite).
- **Frontend**: `cd app && npm run test` — 12 tests via Vitest + jsdom, no backend needed.
- **Lint**: `cd app && npm run lint` — ESLint. Note: the codebase has 12 pre-existing lint errors.

See `CONTRIBUTING.md` for TDD conventions and test file locations.

### Gotchas

- Python packages install to `~/.local/bin` (user-level pip). Ensure `$HOME/.local/bin` is on `PATH` when running `uvicorn` or `pytest` directly.
- The root `requirements.txt` is for the ML/local model (PyTorch, heavy). Only `backend/requirements.txt` is needed for API development.
- AI provider features (image analysis) require `OPENAI_API_KEY` or `GEMINI_API_KEY` env vars, but all tests pass without them.
- The frontend Vite proxy config expects the backend on `localhost:8000`. If the backend port changes, update `app/vite.config.js`.
