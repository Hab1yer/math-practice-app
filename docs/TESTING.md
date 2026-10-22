# Testing record

Current layout: run all npm commands from `app/`. Earlier entries describe paths as they existed when those checks ran.

## 2026-10-17 — App directory move

- Moved application source, package/lockfile, HTML entry point, tool configuration and existing generated dependencies/build into `app/`. No source imports or routes changed.
- `npm run check` from `app/` passed lint, formatting (including maintained repository documentation), 172 tests across 15 files and production build. The production asset hashes and sizes match the prior build.
- Restarted the development server from `app/`; both the HTML page and transformed `/src/main.tsx` returned HTTP 200. This was an HTTP smoke check, not another manual browser session.
- Verified generated folders stay ignored and the original specification/checklist Git object hashes remain unchanged. README now documents `cd app` and deployment root/output settings. External hosting settings were not changed.

## Phase 1

Agent verification on 2026-10-15 using Node 24.14.1 and npm 11.11.0:

| Check                   | Result                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Dependency installation | Passed; lockfile saved, npm reported zero vulnerabilities                                    |
| `npm run lint`          | Passed, zero warnings                                                                        |
| `npm run format:check`  | Passed                                                                                       |
| `npm test`              | Passed: one test, one file                                                                   |
| `npm run build`         | Passed: strict TypeScript and Vite build to `dist/`                                          |
| `npm run dev`           | Passed: fixed port 5173, strict-port configuration                                           |
| In-app browser          | Expected title and availability message rendered; visual layout inspected; no console errors |

The component test checks the app's accessible main landmark, title, and honest availability message. It also verifies that no nonfunctional Start Practice button is presented before practice exists.

The browser could not connect to the sandboxed server. After stopping that server and restarting it outside the sandbox with approval, the browser connected successfully. Only one development server was left running, at `http://127.0.0.1:5173/`.

To reproduce: run `npm ci`, then `npm run check`, then `npm run dev`. Inspect the welcome screen at the address above. `npm ci` and the combined `check` script were not separately exercised; their constituent installation/check commands were verified as listed. The production preview server has not been manually checked.

## Phase 2

- `npm install react-router-dom`: passed; npm reported zero vulnerabilities.
- `npm run check`: passed lint, formatting, seven navigation tests, and strict TypeScript/production build.
- Tests verify all three home actions and return-home links, direct session/summary paths, unknown-route fallback, keyboard activation, active navigation, page titles, and heading focus.
- Agent browser checks passed for all home actions, return-home behavior, refresh at `/statistics`, and unknown-route recovery.
- Keyboard check: Tab reached Start Practice, View Statistics, and Settings in order; Enter opened Settings and focus moved to its heading.
- Desktop and narrow-screen visual checks completed. At a 390 × 844 viewport, the home page stacked correctly with no horizontal overflow. Viewport override was reset. This was browser emulation, not a real phone test.
- One transient development stylesheet reload error occurred while replacing the stylesheet. Final build and fresh-page verification confirm the completed stylesheet is available.

To reproduce current checks, run `npm run check` and `npm run dev`. The combined check script has now been exercised successfully. `npm ci` and production-preview verification remain pending.

## Phase 3

- `npm run check`: passed lint, formatting, 12 tests across two files, and strict TypeScript/production build.
- Five new tests cover setup defaults, unavailable review explanation, empty operation validation, Select All, mixed-operation configuration handoff, continuous and fixed lengths, exclusive radio selection, retained submitted choices for editing, native keyboard behavior, and a direct session visit without configuration.
- Agent browser checks confirmed disabled Start Session with no operations, Select All, Advanced/Continuous handoff, and restoration of submitted choices for editing. Arrow-left on Advanced selected Intermediate and cleared Advanced.
- Inspected the complete desktop and 390 × 844 setup layouts; no horizontal overflow (document width and scroll width both 390 pixels). Viewport override was reset. This was emulation, not a real-device test.
- Submitted choices currently live in memory only. Refresh and unsubmitted-edit persistence are intentionally deferred. Starting does not generate questions or record attempts yet.

## Phase 4

- Added service and utility tests across all four operations and difficulty levels. Seeded randomness makes 8,000 sampled questions reproducible, with separate exact-boundary checks.
- Tests verify arithmetic, operand/factor/divisor ranges, whole-number division, zero answers, nonnegative subtraction, mixed-operation selection, input rejection, choice uniqueness, shuffled arrays, unique IDs, malformed question validation, and bounded recovery from invalid randomness.
- Actual debugging: a new sparse-answer-array regression test failed before the fix (one failed, 25 passed in the validator file). Spreading the array before validating its entries closes the hole-skipping behavior of Array.every.
- Final `npm run check`: passed lint, formatting, 85 tests across seven files, and strict TypeScript/production build. Browser checks were not repeated because this phase adds service logic without connecting it to the interface.

## Phase 5

- `npm run check`: passed lint, formatting, 118 tests across eight files, and strict TypeScript/production build.
- Added 33 tests for answer-choice generation: three distinct incorrect answers, exactly one correct answer in four choices, whole-number/nonnegative filtering, zero/one/max-answer cases, operation-specific mistake candidates, and immutability.
- Constant-randomness tests verify that duplicate-heavy candidate sets finish with bounded work. The nearby scan is limited to six offsets in either direction; no unbounded random retries are used.
- A seeded 4,000-choice sample passes the broad correct-position balance check (all four positions between 800 and 1,200 placements). This is a reproducible regression check, not a proof of statistical randomness.
- The existing 8,000 generated-question samples pass with the new choice service integrated. Broken-randomness fallback tests continue to pass.
- Interface behavior is unchanged; no new manual browser checks are claimed.

## Phase 6

- Final `npm run check`: passed lint, formatting, 124 tests across ten files, and strict TypeScript/production build.
- Five new card tests cover selection requirements, changing selections, answer locking, both revealed answer values, self-report semantics, duplicate submission prevention, new-question reset, fixed/continuous labels, keyboard interaction, and disabled animations/explanations.
- One new integration test verifies that the real Settings controls change preview behavior and that Try another card resets the interaction. Existing setup/navigation tests were updated for the working card/settings screens.
- A focus assertion caught an incorrect ref placement during refinement (one test failed, 123 passed). Corrected the front-heading ref and verified the complete suite passed again.
- Agent browser checks: actual generated card; disabled/enabled Flip Card; reveal and selected/correct answers; self-report overriding answer equality; both result buttons disabling; Try another card reset; Tab/Enter movement to the next question heading; no console errors.
- Settings browser check: animations off produced a computed transition duration of `0s`; explanations off removed the explanation while reveal continued to work.
- Inspected front and back desktop/mobile layouts at 390 × 844. No horizontal overflow; viewport reset afterward. The reduced-motion CSS is present, but OS preference switching and screen-reader testing remain pending.
- This is explicitly a one-card preview; full session behavior, saved attempts, and aggregate scoring are not implemented yet.

## Phase 7

- Final `npm run check` passed lint, formatting, 158 tests across twelve files, and strict TypeScript/production build after the dialog-focus refinement.
- New lifecycle tests cover 5/10/20-question stopping, full attempt fields and self-report totals, duplicate/stale/invalid/post-completion events, independent configuration copies, zero-attempt ending, continuous practice beyond fixed lengths, and preserving an attempt when next-question generation throws.
- Constant-randomness tests cover non-repeating valid consecutive expressions for all 16 operation/difficulty combinations.
- New component flows complete a five-question session (3 correct/2 incorrect), verify no counting at selection/reveal, check progress/reset/final recap, cancel and confirm continuous endings, exclude unfinished cards, and retain active session progress when visiting Settings.
- Existing card tests still verify duplicate control locking and self-report semantics; callbacks now also pass the selected answer for attempt recording.
- Live browser verification is pending: the browser tool rejected access under its URL security policy. No alternate browser or workaround was used. Mobile layout, real browser focus behavior, and manual end-to-end checks remain pending for this phase.
- Records remain in memory only. Refresh recovery, durable storage, and navigation-loss prevention are not verified or implemented here.

Later full summaries, persistence, full accessibility, real-device, and cross-browser flows remain pending. Gavin's own manual verification has not been performed by the agent.

## 2026-10-17 — Live retry and adversarial verification

The in-app browser retry succeeded against the local development server. This completes the previously blocked Phase 7 live checks listed below; the earlier policy rejection remains part of the historical record.

| Live check                             | Observed result                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Five-question mixed session            | Completed with exactly 5 attempted, 3 correct, 2 incorrect                                                     |
| Double-click self-report               | One attempt recorded; next card remained unselected with Flip Card disabled                                    |
| Self-report semantics                  | Reporting right counted as right even when the selected answer was wrong                                       |
| Continuous practice                    | Continued with 2 attempted, 1 correct, 1 incorrect; no fixed progress bar                                      |
| Cancel ending                          | Tab/Shift+Tab stayed in the dialog; Escape closed it, restored End Session focus and retained selection/totals |
| Confirm after reveal without reporting | Unfinished third card excluded; recap remained 2/1/1                                                           |
| End before any answers                 | Recap displayed 0/0/0 without crashing                                                                         |
| Settings navigation                    | Completed counts and current question retained; unsubmitted selection cleared (known limitation)               |
| Preferences                            | Animations off produced a computed 0s transition; explanations off retained working reveal                     |
| Narrow viewport                        | Card and dialog inspected at 390 × 844; document and scroll widths both 390; viewport reset afterward          |
| Refresh recap                          | Returned to setup without a blank screen; in-memory data/defaults reset as currently documented                |
| Browser console                        | No captured error-level messages                                                                               |

Added 11 adversarial tests in two files. A seeded continuous session processes 1,000 answers with stale IDs, NaN selections, nonboolean reports, replayed reports and conflicting duplicate reports interleaved. Every step verifies counts, attempt length, question validity and progression; prior state is frozen to catch mutation. Additional cases reject six malformed configurations and late answers from a replaced session with identical arithmetic. Three provider tests queue competing reports, end-before-report and report-before-end in one event under React StrictMode.

All 169 tests across 14 files passed. The first full check then caught unsupported `exact` options in the new Testing Library test code; removed those options and reran `npm run check`, which passed lint, formatting, tests and strict TypeScript/production build. No production code changes were needed for these checks.

Screenshot evidence: [zero-attempt mobile summary](verification/phase7-empty-summary-mobile.jpg). These are agent checks on the development server, not real-device, cross-browser, screen-reader, production-preview or OS reduced-motion verification. Phase 8 remains pending; storage and route-leave protection remain later work.

## Phase 8

- Final `npm run check`: passed lint, formatting, 172 tests across 15 files, and strict TypeScript/production build.
- Expanded the complete-session test to verify 60% self-reported accuracy, operation/difficulty/review details, and a fresh five-card session after Practice Again.
- New summary tests verify zero-attempt safety, mixed/Advanced/Continuous configuration reuse, disabled review with an accessible explanation, home/statistics destinations and retained choices through Change Settings. A constructed completed-session fixture verifies 2/3 rounds to 67% and only review-source attempts count toward review completion; this fixture does not implement review generation.
- Existing lifecycle tests continue to verify exact 5/10/20 stopping, no next question after completion, completion timestamps, and continuous ending.
- Agent live browser: completed a mixed five-card session with 3 right/2 wrong and inspected 60%, all configured operations, Beginner and zero review questions. Practice Again reset totals to zero, displayed Question 1 of 5 and disabled Flip Card. Ending it without answers displayed 0% and the empty-session message.
- Live Change Settings retained all operations and five-question selection; View Statistics reached the current coming-soon page; Return Home reached home. No captured console errors.
- Saved [desktop](verification/phase8-summary-desktop.jpg) and [mobile](verification/phase8-summary-mobile.jpg) screenshots. At a 390 × 844 browser viewport, client and scroll width both measured 375 pixels (vertical scrollbar consumes the remaining width), with no horizontal overflow. Viewport override reset afterward.
- Practice Mistakes is intentionally disabled with an explanation until Phase 14. Persistence remains Phase 9; active-session recovery remains Phase 18. These checks do not claim real-device or full accessibility verification.

## Phase 9

- `npm run check` passed lint, formatting, 207 tests across 17 files and strict TypeScript/production build. Added 31 service/validation cases and four application-persistence tests, plus saved-history assertions in the existing five-card completion test.
- Tests cover defaults without startup writes, complete settings roundtrip, raw/missing-version/version-0 migration, version-1 envelopes, future-version preservation (including a newer schema arriving after startup), independent category recovery, unrelated-key preservation and defensive copies.
- History tests verify immediate attempt persistence, full fields, completion timestamps, duplicate-save idempotence, prior-session retention, sequential cross-tab merging without regressing totals, sorted/bounded recent retrieval and preservation of full history.
- Invalid-data cases cover sparse arrays, arithmetic, settings types/ranges, IDs/session references, timestamps, nonboolean self-reports, NaN selections, duplicate attempts and inconsistent totals. Access/read/write denial and capacity errors are simulated; the old disk snapshot survives a failed write, in-memory answers remain usable and later saves can recover.
- StrictMode app tests verify settings across full unmount/remount, no attempt at selection/reveal, one saved result under double-click, saved ending, restored completed recap, active-session route fallback, visible storage warnings and a complete interaction while writes fail.
- Restored recaps also pass their saved configuration to Change Settings and Practice Again. The remount regression verifies Advanced/mixed/five-question choices rather than falling back to fresh defaults. Live Change Settings after restoring the saved recap retained all four operations and five questions.
- One new test initially matched both the card status and saving status; gave the saving notice an accessible name and scoped the query. The subsequent full check passed all 207 tests.
- Live in-app browser: disabled both preferences and reloaded; both remained off. Completed five mixed questions (3 right/2 wrong), reloaded the summary and verified the same 5/3/2 totals and 60%. Closed the tab and opened a fresh one at the summary; saved totals/configuration remained. Settings also remained off in the new tab. Restored both preferences to on and reloaded to verify that save. No captured console errors.
- Saved [reopened recap evidence](verification/phase9-reopened-summary.jpg). These test attempts remain in this local browser's history. No browser storage was edited through developer scripts.
- Full browser-process quit/relaunch is still a manual verification item; a fresh tab is not claimed as a full browser restart. To check: complete a session, bookmark `/practice/summary`, quit the browser fully, reopen the same profile/origin while the app server is running, and verify recap totals and settings. Active-card resumption is not expected until Phase 18.
- Recent-session reads are bounded to 50 by default/100 maximum. Full history is retained; archiving large histories remains Phase 21. Simultaneous cross-tab write races, production-host storage, private-mode behavior and real-device testing remain unverified.

## Phase 10

- Final `npm run check`: passed lint, formatting, 229 tests across 19 files, strict TypeScript and production build. Added 12 calculation tests, six statistics-page flows and four reset-storage tests. Existing session/end-dialog and persistence tests continue to pass.
- Calculation tests verify zero denominators, self-report overriding equality, all operation/difficulty buckets, independent bucket objects, rounding, review-source inclusion, input immutability and bounded newest-first recent sessions.
- Page flows load persisted 3/2/1 totals and 67%, verify breakdowns/recent details and empty states, exercise keyboard containment/cancellation, confirm persistent reset while preserving settings/unrelated keys, preserve history on failed writes, update stats during practice and discard active state after confirmed reset.
- Storage reset tests cover reload persistence, failed writes, newer-version protection, an old tab trying to restore erased history, and a fresh session created in the same millisecond as reset. Reset metadata validates as an optional additive field; no unrelated browser data is removed.
- Initial verification passed tests but caught an overly narrow TypeScript inference for the reset context callback (`false` instead of `boolean`). Added an explicit context type. Final review refined same-millisecond reset handling and added a regression test before the final full check.
- Live verification used temporary port 5174 because 5173 served another project; that server was left alone. New origin began with zero totals, all eight breakdown cards, both empty states and disabled reset. Completed five Beginner addition questions (3 right/2 wrong), then reported one Advanced division answer wrong. Statistics displayed 6 attempted, 3 correct, 3 incorrect, 50%; Addition/Beginner showed 5/3/2/60%, Division/Advanced showed 1/0/1/0%. Recent sessions displayed newest first and distinguished In progress from Completed.
- Reload retained totals and changed the interrupted session label to Unfinished. Reset dialog initially focused Keep history, contained Shift+Tab/Tab, closed with Escape and restored Reset Statistics focus without changing totals. Live permanent erasure was not performed; successful/failed deletion, settings preservation and active-state clearing were verified in automated tests.
- Desktop and 390 × 844 browser layouts inspected; narrow client/scroll widths both 375 pixels, no horizontal overflow. One screenshot attempt immediately after resizing failed; the capture after reload succeeded. Viewport override reset. No captured console errors.
- Evidence: [desktop statistics](verification/phase10-statistics-desktop.jpg), [mobile statistics](verification/phase10-statistics-mobile.jpg). Verification attempts remain stored only on the local 5174 origin. Vercel installation was confirmed, but no deployment or hosted verification was performed in this phase. Real-device, screen-reader and simultaneous cross-tab race checks remain pending.

## Phase 11

- Final `npm run check` passed lint, formatting, 246 tests across 21 files, strict TypeScript and production build.
- Added 17 tests: six Settings/application flows, seven clear-storage recovery cases and four audio cases. Existing settings, session, statistics and reset tests remain part of the full check.
- Settings tests verify sound/default persistence across full remount, defaults in setup, per-session overrides, default changes after a previous session, retention of an active session's configuration, cancellation/focus restoration, confirmed clearing/navigation/default restoration, unrelated-key preservation, failed-clear errors and exactly one opted-in sound per report.
- Clear-storage cases cover successful clearing of current/legacy/mistake keys, inability to save the journal before deletion, rollback after deletion starts, interrupted-clear startup recovery, blocked rollback/recovery with writes paused, rejection of an arbitrary-key journal and explicit clearing of unsupported future-schema data.
- Audio cases verify unsupported API safety, right/wrong tone frequency and low gain, scheduled stopping/resource closure, and denied audio recovery. This verifies scheduling and integration, not subjective audible quality or volume on real devices.
- One new UI test initially assumed a space in the home Settings link's accessible name. The actual name concatenates its text nodes; used the exact navigation link instead. No production failure was inferred from that query mistake.
- Live browser on local port 5174: selected Division/Advanced/Continuous with sound enabled, reloaded and retained all preferences. Back to practice loaded those defaults. Overrode Beginner/five questions for a session, reported one wrong answer with sound enabled, and returned to Settings; saved defaults were still Advanced/Continuous. Reporting progressed normally and no console errors were captured; audible output was not independently verified.
- At a 390 × 844 viewport, client/scroll widths both measured 375 pixels. Inspected the clear-data warning, verified initial Keep my data focus, Shift+Tab/Tab containment, Escape cancellation and focus restoration without live deletion. Restored sound off, Addition/Beginner/10 defaults after testing; viewport override reset.
- Full-page screenshot capture intermittently failed; viewport captures succeeded. Evidence: [desktop Settings](verification/phase11-settings-desktop.jpg), [mobile defaults/data controls](verification/phase11-settings-mobile.jpg), [mobile clear warning](verification/phase11-clear-dialog-mobile.jpg). Confirmed erasure/rollback was tested automatically; no live browser data was erased. Real-device/audio quality, full browser-process restart and hosted verification remain pending.
