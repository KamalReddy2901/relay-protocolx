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
