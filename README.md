# Math Practice App

An individual React + TypeScript assignment for arithmetic practice for children ages 7–12.

**Current scope: Phases 1–2 — Project Setup and Basic Interface.** The app has a responsive home page, shared header/navigation, and all specified routes. The home actions open clearly marked placeholder pages. Practice configuration, question sessions, persistence, statistics, and settings behavior will be added in later phases. This is not the finished assignment or a deployed release.

Repository: https://github.com/Hab1yer/math-practice-app (private during development). The instructor will need repository access before submission.

## Run locally

Use Node.js 22.12 or later; this setup was created with Node 24.14.1 and npm 11.11.0. Run commands from this repository's root, where `package.json` lives:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The development server uses a fixed port and exits if it is occupied; stop an old instance before starting another.

## Development commands

| Command                | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start the development server                    |
| `npm run lint`         | ESLint, with zero warnings allowed              |
| `npm run format`       | Format source and project documentation         |
| `npm run format:check` | Check formatting without changing files         |
| `npm test`             | Run component tests once                        |
| `npm run test:watch`   | Run tests while editing                         |
| `npm run typecheck`    | Check TypeScript project references             |
| `npm run build`        | Check TypeScript and generate `dist/`           |
| `npm run check`        | Run lint, formatting, tests, and build          |
| `npm run preview`      | Serve an existing production build at port 4173 |

Original reference Markdown is excluded from automatic formatting to preserve its content. Update only verified TODO checkboxes.

## Project structure

- `src/app`: root application component, route definitions, and navigation tests.
- `src/components/layout`: shared header, navigation, page container, and app layout.
- `src/pages`: home page, reusable coming-soon page, and unknown-route fallback.
- `src/services`: question generation, statistics, and storage services (reserved).
- `src/hooks`: reusable React hooks (reserved).
- `src/types`: shared question, session, mistake, statistics, and settings contracts.
- `src/utils`: pure helpers (reserved).
- `src/test`: shared test environment setup.

The shared types follow the specification's field names, numeric difficulty levels (1–4), and self-reported scoring. `SessionLength` narrows the specification's general number to the selected 5/10/20 options plus `continuous`. Settings names are explicit implementation choices because the specification lists preferences without defining an interface. Dates are ISO strings; choices, positive thresholds, and other runtime constraints still need validation in later phases. Types alone do not validate stored JSON.

## References and process

- `specification.md`: full original software specification.
- `TODO.md`: full implementation checklist, with verified progress.
- `DEVELOPMENT_LOG.md`: actual prompts, decisions, failures, and fixes.
- `TESTING.md`: results and checks still pending.

Both references were extracted from https://chatgpt.com/share/6acc2af2-7d74-83ea-ac67-198b9a8e2f92. The separate handoff guides the phased workflow. The reference transcript and original assignment text have not been supplied in this workspace; no claims about their contents beyond the handoff summary are made.

## Next phase

Phase 3 adds operation, difficulty, session-length, and review-mode selection on the practice setup page. All practice functionality remains on the checklist for later phases.

## Navigation

React Router serves `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`, with a fallback for unknown paths. Native links styled as buttons support keyboard navigation and browser history. Page changes update the browser title and move focus to the new heading; a skip link bypasses the header. The development server supports direct-route refreshes. Production hosting still requires an SPA fallback before release.

There is no backend, login, analytics, or collection of personal data. Persistence is planned for browser localStorage in Phase 9. Final deployment should build from repository root and publish `dist/`, with SPA routing configured when routing exists.
