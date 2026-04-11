# Contributing to HealthTrack

HealthTrack is developed using **test-driven development (TDD)**. All features must be testable and covered by tests where possible.

## Principles

1. **Everything must be testable end-to-end** (except purely visual/frontend polish). Critical frontend flows should have automated tests.
2. **Frontend**: key flows and components are tested (navigation, data loading, forms). Purely visual or CSS-only changes may have no tests.
3. **Write or update tests** when you add or change behavior. Prefer writing a failing test first, then implementing the feature.

## Running tests

### Frontend

```bash
cd app
npm install
npm run test
```

If you see a native binding error (e.g. rolldown on Windows), try `rm -rf node_modules && npm i` or use a supported Node version (see app/README.md).

## Adding new features

- **New frontend page or flow**: add tests in `app/src/**/*.test.jsx` using Vitest and React Testing Library.

## CI

Tests run on every push (see `.github/workflows/tests.yml`). The frontend test job must pass before merging.
