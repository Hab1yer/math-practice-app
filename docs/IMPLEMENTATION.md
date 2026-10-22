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

The active question, shuffled choices, selection and reveal state save as a compact checkpoint in the same history envelope. Startup restores that checkpoint and reconstructs attempts/review patterns from the ledger. Report/end/reset removes the old checkpoint; the next active card gets a fresh one. A malformed checkpoint is discarded independently with a notice, preserving saved answers. Home offers Resume; missing-session visits explain how to begin. The summary restores the latest completed saved session, while an active session redirects to its card.

The production entry uses a React Router data router. Navigation away from active practice opens a confirmation with Keep practicing or End and leave; browser back follows the same blocker. Native page leave/refresh also requests browser confirmation while active. The blocker reads a synchronous current-session getter so automatic completion cannot be blocked by stale React state. Ending-and-leaving does not race a summary redirect: completion navigation is initiated by result/end actions. Cancelling restores focus after inert content becomes available. Isolated legacy MemoryRouter tests skip the data-router guard; dedicated integration tests use the production router API.

Settings controls sound, card animations and explanations immediately through React Context and saves them to browser storage. Turning motion off sets the card transition to zero; CSS also respects `prefers-reduced-motion`. The two faces share a grid area, with hidden backfaces preventing mirrored text. Inactive faces are excluded from keyboard and assistive-technology interaction.

## Settings, defaults and clearing application data

Settings automatically saves card preferences and default operations/difficulty/session length. At least one default operation remains selected. A newly opened setup uses these defaults unless it is explicitly editing/restarting a prior configuration. Changing defaults invalidates previously submitted setup choices for the next setup, while leaving the current active session unchanged. Per-session overrides never overwrite saved defaults.

Sound is off by default. When enabled, a self-report schedules a quiet sine tone (660 Hz for right, 330 Hz for wrong) with a short fading gain envelope. Selection and reveal do not play sounds. Each AudioContext closes after its tone; missing/denied audio support does not block recording or advancing. Browser audio APIs are used without downloading media. Settings exposes the mastery threshold (default three correct reviews); Encouragement can be turned off independently.

Clear All Application Data uses a separate strong confirmation from Reset Statistics. Success removes settings, history, saved mistake patterns, aggregate/legacy keys and the temporary recovery journal, restores default preferences, discards active/setup state and navigates home. Only a blank history envelope/reset marker remains to prevent erased sessions being merged back. Unrelated browser keys are untouched. This explicit all-data action can erase app data from a newer schema; ordinary saving and statistics reset still preserve unsupported future schemas.

Because settings and history occupy separate keys, clearing first saves a journal of the known app keys, then deletes them and writes the blank history marker. Any failure attempts rollback. An interrupted clear is rolled back before the next startup loads settings/history. If recovery itself is blocked, normal writes pause and a friendly notice requests reload rather than overwriting the recovery data. A malformed journal cannot target arbitrary keys. The journal requires storage space; if it cannot be saved (for example, quota is exhausted), nothing is deleted. This is recovery protection, not a simultaneous cross-tab transaction guarantee.

## Session summary

Completed sessions show attempted/correct/incorrect totals, rounded self-reported accuracy (0% when empty), configured operations, difficulty, mode and the number of completed review attempts. Practice Again starts the same mode/configuration; it is disabled for a review session with no remaining matching patterns. Change Settings opens that recap's configuration, including after reopening a saved summary. Practice Mistakes opens review setup at an active pattern's difficulty with all operations selected. It is disabled when there are no active patterns. A review that ends because all matching patterns are mastered stores/displays that completion reason. Reloading the summary restores the latest completed saved recap.

## Browser storage

`src/services/storageService.ts` wraps localStorage. Two app-owned keys hold independent versioned envelopes: `mathPractice.settings` contains the full AppSettings contract, and `mathPractice.history` contains sessions, attempts and mistake patterns together. Each has `{version: 1, data: ...}`. A single history write keeps attempts, totals and patterns consistent if a write fails. Session records save at start, after each report and at ending; unfinished records have no completion timestamp; their optional compact checkpoint restores the active card.

The initial migration accepts validated unversioned/version-0 records, and upgrades the envelope on the next write. Unsupported newer versions are preserved with writes paused for that category. Invalid JSON or records default only the affected category in memory and show a notice; subsequent valid actions can replace that category. No unrelated keys are removed. Runtime checks validate complete settings, arithmetic/difficulty, IDs/timestamps, count consistency, duplicate records and session-attempt relationships.

Storage access, read and write failures are caught. Capacity failure preserves the previous disk snapshot and new in-memory results, warns the user and retries on a later save. Settings failures do not block history saving, or vice versa. The store exposes defensive copies and a recent-session reader (50 by default, at most 100, newest first); the dashboard displays ten sessions. Full history remains retained. A measured 5,000-attempt round trip used 2,729,130 estimated UTF-16 bytes and took 78 ms in the test environment, so automatic archiving was not necessary for that workload. No records or aggregate statistics are silently discarded. Sequential writes merge stored history; simultaneous cross-tab writes are not transactional.

Saved history loads into a dedicated React Context for recaps and statistics. Card selection/reveal changes persist without updating the global history context unnecessarily. Checkpoints contain one card rather than duplicating an entire session's attempts or all review patterns. Settings exposes Encouragement; short randomized supportive messages are generated during report actions, never during render. The preference can suppress them independently of sound and card motion.

## Mistake tracking

`src/services/mistakeTracking.ts` groups self-reported incorrect regular attempts by operation, difficulty and ordered operands. The JSON tuple forms a stable ID. Reversed facts remain distinct stored patterns. Selected-answer equality does not override the child's report. Each pattern stores both operands, correct answer, difficulty, incorrect count, latest incorrect timestamp, similar-correct count (initially zero) and mastered (initially false).

Patterns replay unique saved attempts in timestamp order, preserving report order on equal timestamps. The ledger is authoritative for counts, progress and mastery, so duplicate persistence cannot advance a pattern again. Correct linked review reports advance the original pattern; incorrect review reports increment/reset that original pattern rather than creating an unrelated child pattern. A regular miss on a previously mastered exact fact reopens it. Correct regular answers do not advance review progress. The projection uses maps and a stable sorted replay, rather than cloning every pattern for each historical event.

Patterns are an optional additive field in the version-1 history envelope. Startup backfills older histories in memory without writing; the next valid session save persists them. Pattern validation checks arithmetic/difficulty, ID, timestamp and counts. Invalid, duplicate, missing or inconsistent pattern records are rebuilt from valid answers with a friendly notice, without discarding those answers. Unsupported future history versions stay protected. The store exposes defensive pattern copies through `getMistakePatterns()`; there is no separate pattern write that could succeed while its answer fails.

Reset Statistics and Clear All Application Data clear these patterns together with history. Reset confirmation explicitly names saved mistakes. Stale-session protection also prevents erased patterns from returning.

## Related questions and review

`src/services/similarQuestions.ts` builds finite candidate pools for nearby operands, reversed addition/multiplication and inverse fact families. Division varies quotient/divisor and constructs an exact dividend. Subtraction never swaps into a negative fact. Candidates must pass the existing complete arithmetic/difficulty validator; inverse facts outside the selected level's bounds are excluded. Allowed operations are respected for both the source pattern and generated questions. The generator first chooses among strategies with fresh valid candidates, then chooses a candidate and creates shuffled answer choices. It avoids the original fact and the last five expressions when alternatives exist; only an exhausted candidate pool relaxes recency. Every review question and recorded review attempt carries the original `mistakePatternId`.

Setup displays active and matching counts. Review requires at least one active pattern matching the selected operations and difficulty. `src/services/mistakeReview.ts` ranks eligible patterns using logarithmic incorrect frequency, recency over a seven-day scale and remaining mastery progress. A small random jitter mixes close priorities; consecutive source patterns alternate when multiple are eligible. Candidate failures try the remaining finite pool.

The provider obtains the current saved pattern projection and threshold before each report. The session service applies the new report once before choosing another active pattern. Fixed-length sessions retain their limit; any review session finishes early when all matching patterns are mastered. Correct self-reports count toward the threshold since the last miss, even when the chosen answer differs. A wrong self-report resets progress. Threshold changes recalculate mastery from saved review events; raising it can reactivate patterns. Review mode, original pattern provenance and mastery completion reason are additive history fields. Validation requires linked reviews to refer to an earlier regular miss at the same difficulty, and checks mode, actual question operations and session totals.

## Accessibility implementation

Native buttons, checkboxes, radios, selects, disclosure controls and progress elements provide keyboard semantics. Number keys 1–4 select answers before reveal; modifiers, held keys, composition, editable controls, dialogs and inert content are excluded. Listener cleanup follows the card lifecycle. Each answer shows its shortcut, selected text/checkmark and pressed state. Focus moves to each question and revealed answer; their accessible descriptions include question position. The practice page preserves question focus rather than overwriting it with the page heading. Named polite status regions expose selection, report and completed-session progress.

`useReducedMotion` subscribes to media-query changes and combines them with the animation setting; CSS also suppresses motion when requested. Inactive card faces remain inert/hidden. Typography uses rem units, control borders are darker, content can wrap, and forced-color selected states have outlines. Contrast measurements, full keyboard/screen-reader interaction, 200% zoom and larger system-font checks are pending; these code changes are not a completed accessibility audit.

Phases 13–16 were initially implemented with testing deferred at the user's request. The release pass executed those tests and added recovery, production-router, scale and axe coverage. The final suite has 335 passing tests. Manual accessibility/browser-matrix limitations remain listed in TESTING.md and RELEASE.md.

## Statistics and reset

`src/services/statisticsService.ts` derives overall, operation and difficulty totals directly from validated attempts. Every report contributes once; answer equality is irrelevant. Accuracy is correct/attempted × 100, rounded to a whole percent, with 0% for an empty bucket. React memoizes these calculations while the history arrays are unchanged; no duplicate aggregate statistics are persisted.

The Statistics page shows all four operations and levels, including zero buckets, and up to ten recent sessions sorted by start time (newest first). Dates use the viewer's locale/timezone. Recent sessions include completed, currently active and unfinished records, with only reported attempts counted. Separate empty states cover no attempts and no sessions. Cards stack on narrow screens.

`src/services/mistakeStatistics.ts` derives active/mastered pattern lists, total review questions, correct review reports and the most frequently missed presented operations. All tied operations are shown. Pattern details sort by incorrect count descending, most recent miss descending, then stable ID. Each active fact shows its difficulty, last miss, count and labeled mastery progress; mastered patterns have a separate native disclosure. An explicit no-mistakes state covers an empty ledger.

Reset Statistics asks for explicit confirmation and states that history is erased, the current session is discarded and settings stay unchanged. It atomically writes an empty history with a validated reset timestamp; only a successful write clears React history and remounts the session provider to drop stale active/summary state. Derived aggregates immediately become zero. Failed writes preserve displayed/saved history and show an error; newer schema versions remain protected. Settings and unrelated browser keys are untouched.

The reset marker and discarded-session IDs prevent an already-open store from merging erased sessions back during later sequential saves. A new session can save even when created in the reset's same millisecond. Simultaneous cross-tab operations still have localStorage's nontransactional limitations; broad concurrency handling remains outside this phase. End Session and Reset Statistics share a confirmation dialog with keyboard containment, cancel autofocus and Escape support; cancelling returns focus to the opening button.

## Multiple-choice answer generation

`src/services/answerChoices.ts` exports `generateDistractors(problem)` and `generateAnswerChoices(problem)`. It validates the supplied arithmetic, then builds a finite pool of operation-specific alternatives: missed/extra carries or borrows, confusing operations/operands, neighboring multiplication facts, neighboring quotients, and exact neighboring-divisor facts. Fractional, negative, duplicate, correct, and overly distant candidates are removed.

Up to two distinct operation-specific alternatives are chosen, then nearby whole numbers complete the three distractors. The nearby scan is capped at six offsets in each direction; there is no unbounded random retry loop. Addition/subtraction use a small answer window, extended to ten for unit carry/borrow mistakes. Multiplication permits adjacent-table offsets; division uses a small quotient window. These are documented heuristics, not a claim that each distractor matches a child's actual misconception.

Fisher–Yates shuffles the final four choices. Tests exercise zero/one answers, repeated candidates, maximum generated operands, safe integer limits, constant randomness, and a seeded 4,000-choice sample in which every correct-answer position must receive between 800 and 1,200 placements. The existing 8,000-question tests also run through the integrated answer service.

## Practice configuration

Without saved preferences, setup starts with addition, Beginner, 10 questions and regular practice. Otherwise it loads the chosen defaults from Settings. Native checkboxes allow mixed operations; Select All chooses all four. Native radio groups enforce one difficulty and one session length. Start Session is disabled without an operation or without matching active patterns in review mode, with an explanation. Review mode itself is disabled when no active patterns exist.

Submitted setup choices are held in React Context and used to start `/practice/session`. Returning to setup restores those choices for editing during the current app lifetime unless defaults changed; Start Session validates them and explicitly starts a fresh session. Session configuration is saved with history, but setup drafts are not persisted. Unfinished cards and their selected/revealed state are recovered independently from the saved checkpoint.

## Navigation

React Router serves `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, `/settings` and `/privacy`, with a fallback for unknown paths. Native links support keyboard navigation and history. Page changes update the title/focus; active cards retain their own question focus. Statistics and Settings use lazy imports with a loading message. A top-level error boundary gives a safe home action rather than rendering exception details. Development diagnostics are stripped from production. Regular and related generation have finite retries and validated deterministic fallbacks. Vercel's SPA rewrite supports direct routes.

There is no backend, login, analytics, or collection of personal data. Persistence uses localStorage for this browser and origin; changing devices, profiles, ports or domains does not transfer history. Clearing browser data removes progress. Final deployment should build from `app/` and publish its `dist/` directory, with SPA routing configured.
