# Development log

## 2026-10-15 — Phase 1 started

User request: “Read handoff.md and continue from the immediate task.”

- Read `C:/Users/gavin/Downloads/handoff.md` and limited implementation to Phase 1.
- Inspected the workspace: empty, no existing Git repository or applicable ancestor AGENTS.md files.
- Retrieved the complete software specification and implementation checklist from the linked shared conversation. Saved their original Markdown as `specification.md` and `TODO.md`; no requirements were rewritten.
- The web reader returned no conversation text; the browser loaded the documents successfully. A direct page download initially failed because sandbox DNS was unavailable, then succeeded with approved network access.
- Initialized Git on `main`. Existing configured commit identity is used.
- GitHub connector identifies the connected account as `Hab1yer`. Git's credential store contains both `Hab1yer` and `GavinJavierPino`; repository setup must explicitly select and verify `Hab1yer`.
- Plan: save references in their own commit; scaffold React/TypeScript with Vite; configure lint, formatting and component tests; add specification-aligned shared types; verify; document results; commit and push.

The example transcript PDF and original assignment text are not present. This log records only this project's actual work; no example debugging history is attributed to Gavin.

## 2026-10-15 — Phase 1 implementation and verification

- Verified the saved Git credential through GitHub's authenticated user endpoint as `Hab1yer`, created the private `math-practice-app` repository, and selected that identity for this repository. No credentials were written into project files or printed.
- Committed the unmodified references and initial plan as `746ad6b` (`docs: preserve specification and Phase 1 development plan`) and successfully pushed it to `origin/main`.
- Generated the official Vite React/TypeScript starter in a temporary subfolder, moved it into the repository root while preserving documents, and removed its demo interface/assets. The sandboxed npm attempt failed with DNS `ENOTFOUND`; the approved download succeeded.
- Added strict TypeScript, shared types, reserved source folders, and a small welcoming screen. Practice features and React Router are intentionally scheduled for Phase 2 onward.
- The starter used Oxlint. Replaced it with the checklist's ESLint, plus React hooks/refresh rules, and configured Prettier, Vitest, jsdom, and React Testing Library. npm warned that ESLint 9 was unsupported; verified plugin compatibility and upgraded to ESLint 10 before running lint.
- Settings field names are implementation choices based on the listed preferences. Session lengths are narrowed to 5, 10, 20, or continuous. Future phases still need runtime data validation and all scoring, persistence, and review behavior.
- Installed dependencies successfully; npm reported zero vulnerabilities. The lockfile is tracked. Applied formatting, then verified lint and formatting with no errors.
- `npm test`: one component test passed. It verifies the accessible app name and honest availability message, with no premature Start Practice action.
- `npm run build`: strict TypeScript and Vite production build passed. Output: `dist/`; JavaScript 220.43 kB (68.93 kB gzip), CSS 1.71 kB (0.80 kB gzip).
- `npm run dev`: Vite started at `http://127.0.0.1:5173/`. The browser initially timed out against the sandboxed server. Stopped that process and restarted with approved access on the same fixed port. The in-app browser then rendered the expected screen; visual inspection showed readable content and no browser console errors.
- Marked only the 21 verified Phase 1 checklist items complete. Phase 2 onward and all final-release checks remain pending.
- Verification was performed by the agent. Gavin has not yet performed his own checks. No app deployment occurred.

The verified foundation was committed and pushed as `6d8638c`. The remote main branch matched the local commit.

## 2026-10-15 — Phase 2: Basic Interface

User prompt: “proceed”, continuing the next phase identified in the previous result.

- Read the exact Phase 2 checklist and inspected the clean workspace before editing.
- Installed React Router. npm reported zero vulnerabilities.
- Added shared header, navigation, reusable page container, and layout. Continued the green/cream/yellow design with large home actions and responsive spacing.
- Added Start Practice, View Statistics, and Settings links styled as buttons. All six specified routes resolve, and unknown routes offer a way home. Later features use honest coming-soon pages rather than invented progress or inactive controls.
- Added a skip link, active navigation state, route titles, and focus movement to each page heading. Native links support keyboard activation and browser history.
- Replaced the original foundation test with seven navigation tests covering all home actions, return-home behavior, session/summary direct routes, unknown-route recovery, active navigation, keyboard activation, and heading focus.
- `npm run check` passed: lint, formatting, seven tests, and strict TypeScript/production build. JavaScript: 264.18 kB (83.63 kB gzip); CSS: 4.44 kB (1.55 kB gzip).
- Agent browser checks: all three home actions and return-home navigation worked; `/statistics` survived refresh; unknown routes recovered to home. Tab reached all three home actions and Enter opened Settings.
- Inspected desktop and a 390 × 844 viewport. The home actions stacked on the narrow screen; document width equaled scroll width (375 CSS pixels with scrollbar), with no horizontal overflow. Reset the viewport afterward. This does not substitute for later real-device or cross-browser testing.
- The live browser captured one transient Vite stylesheet reload error while the stylesheet file was being replaced. The completed stylesheet built successfully; a fresh-page browser check is recorded in TESTING.md.
- Only Phase 2 checkboxes are updated after verification. Phase 3 onward remains pending; no deployment or practice-data behavior was added.

Phase 2 was committed and pushed as `6932e6f`; remote main matched the local commit.

## 2026-10-15 — Phase 3: Practice Configuration

User prompt: “proceed”, continuing with the next phase identified in the prior response.

- Inspected the clean repository and exact Phase 3 checklist before editing.
- Added separate native checkbox/radio selector components with visible selected states, four operations, a Select All shortcut, four difficulty levels with descriptions, and 5/10/20/continuous session lengths.
- Defaults: addition, Beginner, 10 questions, regular practice. Empty operation selection disables Start Session and displays an associated live validation message.
- Included regular practice and a disabled mistake-review option with an explanation. There is no persisted history or eligible mistake source yet; later mistake tracking/review phases must connect it to actual data.
- Added a typed PracticeConfiguration and React Context provider. Submitting passes the configuration to the practice route. That page displays the actual choices and states that questions are coming soon; returning to setup restores submitted choices for editing.
- No question generation, attempts, persistence, or scoring was added. Unsubmitted edits and refresh recovery are not persisted. A fresh/direct session visit without configuration offers a setup link.
- Added five configuration tests and updated the seven navigation tests for the now-functional setup page. Tests cover defaults, empty-selection validation, Select All, mixed-operation handoff, exclusive difficulty/length choices, continuous/fixed lengths, editing submitted choices, keyboard checkboxes/radios, and direct session navigation.
- `npm run check` passed: lint, formatting, 12 tests across two files, and strict TypeScript/production build. JavaScript: 271.04 kB (85.21 kB gzip); CSS: 7.53 kB (2.24 kB gzip).
- Agent browser checks confirmed empty-selection validation, all four operations via Select All, Advanced + Continuous handoff, retained choices on return, and keyboard arrow selection of Intermediate. Desktop and 390 × 844 layout inspection showed no horizontal overflow (document/scroll widths both 390 CSS pixels). Viewport override was reset afterward.
- Updated only verified Phase 3 checklist items. Phase 4 question generation is next. Gavin's own manual testing and final release verification remain pending.

Phase 3 was committed and pushed as `270b4ef`; the remote main branch matched the local commit.

## 2026-10-15 — Phase 4: Basic Math Question Generation

User prompt: “proceed”, continuing the next phase identified in the preceding response.

- Read the exact Phase 4 checklist, difficulty rules, and Question data contract; confirmed the repository was clean.
- Added inclusive random integers, non-mutating Fisher–Yates shuffle, and unique IDs, each with tests.
- Added all four arithmetic generators, mixed-operation selection with duplicate operation removal, display text, and validation of the complete Question contract. Subtraction never becomes negative; division generates divisor/quotient first, preventing zero divisors and fractional answers.
- Documented unspecified division choices in README: Beginner quotients 0–5, Easy 0–10, Intermediate dividends at most 144, and Advanced divisors 1–99/quotients 0–100/dividends at most 9,900.
- Included basic neighboring answer choices so returned Question objects already contain four unique whole-number choices. Phase 5 remains pending for operation-specific plausible distractors and fuller answer-generation behavior. The child-facing screen is not connected to the service yet; this is scheduled for the card/session phases.
- Generation retries at most three times, then returns a validated deterministic question at the requested difficulty using the first enabled operation. Invalid configuration throws. The fallback intentionally avoids a failed random source and has a fixed choice order.
- Added reproducible 500-sample tests for every operation/difficulty combination (8,000 generated questions), exact min/max boundaries, both multiplication shapes, nonnegative subtraction, division limits, mixed selection, malformed questions, shuffle/ID utilities, and transient/permanent randomness failures.
- Initial `npm run check` passed 84 tests. During code review, identified that Array.every skips sparse-array holes, allowing a four-slot choice array with only three values through validation. Added a real regression test in `src/utils/validation.test.ts`; `npm test -- src/utils/validation.test.ts` failed with “expected true to be false” (one failure, 25 passed).
- Fixed the validator by spreading the choices before checking every entry; missing slots become undefined and are rejected. Reran the full check to verify the fix and the existing behavior. Final results are recorded in TESTING.md.
- Final `npm run check` passed lint, formatting, 85 tests across seven files, and strict TypeScript/production build. The production bundle is unchanged because the generator is not imported by the current interface.
- No browser interaction was needed for this service-only phase. The existing interface has no new question controls, and no new manual browser verification is claimed.

Phase 4 was committed and pushed as `aa9fd8a`; remote main matched the local commit.

## 2026-10-15 — Phase 5: Multiple-Choice Answers

User prompt: “proceed”, continuing the next phase named in the previous result.

- Inspected the clean repository, exact Phase 5 checklist, question generator, and validation before editing.
- Added a dedicated answer-choice service and connected it to normal question generation. It returns three unique incorrect answers and shuffles those with the correct answer.
- Added operation-specific candidates for carry/borrow errors, confusing operands/operations, neighboring multiplication facts, neighboring quotients, and integer neighboring-divisor facts. Plausibility windows discard overly distant alternatives; all candidates must be nonnegative safe integers distinct from the answer.
- Uses a finite candidate pool and a nearby scan capped at six offsets per direction rather than repeatedly drawing random numbers until they differ. This provides the checklist's bounded retry behavior even with constant randomness or many duplicate candidates.
- Preserved the emergency deterministic fallback for a broken random source. Invalid input arithmetic is rejected, and existing input objects are not modified.
- Added 33 answer-choice tests, including 16 arithmetic edge cases sampled 50 times each, recognizable operation-specific errors, fractional rejection, zero answers, bounded work under constant randomness, and safe integer limits.
- A seeded 4,000-choice sample verifies that all four positions receive the correct answer with broad balance (each between 800 and 1,200). Existing 8,000 generated-question samples exercise the integrated service as well.
- `npm run check` passed lint, formatting, 118 tests across eight files, and strict TypeScript/production build. No new dependencies were needed. This phase required no debugging fixes after the first full check.
- Only the 18 verified Phase 5 checklist items are completed. Question-card interaction remains Phase 6. This service-only phase did not alter the current interface; browser checks were not repeated or claimed.

Phase 5 was committed and pushed as `c3be9f2`; the remote main branch matched the local commit.

## 2026-10-15 — Phase 6: Question Card

User prompt: “proceed”, continuing with the next named phase.

- Read the exact Phase 6 checklist and inspected the clean repository. Continued the established frontend design using large answer buttons, green/cream colors, and aligned card faces.
- Added reusable AnswerChoice and QuestionCard components. Selection is mutable before reveal; Flip Card requires a selection. The back shows the original problem, correct/selected answers, optional explanation, and self-report buttons.
- Result callbacks use the child's self-report, not answer equality. A synchronous ref locks submission before the callback; both result controls then disable. A new question ID remounts the interaction state, resetting selection, flip state, and the lock.
- Connected the existing generators to an explicitly labeled one-card preview on the practice route. It shows Question 1 of 1, with the requested future-session configuration below. Try another card is available after reporting. No full sessions, attempt records, scoring totals, summaries, or persistence are claimed.
- Added working in-memory Card animations and Show explanations settings. Motion preference changes the CSS transition, and reduced-motion CSS overrides animation independently. Other Settings tasks remain pending.
- Added five card tests and one preferences integration test; updated previous navigation/setup tests. Initial full check passed 124 tests.
- Browser navigation initially found the old server stopped. Restarted one Vite server on the strict 5173 port with approved access; the preview then loaded normally.
- Agent browser checks confirmed selected/locked states, reveal, both answer values, explanations, and self-report behavior even when the selected answer was incorrect. Both result buttons disabled after reporting.
- Turned both preferences off in the browser; inspected a zero-second computed card transition and confirmed the explanation disappeared. Inspected mobile front/back at 390 × 844 with no horizontal overflow (document/scroll widths both 390), then reset the viewport. Reduced-motion CSS is implemented, but changing the operating-system motion preference was not manually tested.
- Added focus movement to result/new-question text. A new focus assertion caught a mistake in that edit: the front-heading ref was attached to the back instead. The check failed one test (123 passed); moved the ref to the front heading, then reran all checks.
- Final `npm run check` passed lint, formatting, 124 tests across ten files, and strict TypeScript/production build. Browser Tab/Enter verification then confirmed the new question heading receives focus after Try another card. Browser console showed no errors.
- Only the 35 verified Phase 6 checklist items are completed. Full session progression is Phase 7. All browser checks were agent verification, not Gavin's own testing.

Phase 6 was committed and pushed as `6482e1c`; remote main matched the local commit.

## 2026-10-16 — Phase 7: Practice Session

User prompt: “proceed”, continuing the next phase named in the preceding result.

- Inspected the clean repository and exact Phase 7 checklist. Replaced the one-card preview with an in-memory session provider and separate lifecycle service.
- Start validates configuration, copies enabled operations, creates the session ID/time and first question, and stores active state, index, totals, and completed attempts. Missing session data redirects to setup.
- Card callbacks now include the selected answer. Each self-report stores a full PracticeAttempt and increments attempted/correct/incorrect totals according to self-report, independently of answer equality. Duplicate/stale/question-mismatched/invalid/post-completion submissions are ignored.
- Provider actions update a synchronous ref before publishing React state, preventing queued events from reading stale session state. Random generation, IDs, and timestamps run outside state-updater callbacks.
- New cards advance immediately, reset selection/reveal/submission state, and receive focus. A short optional CSS entrance transition respects disabled animations and reduced-motion rules. Five bounded retries avoid a repeated expression, with a valid deterministic alternate for constant randomness.
- Added fixed progress and accessible labels, with no fixed progress bar in continuous mode. Fixed sessions stop at the configured 5/10/20 attempts. Continuous sessions continue until explicitly ended. End Session confirmation supports cancel/Escape, keyboard focus containment, and excluding the unfinished card.
- Added a basic completion page showing totals and home/setup links to satisfy this phase's completion flow. The full summary fields/actions remain Phase 8; no Phase 8 checkboxes were changed.
- A failed next-question generator preserves the just-recorded attempt and allows ending the session. Unit tests simulate this failure. State remains in memory only; persistence, refresh recovery, and route-leave guards remain later-phase work.
- Added 31 lifecycle tests and three complete-flow component tests; updated existing tests for full sessions. Tests cover fixed lengths, self-report totals, continuous sessions past 20 attempts, empty endings, duplicate/stale events, invalid setup, constant-randomness repeat avoidance across all 16 operation/difficulty combinations, complete five-card UI flow, end confirmation, and settings navigation retention.
- Initial `npm run check` passed 158 tests and build. Refined dialog cancellation to restore focus in an effect after removing inert from the session content, then prepared a final verification run.
- Live browser verification was blocked by the browser tool's URL security policy while trying to acquire the local app tab. No workaround was attempted, and no live browser or mobile checks are claimed for Phase 7. Automated interaction checks are recorded separately in TESTING.md.
- Final verification after the focus refinement passed lint, formatting, all 158 tests across twelve files, and strict TypeScript/production build. JavaScript: 287.87 kB (90.04 kB gzip); CSS: 11.29 kB (3.08 kB gzip). Marked all 33 implemented and automatically verified Phase 7 tasks complete; Phase 8 remains pending.

## 2026-10-17 — Live browser retry and adversarial tests

User prompt: “test the live browser verificatiton again and do an adversarial test”.

- Retried the previously blocked live verification. Started the local server and successfully opened the app in a fresh in-app browser tab. No URL policy rejection occurred in this retry.
- Completed a five-card mixed session with 5 attempts, 3 self-reported correct and 2 incorrect. Double-clicked a result: exactly one attempt counted, and the following card stayed unselected. Confirmed self-report deliberately overrides answer equality.
- In continuous practice, verified 2/1/1 totals, no fixed progress bar, dialog keyboard containment, Escape cancellation, focus restoration, retained selection after cancellation, and exclusion of a revealed but unreported third card on ending. Ending an empty session displayed 0/0/0.
- Visited Settings and returned: completed counts/current question survived, while the unsubmitted selection was lost as already documented. Animations off yielded a computed zero-second transition. Refreshing the summary returned to setup and reset in-memory state; persistence remains unimplemented.
- Inspected narrow card/dialog layouts at 390 × 844 with no horizontal overflow, saved a mobile empty-summary screenshot, and reset the viewport. Browser console had no captured error-level messages.
- Added eight service adversarial cases including a reproducible 1,000-answer sequence interleaved with malformed, stale, duplicate and conflicting reports, immutable prior state, replaced-session late reports and malformed configurations. Added three StrictMode provider cases exercising several competing actions in a single event.
- First full check passed all 169 tests but TypeScript caught an unsupported `exact` test-query option. Removed it and reran the complete check: lint, formatting, 169 tests across 14 files, and production build all passed. No production behavior defect was reproduced or production code changed in this pass.
- Updated TESTING.md with observed results and remaining verification limits. This task verifies Phase 7; it does not implement Phase 8 or claim full accessibility/cross-browser coverage.

## 2026-10-17 — Phase 8: Session Summary

User prompt: “proceed”, following the explanation that Phase 8 was next.

- Read the exact Phase 8 checklist/specification and used the frontend-design skill to extend the existing visual style. Kept the existing session lifecycle, completion timestamps and route guards; they already meet the completion requirements and have 5/10/20-question regression coverage.
- Expanded the summary with a yellow accuracy panel, zero-attempt message, totals, configured operation labels, difficulty and completed-review count. Accuracy uses self-reported results and rounds to a whole percentage.
- Practice Again starts a fresh regular session at the previous difficulty/operations/length. Change Settings returns to practice setup for editing. Added View Statistics and retained Return Home. Practice Mistakes is visibly disabled with an accessible coming-soon explanation until Phase 14; statistics still links to its existing placeholder until Phase 10.
- Added summary tests for empty sessions, same-configuration restart, retained setup choices, rounded accuracy and review-source counting. Extended the full fixed-session test to assert details and restart from nonzero totals.
- Live browser completed five questions with 3 right/2 wrong and displayed 60%; verified restart, empty ending, retained setup settings and both destination links. Inspected desktop/mobile screenshots, no horizontal overflow, restored viewport and checked the console (no errors captured).
- Marked the 16 Phase 8 items implemented, including the currently unavailable review action as described above. No Phase 9 storage or Phase 14 review behavior is claimed. Verification details and screenshots are in TESTING.md.
- Final `npm run check` passed lint, formatting, 172 tests across 15 files and strict TypeScript/production build. JavaScript: 289.76 kB (90.43 kB gzip); CSS: 11.85 kB (3.21 kB gzip).

## 2026-10-17 — Repository organization

User requested cleaning up the repository before Phase 9.

- Moved specification.md, TODO.md, TESTING.md and this log into docs/. Original specification and checklist contents are unchanged; earlier log references describe their names/locations at that time.
- Shortened the root README to current status, setup, commands, a repository map and linked documentation. Moved detailed implementation notes to docs/IMPLEMENTATION.md and corrected outdated summary/deployment wording.
- Updated screenshot links relative to the testing record's new location and preserved the formatter exclusions for both authoritative reference files.
- Kept source/tests in their established folders and tooling configuration at the root. Generated/local folders remain ignored; no application behavior changed and Phase 9 has not started.
- Verified moved specification/checklist Git object hashes match the prior originals and all local Markdown links resolve. Full check passed lint, formatting, 172 tests and production build.

## 2026-10-17 — Application package moved into app/

User asked whether package/config files could be organized outside the repository root, then authorized the proposed app/ layout with “do that”.

- Stopped the previous development server and moved source, public assets, npm manifest/lockfile, HTML, tool configuration and ignored local/generated folders into app/. Root now contains README.md, app/, docs/ and Git settings.
- Preserved relative imports and tool configuration; updated formatting commands to include maintained documentation outside the package while excluding original references. Kept package-lock dependencies unchanged.
- Updated README and implementation guide for running commands inside app/ and setting a hosting project's root directory to app with dist as output. No external hosting configuration was modified.
- Full check from the moved package passed lint, formatting, 172 tests and production build with unchanged production asset hashes/sizes. Restarted the server successfully from app/ and verified HTTP 200 for HTML and the transformed entry module. This is an HTTP smoke check, not new browser UI verification.
- Verified original reference/checklist hashes and generated-folder Git exclusions. Phase 9 remains pending.

## 2026-10-17 — Phase 9: Local Data Storage

User prompt: “Ok, let us proceed with phase 9”. Before this phase, user explicitly authorized switching this repository's future commit identity to Hab1yer; configured the repository-local identity with the account's ID-based private noreply address. Existing history was not rewritten.

- Read Phase 9 and the specification's persistence/failure requirements. Added a localStorage wrapper with full settings and an atomic session/attempt history envelope; no backend or data transmission was introduced.
- Added version-1 envelopes, validated legacy-version migration, defaults and runtime validation for loaded settings/history. Preserved future-version payloads by pausing writes, recovered affected invalid categories independently and left unrelated keys untouched.
- Connected saved settings/history to app startup. Saved session records at start/report/end and saved each reported attempt once with all fields. Restored the latest completed recap on summary visits/reloads, while leaving active question/selection recovery to Phase 18.
- Storage failures produce a friendly named status notice and preserve working session state. Capacity failures keep the old disk snapshot and new in-memory history for a later retry. Recent-session reads are sorted and capped; full history remains retained for later statistics/archiving.
- Added 31 service/validation cases and four StrictMode app-persistence tests, including invalid data, migration, denied access, quota, later retry, sequential multi-tab merges, double-click, remount and ending. An initially ambiguous status query found both card and saving status; named the saving notice and scoped its test query. Final full check passed lint, formatting, 207 tests across 17 files and production build.
- Live browser saved/reloaded settings; completed a five-card mixed 5/3/2 session; reloaded and closed/reopened the tab with identical saved summary totals and 60% accuracy. Verified settings in the fresh tab, restored both toggles to on, and checked the console (no captured errors). Saved a screenshot; local verification attempts remain stored on this origin.
- Full browser-process restart was not performed. Left that checklist verification unchecked and documented exact manual steps. Active-session recovery, simultaneous cross-tab concurrency guarantees, large-history archiving and additional setting controls remain later work. No Phase 10 items were changed.
- Final review refined restored-recap actions so Change Settings and Practice Again also populate setup configuration from the saved session. Verified the nondefault configuration through remount tests and the live Change Settings flow, then reran the full check.

## 2026-10-22 — Vercel routing preparation

User asked whether vercel.json needed to be added before deploying.

- Added app/vercel.json using Vercel's documented Vite SPA rewrite to /index.html. Its location matches the required Vercel Root Directory of app.
- Updated deployment instructions. This prepares routing; it does not deploy the site or confirm hosted route behavior. Application source and dependencies are unchanged.
- Checked JSON parsing, formatting and production build. Hosted direct-route/refresh verification remains a post-deployment check.

## 2026-10-22 — Phase 10: Statistics

User prompt: “its installed can we proceed to phase 10”, following the Vercel installation request. Confirmed Vercel is installed; no deployment action was needed for this phase.

- Read the exact Phase 10 checklist and statistics requirements. Applied the frontend-design skill, keeping the green/cream/yellow visual system and concise copy. Replaced the statistics placeholder with overall totals, operation/difficulty cards and ten recent-session cards, including dates, counts, accuracy and status.
- Derived all aggregates from saved attempts with self-report scoring and safe zero/rounding behavior. Memoized calculations and showed explicit empty states. Recent sessions sort newest first and distinguish completed, active and unfinished practice.
- Added explicit reset confirmation, preserving settings/unrelated keys. An atomic reset write precedes in-memory clearing; failed writes retain history and show an error. A successful reset also remounts the session provider to discard an active card or old summary. Added reset metadata/discarded-ID handling so sequential stale-tab saves do not revive erased records, while new sessions at the same timestamp remain saveable.
- Extracted the existing end-session confirmation into a reusable dialog, preserving its focus trap, Escape and autofocus behavior. Made PageContainer's eyebrow optional so statistics can begin with its functional title. Removed the unused coming-soon page.
- Added 22 tests across calculations, reset storage and page integration. Initial build caught a reset-context callback inferred as literal false; fixed the explicit type. Final review added the same-millisecond reset regression. Final full check passed lint, formatting, 229 tests in 19 files and production build (301.30 kB JS / 93.50 kB gzip, 14.04 kB CSS / 3.57 kB gzip).
- Port 5173 was occupied by another local project. Inspected only enough to identify the mismatch, left it running and started this app on temporary port 5174. Live checks began with empty history, completed five Beginner addition cards at 3/2, then one wrong Advanced division card. Verified combined 6/3/3/50%, independent breakdowns, newest-first status labels and reload persistence. Keyboard-cancelled reset without altering records.
- Inspected desktop/mobile layouts, saved screenshots, verified no narrow overflow and reset the viewport. A transient screenshot failure after resizing resolved after reload. No captured console errors. Test attempts remain on this local origin. Live permanent deletion was not performed; confirmed erasure/failure behavior is covered automatically.
- Updated documentation/checklist only for Phase 10. Phase 9's full browser-process restart check remains pending, and Phase 11 is next. No claim of hosted, real-device or full screen-reader verification is made.
