# Release

## Verified CP0 shell — 9 October 2026

Repository: https://github.com/KamalReddy2901/relay-protocolx
Production: https://relay-protocolx.pages.dev
Immutable deployment: https://d4b28656.relay-protocolx.pages.dev
Tested application commit: 586ff5e66dd1a977093439fc74df3fdff4257af0
Cloudflare deployment: d4b28656-8804-4bb5-a2a8-5df7b85c0595
Pages project: relay-protocolx; GitHub main automatically deploys.

Observed: Cloudflare build/deploy successful with matching commit; GitHub CI successful. Signed-out GitHub page readable. Fresh production visit rendered the React shell; hashed JS/CSS loaded and computed background matched stylesheet. Direct /catch-up navigation followed by refresh rendered the shell. No blanket rewrite added. No external fonts, icons, maps, persistence or runtime AI exists at CP0; those checks are not passed or applicable yet.

Local lint, typecheck and build passed using pinned Node 22.23.3 / npm 10.9.9. npm run build outputs dist. One package-lock.json.

Status: CP0 proven, NOT submission-ready. Real model load/quality and the full journey remain CP1–CP3 work. Shell CSP intentionally allows no external model hosts yet; CP1 must add exact verified hosts and WASM permissions.

This release-record commit changes documentation only; the application files are identical to the tested application commit above. Before feature work, inspect latest Pages state and repository HEAD. Do not create a duplicate repo or Pages project.

## Live BASE checkpoint — 9 Oct 2026 (NOT submission-ready)
Production: https://relay-protocolx.pages.dev
Deployed commit: 4c29eb0 (application files identical to this commit; later commits may be docs-only). Repo: https://github.com/KamalReddy2901/relay-protocolx. Authorized under P08 Mode B; no judging-portal submission.
Observed by Zed after push: production serves `index-ZI9mWbGa.js` matching the local build of 4c29eb0; CSP header present; CSS and font assets return 200; `/catch-up` returns 200 (no blanket rewrite added); headless Chrome against production loaded S1 and advanced to S2 with Newsreader/Public Sans applied and no console or CSP-violation errors.
NOT verified: the full journey on production (model load, inference, brief, inspector, reset), the re-probe of the current system prompt and injection fix, WebGPU-less behavior, Cloudflare deployment id, signed-out repo check, V2–V12, AC1–AC22. Codex is running post-deploy review in BrowserOS Neo.
Previous known-working CP0 deployment: d4b28656 (586ff5e), still available in the Pages dashboard for rollback.

## Base update — event-time fix (9 Oct 2026, still NOT submission-ready)
Deployed app commit: e1e43bc (production serves `index-CuHoFhIC.js`, matching the local build). Production smoke (headless Chrome, S1→S2): fonts applied, no console/CSP errors. Change: a time without a deadline cue is shown as "Event time", the task shows "No date given". Tests 30/30, lint, typecheck, build passed before push.
NOT yet verified: the fix on production with live inference (Codex to re-run the synthetic signature fixture in Neo and check the task deadline and the separate event time). Portal: nothing submitted.

## Metadata polish — 9 Oct 2026
Source commit `a5c6a54` is live on `https://relay-protocolx.pages.dev`. BrowserOS Neo confirmed the updated page title and description, `/favicon.svg` returned HTTP 200 with `image/svg+xml`, and the first screen rendered. The app bundle at that check was still `index-CuHoFhIC.js` (the `e1e43bc` app code); this verifies the metadata/favicon release, not a new feature release.

Source commit `c20b386` was pushed after that metadata release. It strengthens the model instruction to retain all explicit changed fields and extends the synthetic pipeline test for simultaneous time/place changes. Local tests 30/30, lint, typecheck, and build pass. At the latest production check, the deployed model chunk still lacked that new prompt instruction; the `c20b386` deployment and real-model behavior remain unverified. No portal submission has been made.

## Focused UI refinement — 9 Oct 2026 (base remains NOT submission-ready)
Source commit `21929e5` deployed to `https://relay-protocolx.pages.dev`. BrowserOS Neo loaded the production page and confirmed the new assets (`index-BejlI4yL.js`, `index-Ct4gAIrW.css`). The fetched production stylesheet contains the combined redline layout, text-only before/after styling, and bounded inspector scrolling. Local tests 30/30, lint, and build passed before push.
This check confirms the shell and compiled styles only. No fresh brief screenshot, live inference run, or end-to-end journey was performed for this refinement. The previously observed inconsistent model outputs remain the primary release blocker; nothing was submitted to the portal.

## Live signature diagnostic — 9 Oct 2026
BrowserOS Neo ran the three-message synthetic signature case on the production UI after `21929e5`. Qwen3-4B completed both unread messages, but produced Act now 0, omitted the 3pm→4pm time change, and mislabeled the owner change as a “setup” assignment. The production result therefore fails the intended signature acceptance check. A local guard now suppresses that personal consequence if no matching validated action exists; the guard is not yet deployed. No judging-portal submission has been made.

## Night Shift release — 9 October 2026
Source: f3de0ee, followed by b65f302 disabled-button contrast fix. Published to existing GitHub main and Cloudflare Pages. Production fresh visit showed the new Night Shift heading and index-LI8CIXnl.js bundle (f3de0ee); subsequent final asset observation is recorded in build log. Local lint, typecheck, 33 tests and build pass. Desktop arrival and mobile review screenshots inspected. Arrival has no horizontal overflow at 1440/390; all 11 tested Night Shift color pairs pass their stated contrast targets.

Runtime limitation: earlier deployed c10fb40 real inference recovered the personal projector action and owner change; schedule extraction remained incomplete. Fresh Night Shift inference attempt failed while caching model resources (Cache.add network error), including one retry. Device subsequently found to have only 432 MB free; insufficient storage is a plausible contributor, not a proven root cause. Participant requested cleanup: Relay WebLLM CacheStorage removed (~6 MB), Chrome disposable page/code cache removed (~1.1 GB), free disk increased to 1.5 GiB. Cookies, passwords and site storage preserved. No further 2.2 GB model download attempted. Final brief/drawer runtime regression remains unverified on this redesigned release; CP3 readiness is NOT asserted. No portal submission performed.
