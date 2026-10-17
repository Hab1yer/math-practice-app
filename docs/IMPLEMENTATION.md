# Implementation guide

Source paths in this guide are relative to the `app/` directory. Run development commands from `app/`; production output is `app/dist/`. Historical log and testing entries describe the layout at the time of each check.

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

Only a self-report records an attempt. Each saved attempt includes session/question IDs, operands, correct and selected answers, difficulty, source, time, and self-reported result. The next card appears automatically with fresh selection/reveal/submission state and heading focus. Duplicate, stale, invalid, and post-completion submissions are ignored. Provider actions commit synchronously through a ref so queued clicks see the latest state; randomness and timestamps do not run inside React state-updater functions.

Consecutive identical expressions are avoided with five bounded generation attempts, then a validated alternate expression if randomness keeps repeating. Fixed completion stops generating cards and timestamps the session. Both fixed completion and explicit ending navigate to the session summary. If next-question generation fails, the answered attempt remains recorded and the session can still be ended.

The active question lives in React Context; refreshing ends that interaction without deleting saved answered attempts. Switching routes retains the current question but not an unsubmitted answer selection. Explicitly starting another session replaces the active one while preserving prior history. Active-card recovery and accidental-navigation protection remain Phase 18. Missing active-session data redirects to setup. The summary can restore the most recently completed saved session; with neither current nor saved completed data, it redirects to setup. An active session redirects away from the summary.

Settings controls card animations and explanations immediately through React Context and saves them to browser storage. Turning motion off sets the card transition to zero; the CSS also respects `prefers-reduced-motion`. The two faces share a grid area, with hidden backfaces preventing mirrored text. Inactive faces are excluded from keyboard and assistive-technology interaction. Additional Settings controls and default-practice integration remain Phase 11.

## Session summary

Completed sessions show attempted/correct/incorrect totals, rounded self-reported accuracy (0% when empty), configured operations, difficulty, and the number of completed review attempts. Practice Again starts a fresh regular session with the same operations, difficulty and length; Change Settings opens practice setup using that recap's configuration, including after reopening a saved summary. View Statistics links to the existing placeholder until Phase 10, and Return Home opens the home page. Practice Mistakes is disabled with an explanation until review mode is implemented in Phase 14. Reloading or reopening the summary restores the most recent completed saved recap.

## Browser storage

`src/services/storageService.ts` wraps localStorage. Two app-owned keys hold independent versioned envelopes: `mathPractice.settings` contains the full AppSettings contract, and `mathPractice.history` contains sessions and attempts together. Each has `{version: 1, data: ...}`. A single history write keeps attempts and totals consistent if a write fails. Session records save at start, after each report and at ending; unfinished records have no completion timestamp and do not restore active cards.

The initial migration accepts validated unversioned/version-0 records, and upgrades the envelope on the next write. Unsupported newer versions are preserved with writes paused for that category. Invalid JSON or records default only the affected category in memory and show a notice; subsequent valid actions can replace that category. No unrelated keys are removed. Runtime checks validate complete settings, arithmetic/difficulty, IDs/timestamps, count consistency, duplicate records and session-attempt relationships.

Storage access, read and write failures are caught. Capacity failure preserves the previous disk snapshot and new in-memory results, warns the user and retries on a later save. Settings failures do not block history saving, or vice versa. The store exposes defensive copies and a recent-session reader (50 by default, at most 100, newest first). Full history remains retained rather than silently deleting attempts; long-term archiving/usage measurement remains Phase 21. Sequential writes merge the latest stored history and preserve newer totals; simultaneous cross-tab writes are not transactional and are not claimed to be solved by localStorage.

Saved history loads into a dedicated React Context for the recap and future statistics. Existing settings controls persist their selected values; other setting fields are validated/stored with defaults until their UI is implemented. The active question, card selection and reveal state are not stored yet.

## Multiple-choice answer generation

`src/services/answerChoices.ts` exports `generateDistractors(problem)` and `generateAnswerChoices(problem)`. It validates the supplied arithmetic, then builds a finite pool of operation-specific alternatives: missed/extra carries or borrows, confusing operations/operands, neighboring multiplication facts, neighboring quotients, and exact neighboring-divisor facts. Fractional, negative, duplicate, correct, and overly distant candidates are removed.

Up to two distinct operation-specific alternatives are chosen, then nearby whole numbers complete the three distractors. The nearby scan is capped at six offsets in each direction; there is no unbounded random retry loop. Addition/subtraction use a small answer window, extended to ten for unit carry/borrow mistakes. Multiplication permits adjacent-table offsets; division uses a small quotient window. These are documented heuristics, not a claim that each distractor matches a child's actual misconception.

Fisher–Yates shuffles the final four choices. Tests exercise zero/one answers, repeated candidates, maximum generated operands, safe integer limits, constant randomness, and a seeded 4,000-choice sample in which every correct-answer position must receive between 800 and 1,200 placements. The existing 8,000-question tests also run through the integrated answer service.

## Practice configuration

The setup form defaults to addition, Beginner, 10 questions, and regular practice. Native checkboxes allow mixed operations; Select All chooses all four. Native radio groups enforce one difficulty and one session length. Start Session is disabled without an operation, with an explanatory message. Mistake review is disabled with an explanation until practice history exists and review is implemented.

Submitted setup choices are held in React Context and used to start `/practice/session`. Returning to setup restores those choices for editing during the current app lifetime; Start Session validates them and explicitly starts a fresh session. The resulting session configuration is saved with history, but the setup draft is not persisted and leaving setup discards unsubmitted edits. Direct session visits without an active session redirect to setup. Historical statistics, settings-based setup defaults, and active-card refresh recovery remain scheduled work.

## Navigation

React Router serves `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`, with a fallback for unknown paths. Native links styled as buttons support keyboard navigation and browser history. Page changes update the browser title and move focus to the new heading; a skip link bypasses the header. The development server supports direct-route refreshes. Production hosting still requires an SPA fallback before release.

There is no backend, login, analytics, or collection of personal data. Persistence uses localStorage for this browser and origin; changing devices, profiles, ports or domains does not transfer history. Clearing browser data removes progress. Final deployment should build from `app/` and publish its `dist/` directory, with SPA routing configured.
