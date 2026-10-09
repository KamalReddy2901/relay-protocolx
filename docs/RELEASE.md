# Release and submission record

## Latest production check — 9 October 2026 (HTTP and asset verification)

- Public repository: https://github.com/KamalReddy2901/relay-protocolx
- Production URL: https://relay-protocolx.pages.dev
- Published application source: `fd3bfab` (`Restore ledger guidance for multi-chunk inference`); Cloudflare Pages production deployment `2250e2ea-825c-4e9a-99b0-2cf64c33dc5b` on `main`.
- Fresh HTTPS requests returned HTTP 200 for the production root, its referenced JavaScript (`index-BTPHX_oL.js`), CSS (`index-Deg3Nyrz.css`), WebLLM engine (`engine-fxLMP2l7.js`), and model worker (`llm.worker-_RSyaQwm.js`). The engine references that worker. The production root and assets carry the configured CSP/security headers. The deployed JavaScript includes the private AI, WebGPU, Qwen3-4B, and explicit instant-rules UI.
- This was an HTTP/asset check, not an interactive browser run. BrowserOS Neo was not available in this session. No fresh model load, live inference, model download, visual inspection, network-egress capture, or end-to-end production journey was performed for `fd3bfab`. The previous real Qwen demo evidence below is from `895b40a`, not this deployment.
- Local checks for `fd3bfab`: lint, typecheck, 42/42 tests, and production build passed. The build retains upstream module-directive and large-chunk warnings.
- No judging-portal submission was made. No submission receipt exists.

## Previous production inference evidence — 9 October 2026

- Public repository: https://github.com/KamalReddy2901/relay-protocolx
- Production URL: https://relay-protocolx.pages.dev
- Verified application source: `895b40a` (`Recover explicit confirmed time revisions from source spans`), Cloudflare deployment `02edfbb0-6820-4410-9e22-c160171f1ed5`. Local build from this commit emitted `index-Wo0d1J8Y.js` and `index-Deg3Nyrz.css`; a fresh BrowserOS Neo reload of the production URL served those same asset names.
- P12 package commit: `c5434ed` (`Document verified ProtocolX demo and submission state`), Cloudflare deployment `6ec35b7f-68c0-432a-a6f8-857ee2feaef0`, status **success**. This is a documentation/fixture commit; application source remains `895b40a`. Cloudflare's dashboard lists automatic deployments on `main`; production root continued serving the verified app assets.
- Runtime: Qwen3-4B via WebLLM/WebGPU, real inference in the browser worker.
- Production checks: signature case surfaced the Kamal projector action and the Room B214→LT-2 / 3pm→4pm redline with m1/m3 source links; the task stayed “No date given.” Removing the final update and rerunning produced a “Proposed” context item, with no confirmed change and no Kamal action. Both are labeled synthetic inputs, not real-chat tests.
- Local checks at this release: 35/35 tests, lint, typecheck, production build and 11/11 configured Night Shift contrast pairs pass. The build succeeds with upstream directive and large-chunk warnings.
- Package assets: root `prompt.md`, `README.md`, `docs/SUBMISSION.md`, and synthetic fixture `examples/SYNTHETIC-SIGNATURE-DEMO.txt` are present. Anonymous GitHub API confirms `private=false`; the public `prompt.md` blob SHA `6788263b5d5523df2e0ac8b94a9e8720124ed51f` matches the local file. A commit-pinned raw URL returned the current content; the branch raw URL once served a stale cached body, so use the GitHub main-file view/API or commit-pinned URL for verification.
- No judging-portal submission has been made. No submission receipt exists.

## Readiness and limitations

P11 result: **INSUFFICIENT VERIFICATION**, not “ready”. See `docs/verification.md` for evidence by AC and the exact remaining checks. In particular, the full AC1–AC22 production audit, AC15 multi-chunk real run, AC16/17 device/offline recovery, AC19 complete keyboard flow, and AC20 worker-inclusive network capture were not completed. No real permitted conversation was supplied; the fixture is synthetic. The model can miss facts, and source citations do not prove interpretation. No no-egress certification is claimed.

The organizer deck schedules the main challenge to end at 3:00 PM and the +2 window at 12:30–1:00 PM. The current local time is after the published main-challenge end. A still-open portal does not prove that organizers extended the cutoff; confirm acceptance with an organizer before using a scored attempt. The deck says up to three scored submissions, only the final score counts, and one retry is reserved for a technical failure that prevented scoring. Do not treat retries as free iterations.

## Earlier verified checkpoints

Historical checkpoints and their limited evidence remain in `docs/BUILD-LOG.md`. Older statuses in that chronology are superseded by this latest production record. The first root `prompt.md` was created after application code had already been written; the project records that organizer-process deviation accurately.
