# Version 1.0.0 release checklist

Release target: CSE4095 / math-practice-app, GitHub Hab1yer/math-practice-app, main branch, Vercel production. Root Directory: app. No environment variables or backend services are required.

## Completed

- All application phases have code implementations. Deferred Phases 13–16 tests are now executed.
- Full check: 335 tests across 32 files, lint, formatting, TypeScript and production build pass.
- Seven axe structural-accessibility cases pass, including front/reveal/dialog states. Layout/contrast cannot be measured by jsdom and are not claimed by axe.
- Production-preview practice, saved review recovery, navigation cancellation, mastery completion and statistics were checked in Chromium. Independent Chrome privacy/setup/Tab checks passed.
- Responsive statistics layouts checked at 320 × 740, 390 × 844, 768 × 1024 and 1024 × 768, without horizontal overflow. These are browser viewport tests, not physical devices or a full iPad emulator.
- Measured 139 visible text elements on the statistics page: minimum contrast 7.75:1, no failures. Other interaction states still benefit from manual accessibility review.
- Privacy review found no application network submission, analytics, advertising, account requirement or third-party fonts. The Privacy page distinguishes local practice data from ordinary hosting request metadata.
- A 5,000-attempt synthetic history retained all records and totals; estimated storage 2,729,130 UTF-16 bytes, 78 ms round trip in the test environment. Archiving was unnecessary for this measured workload; no aggregation-only archive is implemented.
- Main JavaScript: 368.19 kB / 114.55 kB gzip. Settings: 5.34 / 1.80 kB gzip; Statistics: 8.97 / 2.85 kB gzip. CSS: 17.43 / 4.23 kB gzip. Fonts/images require no remote downloads.

## Manual checks still open

- Safari, Firefox and Microsoft Edge on their actual engines.
- NVDA/VoiceOver or another actual screen reader; DOM accessibility snapshots do not substitute for this.
- True 200% browser zoom and larger browser/system font settings. The available browser controller did not expose a verified zoom change; narrow viewports are recorded separately.
- OS-level reduced motion on a physical device (subscription and preference behavior pass automated tests).
- Slower-device performance, touch behavior and a physical tablet/iPad.
- Full browser-process quit/relaunch using the same profile. Fresh-document restoration is verified; active reload attempts were subject to native beforeunload handling and are not claimed as a completed process-restart check.
- Deliberate simultaneous multi-tab writes. localStorage merges sequential snapshots but is not a transactional database.

## Deployment record

The existing production project and main-branch Git integration have been verified. Publication and hosted-route checks are recorded after the release push in TESTING.md. A successful local build alone is not hosted verification.

## Repeatable release checks

From app/, run npm ci and npm run check. Serve the production build with npm run preview, then verify practice → report → review → mastery → statistics. Reopen an unfinished card in a fresh document and confirm selection/reveal and counts. Check the hosted direct routes, Settings persistence and console. Browser test data is kept in its origin; clear/reset confirmation is not clicked during live tests without action-time authorization.
