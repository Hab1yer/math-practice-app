# Math Practice App

An individual React + TypeScript assignment for arithmetic practice for children ages 7–12.

**Current scope: Phases 1–5 — setup, navigation, practice configuration, question generation, and multiple-choice answers.** The app has a responsive home page and setup form. Start Session passes the selected configuration to the practice page, which displays those choices. The tested generator now includes operation-specific answer choices; the current screen still explains that questions are coming soon. Question cards, interactive sessions, persistence, statistics, and settings behavior follow in later phases. This is not the finished assignment or a deployed release.

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

- `src/app`: root application component, configuration provider, route definitions, and navigation tests.
- `src/components/layout`: shared header, navigation, page container, and app layout.
- `src/components/practice`: operation, difficulty, and session-length selectors.
- `src/pages`: home, practice setup, configuration preview, coming-soon pages, and unknown-route fallback.
- `src/services`: arithmetic question generator, answer-choice generator, and difficulty rules; statistics/storage services are planned.
- `src/hooks`: shared practice-configuration access.
- `src/types`: shared question, session, mistake, statistics, and settings contracts.
- `src/utils`: shared practice options, random integers, shuffle, IDs, and complete question validation.
- `src/test`: shared test environment setup.

The shared types follow the specification's field names, numeric difficulty levels (1–4), and self-reported scoring. `SessionLength` narrows the specification's general number to the selected 5/10/20 options plus `continuous`. Settings names are explicit implementation choices because the specification lists preferences without defining an interface. Dates are ISO strings. Question arithmetic and choices now have runtime validation; settings thresholds and persisted data still need their later-phase validation. Types alone do not validate stored JSON.

## References and process

- `specification.md`: full original software specification.
- `TODO.md`: full implementation checklist, with verified progress.
- `DEVELOPMENT_LOG.md`: actual prompts, decisions, failures, and fixes.
- `TESTING.md`: results and checks still pending.

Both references were extracted from https://chatgpt.com/share/6acc2af2-7d74-83ea-ac67-198b9a8e2f92. The separate handoff guides the phased workflow. The reference transcript and original assignment text have not been supplied in this workspace; no claims about their contents beyond the handoff summary are made.

## Next phase

Phase 6 adds the question card: answer selection, locked choices after reveal, flipping, explanations, and self-reported result controls. Full session progression follows in Phase 7.

## Question generation

`generateQuestion(operationOrOperations, difficulty)` returns a validated `Question`. Operation-specific entry points are also exported from `src/services/questionGenerator.ts`. Mixed practice chooses among distinct enabled operations. Subtraction stays nonnegative at all levels. Division chooses a nonzero divisor and integer quotient, then multiplies to get the dividend.

The specification leaves some division ranges open. These explicit initial choices are enforced by both generation and validation:

| Difficulty   | Divisor | Quotient               | Maximum dividend |
| ------------ | ------- | ---------------------- | ---------------- |
| Beginner     | 1–5     | 0–5                    | 25               |
| Easy         | 1–10    | 0–10                   | 100              |
| Intermediate | 1–12    | 0–floor(144 / divisor) | 144              |
| Advanced     | 1–99    | 0–100                  | 9,900            |

Intermediate multiplication uses a 0–9 factor with either a 0–9 or 10–99 factor. Advanced uses a 10–99 factor with either a 0–9 or 10–99 factor. Addition/subtraction follow the specification's 10/50/100/1,000 operand maxima.

Every question has four unique nonnegative integer choices, including the correct answer. Normal generation uses the answer-choice service described below and shuffles all four positions. After at most three failed attempts, a validated deterministic fallback preserves the requested difficulty and the first enabled operation; it requires no randomness and uses a fixed choice order. Invalid configuration throws instead of silently changing the setup.

IDs use crypto UUIDs when available, with a timestamp/sequence fallback distinct within the current runtime. Question validation checks arithmetic, difficulty bounds, display text, source metadata, and all four choices. Tests include 8,000 reproducible generated samples, exact boundaries, invalid inputs, and broken-randomness recovery. The engine has not yet been connected to the child-facing interface.

## Multiple-choice answers

`src/services/answerChoices.ts` exports `generateDistractors(problem)` and `generateAnswerChoices(problem)`. It validates the supplied arithmetic, then builds a finite pool of operation-specific alternatives: missed/extra carries or borrows, confusing operations/operands, neighboring multiplication facts, neighboring quotients, and exact neighboring-divisor facts. Fractional, negative, duplicate, correct, and overly distant candidates are removed.

Up to two distinct operation-specific alternatives are chosen, then nearby whole numbers complete the three distractors. The nearby scan is capped at six offsets in each direction; there is no unbounded random retry loop. Addition/subtraction use a small answer window, extended to ten for unit carry/borrow mistakes. Multiplication permits adjacent-table offsets; division uses a small quotient window. These are documented heuristics, not a claim that each distractor matches a child's actual misconception.

Fisher–Yates shuffles the final four choices. Tests exercise zero/one answers, repeated candidates, maximum generated operands, safe integer limits, constant randomness, and a seeded 4,000-choice sample in which every correct-answer position must receive between 800 and 1,200 placements. The existing 8,000-question tests also run through the integrated answer service.

## Practice configuration

The setup form defaults to addition, Beginner, 10 questions, and regular practice. Native checkboxes allow mixed operations; Select All chooses all four. Native radio groups enforce one difficulty and one session length. Start Session is disabled without an operation, with an explanatory message. Mistake review is disabled with an explanation until practice history exists and review is implemented.

Submitted choices are held in React Context and displayed at `/practice/session`. Returning to setup restores those submitted choices for editing. They are not yet saved to localStorage; refreshing clears them, and leaving setup discards unsubmitted edits. A direct session visit without configuration provides a link to setup. No attempts or statistics are recorded yet. Settings-based defaults and refresh recovery remain for their scheduled phases.

## Navigation

React Router serves `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`, with a fallback for unknown paths. Native links styled as buttons support keyboard navigation and browser history. Page changes update the browser title and move focus to the new heading; a skip link bypasses the header. The development server supports direct-route refreshes. Production hosting still requires an SPA fallback before release.

There is no backend, login, analytics, or collection of personal data. Persistence is planned for browser localStorage in Phase 9. Final deployment should build from repository root and publish `dist/`, with SPA routing configured when routing exists.
