# Math Practice App

A React + TypeScript arithmetic practice app for children ages 7–12, built as an individual UConn programming assignment.

Choose operations and difficulty, answer a question, flip the card, and mark whether you got it right. Complete a fixed session or practice continuously, then see your totals and accuracy.

**Version 1.0.0: Phases 1–22 implemented, with manual verification items still open.** Includes personalized mistake review, mastery, statistics, keyboard controls, reduced motion, saved-card recovery and leave-session protection. All 335 tests and production checks pass. Chrome/Chromium and phone/tablet viewport checks are recorded; Safari, Firefox, Edge, screen-reader, true zoom/system-font and slower-device checks remain manual. See [testing](docs/TESTING.md) and the [release checklist](docs/RELEASE.md).

Live app: [Math Practice](https://math-practice-app-pi.vercel.app/).

## Run locally

Use Node.js 22.12 or later. From the repository root:

```sh
cd app
npm ci
npm run dev
```

Open [the local app](http://127.0.0.1:5173). The server requires port 5173 to be available.

## Development

Run these commands inside `app/`. Formatting also checks the README and maintained documentation in `docs/`, while preserving the original specification and checklist.

| Command                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `npm run check`        | Run lint, formatting checks, all tests, and production build |
| `npm test`             | Run unit and component tests                                 |
| `npm run test:watch`   | Run tests while editing                                      |
| `npm run lint`         | Check code with zero warnings allowed                        |
| `npm run format`       | Format code and maintained documentation                     |
| `npm run format:check` | Check formatting                                             |
| `npm run typecheck`    | Check TypeScript                                             |
| `npm run build`        | Build the app into `dist/`                                   |
| `npm run preview`      | Preview an existing build on port 4173                       |

## Repository map

```text
app/                   Application package and tool configuration
  src/
    app/               App setup, routes, shared state, and related tests
    components/        Shared layout and practice controls
    hooks/             Access to shared application state
    pages/             Screens and their interaction tests
    services/          Question generation and session logic
    types/             Shared data contracts
    utils/             Validation, practice options, and math helpers
    test/              Shared test setup
  public/              Static assets
  package.json         Development commands and dependencies
docs/                  Requirements, development records, and implementation notes
  verification/        Browser screenshots
```

Tests live alongside the code they verify. Tool configuration and generated folders (`node_modules/`, `dist/`, coverage, and `.local/`) live inside `app/`; generated folders are ignored by Git.

## Deployment layout

Set your hosting project's **Root Directory** to `app`, build with `npm run build`, and publish `dist` relative to that directory (`app/dist` from the repository root). Existing hosting projects must update their root-directory setting after this move. `app/vercel.json` supplies Vercel's SPA routing fallback so direct visits and refreshes on application routes load the React app. Verify these routes on the deployed URL after publishing.

## Documentation

- [Implementation checklist](docs/TODO.md) — completed phases and remaining work.
- [Software specification](docs/specification.md) — original requirements.
- [Implementation guide](docs/IMPLEMENTATION.md) — architecture, arithmetic rules, and current behavior.
- [Testing record](docs/TESTING.md) — actual results and checks still pending.
- [Development log](docs/DEVELOPMENT_LOG.md) — prompts, decisions, failures, and fixes.

The specification and checklist came from the [original shared reference](https://chatgpt.com/share/6acc2af2-7d74-83ea-ac67-198b9a8e2f92). Their content is preserved; only verified checklist boxes are updated. Both files are excluded from automatic formatting.

Practice data stays in the browser; the app has no backend, login, analytics, or collection of personal information. Production deployment and cross-browser release checks remain scheduled work.
