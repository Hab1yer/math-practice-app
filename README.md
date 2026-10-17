# Math Practice App

An individual React + TypeScript assignment for arithmetic practice for children ages 7–12.

**Current scope: Phases 1–7, including full in-memory practice sessions.** Choose a configuration, select an answer, flip the card, and self-report the result. Each report records one attempt and advances automatically. Fixed sessions stop at 5, 10, or 20 questions; continuous sessions end through confirmation. A basic completion page shows totals. Persistence, the fuller summary, statistics, and the remaining preferences follow in later phases. This is not the finished assignment or a deployed release.

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

- `src/app`: root component, configuration/card-preference/session providers, routes, and navigation tests.
- `src/components/layout`: shared header, navigation, page container, and app layout.
- `src/components/practice`: setup selectors, answer buttons, question card, and end-session dialog.
- `src/pages`: home, setup, active session, basic completion page, card settings, and route fallbacks.
- `src/services`: arithmetic/answer generators, difficulty rules, and session lifecycle; statistics/storage are planned.
- `src/hooks`: shared configuration, card preferences, and active-session access.
- `src/types`: shared question, session, mistake, statistics, and settings contracts.
- `src/utils`: practice options, random integers, shuffle, IDs, question validation, and explanations.
- `src/test`: shared test environment setup.

The shared types follow the specification's field names, numeric difficulty levels (1–4), and self-reported scoring. `SessionLength` narrows the specification's general number to the selected 5/10/20 options plus `continuous`. Settings names are explicit implementation choices because the specification lists preferences without defining an interface. Dates are ISO strings. Question arithmetic and choices now have runtime validation; settings thresholds and persisted data still need their later-phase validation. Types alone do not validate stored JSON.

## References and process

- `specification.md`: full original software specification.
- `TODO.md`: full implementation checklist, with verified progress.
- `DEVELOPMENT_LOG.md`: actual prompts, decisions, failures, and fixes.
- `TESTING.md`: results and checks still pending.

Both references were extracted from https://chatgpt.com/share/6acc2af2-7d74-83ea-ac67-198b9a8e2f92. The separate handoff guides the phased workflow. The reference transcript and original assignment text have not been supplied in this workspace; no claims about their contents beyond the handoff summary are made.

## Next phase

Phase 8 expands the completion page with accuracy, practiced operations/difficulty, review counts, and all specified next actions. Phase 9 adds persistent storage.

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

IDs use crypto UUIDs when available, with a timestamp/sequence fallback distinct within the current runtime. Question validation checks arithmetic, difficulty bounds, display text, source metadata, and all four choices. Tests include 8,000 reproducible generated samples, exact boundaries, invalid inputs, and broken-randomness recovery. The engine is connected to practice sessions.

## Practice sessions

Use Start Practice → Start Session to begin with your selected operations, difficulty, and length. Fixed practice shows Question X of Y, attempted/correct/incorrect totals, and a labeled native progress bar. Continuous practice shows the question count without a fixed progress bar. End Session opens a confirmation dialog; cancel/Escape returns to the current card, while confirming ends without counting the unfinished card.

Answer buttons expose selected state with both a checkmark/text and `aria-pressed`. Flip Card stays disabled until selection. Revealing shows the original problem, correct answer, selected answer, and optional explanation; the front becomes inert and its choices lock. I Got It Right/Wrong sends the child's self-report once, even if it differs from answer equality. A synchronous submission lock prevents both controls from firing for one card.

Only a self-report records an attempt. Each stored in-memory attempt includes session/question IDs, operands, correct and selected answers, difficulty, source, time, and self-reported result. The next card appears automatically with fresh selection/reveal/submission state and heading focus. Duplicate, stale, invalid, and post-completion submissions are ignored. Provider actions commit synchronously through a ref so queued clicks see the latest state; randomness and timestamps do not run inside React state-updater functions.

Consecutive identical expressions are avoided with five bounded generation attempts, then a validated alternate expression if randomness keeps repeating. Fixed completion stops generating cards and timestamps the session. Both fixed completion and explicit ending navigate to a basic recap with totals. If next-question generation fails, the answered attempt remains recorded and the session can still be ended.

All records currently live in React Context. Refreshing clears the session; switching routes retains completed attempts and the current question, but not an unrevealed answer selection. Explicitly starting another session replaces the current one. Persistence and accidental-navigation protection remain later-phase work. Missing session/summary data redirects to setup, and an active session redirects away from the completion page.

Settings controls card animations and explanations immediately through React Context. Turning motion off sets the card transition to zero; the CSS also respects `prefers-reduced-motion`. The two faces share a grid area, with hidden backfaces preventing mirrored text. Inactive faces are excluded from keyboard and assistive-technology interaction. Preferences currently reset on refresh; persistence and the rest of Settings remain scheduled work.

## Session summary

Completed sessions show attempted/correct/incorrect totals, rounded self-reported accuracy (0% when empty), configured operations, difficulty, and the number of completed review attempts. Practice Again starts a fresh regular session with the same operations, difficulty and length; Change Settings opens practice setup with submitted choices retained. View Statistics links to the existing placeholder until Phase 10, and Return Home opens the home page. Practice Mistakes is disabled with an explanation until review mode is implemented in Phase 14. Results remain in memory until Phase 9 storage work.

## Multiple-choice answer generation

`src/services/answerChoices.ts` exports `generateDistractors(problem)` and `generateAnswerChoices(problem)`. It validates the supplied arithmetic, then builds a finite pool of operation-specific alternatives: missed/extra carries or borrows, confusing operations/operands, neighboring multiplication facts, neighboring quotients, and exact neighboring-divisor facts. Fractional, negative, duplicate, correct, and overly distant candidates are removed.

Up to two distinct operation-specific alternatives are chosen, then nearby whole numbers complete the three distractors. The nearby scan is capped at six offsets in each direction; there is no unbounded random retry loop. Addition/subtraction use a small answer window, extended to ten for unit carry/borrow mistakes. Multiplication permits adjacent-table offsets; division uses a small quotient window. These are documented heuristics, not a claim that each distractor matches a child's actual misconception.

Fisher–Yates shuffles the final four choices. Tests exercise zero/one answers, repeated candidates, maximum generated operands, safe integer limits, constant randomness, and a seeded 4,000-choice sample in which every correct-answer position must receive between 800 and 1,200 placements. The existing 8,000-question tests also run through the integrated answer service.

## Practice configuration

The setup form defaults to addition, Beginner, 10 questions, and regular practice. Native checkboxes allow mixed operations; Select All chooses all four. Native radio groups enforce one difficulty and one session length. Start Session is disabled without an operation, with an explanatory message. Mistake review is disabled with an explanation until practice history exists and review is implemented.

Submitted choices are held in React Context and used to start `/practice/session`. Returning to setup restores those choices for editing; Start Session validates them and explicitly starts a fresh session. Configurations are not saved to localStorage, and leaving setup discards unsubmitted edits. Direct session visits without a valid session redirect to setup. Attempt records and session totals now work in memory; historical statistics, settings-based defaults, and refresh recovery remain scheduled work.

## Navigation

React Router serves `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`, with a fallback for unknown paths. Native links styled as buttons support keyboard navigation and browser history. Page changes update the browser title and move focus to the new heading; a skip link bypasses the header. The development server supports direct-route refreshes. Production hosting still requires an SPA fallback before release.

There is no backend, login, analytics, or collection of personal data. Persistence is planned for browser localStorage in Phase 9. Final deployment should build from repository root and publish `dist/`, with SPA routing configured when routing exists.
