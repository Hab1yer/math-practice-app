# Testing record

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

Later question sessions, persistence, full accessibility, real-device, and cross-browser flows remain untested and unimplemented. Gavin's own manual verification has not been performed by the agent.
