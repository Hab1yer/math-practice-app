# Testing record

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

Later practice, persistence, accessibility, mobile-device, and cross-browser flows remain untested and unimplemented. Gavin's own manual verification has not been performed by the agent.
