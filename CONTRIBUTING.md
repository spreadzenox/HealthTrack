# Contributing to HealthTrack

HealthTrack is developed using **test-driven development (TDD)**. All features must be testable and covered by tests where possible.

## Principles

1. **Everything must be testable end-to-end** (except purely visual/frontend polish). Backend, API, business logic, and critical frontend flows should have automated tests.
2. **Backend and API** are fully tested: persistence (db), parsing (providers), and HTTP endpoints (FastAPI TestClient). No feature should ship without tests.
3. **Frontend**: key flows and components are tested (navigation, data loading, forms). Purely visual or CSS-only changes may have no tests.
4. **Write or update tests** when you add or change behavior. Prefer writing a failing test first, then implementing the feature.

## Running tests

### Backend (required for every change)

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
# With coverage:
pytest tests/ --cov=. --cov-report=term-missing
```

Backend tests use a temporary SQLite DB (no production data). No API keys are needed (predict/meals use a mocked provider).

### Frontend

```bash
cd app
npm install
npm run test
```

If you see a native binding error (e.g. rolldown on Windows), try `rm -rf node_modules && npm i` or use a supported Node version (see app/README.md).

## Adding new features

- **New API endpoint**: add tests in `backend/tests/test_api.py` (and unit tests for new logic if needed).
- **New DB or provider logic**: add tests in `backend/tests/test_db.py` or `backend/tests/test_parse_utils.py` (or a new test file).
- **New frontend page or flow**: add tests in `app/src/**/*.test.jsx` using Vitest and React Testing Library.

## CI

Tests run on every push (see `.github/workflows/tests.yml`). Backend and frontend test jobs must pass before merging.
