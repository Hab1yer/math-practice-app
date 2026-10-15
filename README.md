# Math Practice App

An individual React + TypeScript assignment for arithmetic practice for children ages 7–12.

**Current scope: Phase 1 — Project Setup.** The app displays a welcoming foundation screen. Practice, routing, storage, statistics, and settings behavior will be added in later phases. This is not the finished assignment or a deployed release.

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

- `src/app`: root application component and its component test.
- `src/components`: reusable interface components (reserved).
- `src/pages`: route-level screens (reserved).
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

Phase 2 adds shared page layout, the home page actions, React Router, and route placeholders. All practice functionality remains on the checklist for later phases.

There is no backend, login, analytics, or collection of personal data. Persistence is planned for browser localStorage in Phase 9. Final deployment should build from repository root and publish `dist/`, with SPA routing configured when routing exists.
