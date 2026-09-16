---
name: playwright-video
description: Record clear Playwright videos of web app flows for demos, bug reports, or review evidence. Use when asked for a browser recording or video proof, not for general testing without video.
---

# Playwright Video

Produce a short browser recording that a person can understand and verify.

## Fit the project

Read the existing Playwright config, scripts, and relevant tests first. Reuse
its package manager, server startup, login fixtures, and test data. Record only
the requested flow; do not run the full suite unless it is needed.

Use a local or approved test environment. Keep credentials and private data out
of the video. Recording a flow does not authorize production writes, real
purchases, emails, or public uploads.

If Playwright is missing, add the smallest setup using the project's package
manager. This skill's assets use TypeScript and `@playwright/test`; adapt to an
existing Python, Java, or .NET suite rather than adding a second test stack.

## Set up recording

Merge these settings into the relevant project or a separate recording config.
Keep existing fixtures, projects, webServer, and authentication settings intact.
Check project-level overrides, which take precedence over top-level `use`.

```ts
use: {
  viewport: { width: 1280, height: 720 },
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  launchOptions: { slowMo: 300 },
},
```

Match the video size to the requested viewport. For mobile flows, preserve the
project's device settings. Use `mode: 'on'` to keep successful recordings;
`retain-on-failure` discards them. `slowMo` delays browser actions, not assertions.
There is no built-in `PW_VIDEO` environment switch: only use such a variable if
the project's config reads it. Increase the test timeout if deliberate pauses
need it; keep assertion timeouts focused on app readiness.

## Make the video readable

- Use one short test per story, with a clear title and named `test.step` blocks.
- Assert exact visible outcomes: totals, labels, statuses, or saved field values.
- Scroll the relevant element into view. Select editable text or hover a safe
  target when useful; never click a destructive control just to point at it.
- Add a checkpoint after the assertion. Keep its checklist short and highlight
  the current item. Do not present unchecked criteria as passed.
- Hold important states for about 1–2 seconds for the viewer. These pauses are
  for reading, not readiness; use Playwright assertions to wait for the app.
- For persistence claims, reload and check the UI; use backend checks afterward
  when needed. Video alone does not prove database state.

For an optional caption, checklist, and spotlight, copy
[assets/checkpoint.ts](assets/checkpoint.ts) into the project's test helpers.
Pass the full criteria list, the active zero-based index, and a target locator.
The helper adds temporary recording-only elements and removes them afterward.
Keep assertions outside the overlay so its text cannot make a test pass.

[assets/demo.spec.ts](assets/demo.spec.ts) is a self-contained working example.
Its fake page demonstrates recording only; replace it with the real app flow
when collecting evidence. Do not report the demo as validation of the app.

## Record and inspect

Run the focused spec with the project's runner, one worker, and no retries for
an unambiguous evidence run. For a standard Node project, for example:

```sh
npx playwright test path/to/flow.spec.ts --workers=1 --retries=0
npx playwright show-report
```

Add `--headed` to watch the run on an available desktop. Headless recording
also works. Playwright captures web page content, not native app windows,
browser chrome, or microphone audio.

Let the run finish before using its videos. Manually created contexts need
`recordVideo` and an awaited `context.close()`; runner settings do not
magically configure `browser.newContext()`. Each page has its own video.
Prefer separate tests over unrelated contexts mixed into one recording.

Open the report or play the finished video with available visual tools. Check
that the correct flow, readable labels, and final state appear; adjust overlays
that cover key content. If playback is unavailable, inspect extracted frames
when possible and say exactly what was checked. A nonempty file alone does not
prove useful footage. Report failures as failures, even when a video exists.

Copy wanted artifacts before another run cleans the output folder. Return the
test result, exact video path, report path, and any limits to what was verified.
Only publish recordings when requested, to the specified destination.

Reference: [Playwright video documentation](https://playwright.dev/docs/videos).
