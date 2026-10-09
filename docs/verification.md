# P11 verification record — 9 October 2026

This is a bounded audit of the current production release, not a claim that every acceptance check passed. Browser observations below were made in BrowserOS Neo on the public app; automated checks were run in this checkout. The two inference inputs were synthetic and clearly treated as test data. The app generated the outputs using the real Qwen3-4B WebLLM model; no result was prewritten.

## Release identity

- App URL: https://relay-protocolx.pages.dev
- Public source: https://github.com/KamalReddy2901/relay-protocolx
- Application source commit: `895b40a` (`Recover explicit confirmed time revisions from source spans`)
- Fresh production reload served `assets/index-Wo0d1J8Y.js` and `assets/index-Deg3Nyrz.css`; these match this checkout's production build. Cloudflare deployment ID was not captured.
- Real runtime: Qwen3-4B through WebLLM/WebGPU in a browser worker. No cloud inference API.
- Public anonymous repository API check: prior audit established `private=false`; recheck at final package time. The app itself opened without a login on a fresh public URL.

## Live functional checks

| Check | Observed input/action → result | Status |
|---|---|---|
| AC1 / R6, R11 | Fresh public app loaded the import screen without a login; title and production JS loaded. | Pass, observed |
| AC3 | Ambiguous `10/10/26` input required DMY/MDY choice; selected DMY and the review screen displayed 10 Oct 2026. | Pass, observed |
| AC6 / R1, R10 | Cached WebGPU model initialized, processed unread messages, and returned a brief. Earlier probe reported first download 129,728 ms / 2,159 MB; those figures are prior reported observations, not a cold-load measurement of this final UI. | Partial: warm end-to-end pass; final UI cold-download not re-measured |
| AC7 / R2, R3 | Signature input, read boundary m1, identity Kamal → `1 NEEDS YOU`, `1 CHANGED`; action “Kamal, please grab the projector instead”; task deadline “No date given”; redline includes Room B214 → LT-2 and 3pm → 4pm, source links m1/m3. | Pass, real production inference, synthetic data |
| AC8 / R3 | Removed the final update, reran the real model with m1 as read boundary → 0 needs you, 0 changed, and “Proposed — Change setup time” under For context. | Pass, real production inference, synthetic data |
| AC13 / R9 | Existing unit regression covers injection-like input. The prior live probe exposed an injection-related proposal-loss case; the post-fix hostile-input behavior has not been rerun in the browser. | Partial / live retest needed |
| AC14 | Invalid quote/source behavior is covered by validator tests. No live malicious model response was induced. | Unit-only |
| AC21 | The two related inputs produced different real outputs, but a separate controlled “edit one field and rerun” comparison was not performed. | Not independently verified |

Other browser observations: Night Shift result shows the selected identity, unread coverage, section counts, model attribution, source links, and user actions. The current production asset is the design release with the explicit time-revision recovery fix. The “Complete” label means all selected unread messages were processed; it does not mean all facts were recovered. Source evidence establishes where a claim came from, not whether the interpretation is correct.

## Local checks

On 9 Oct 2026 in this checkout:

- `npm test`: 35/35 tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed. Build emits dependency directive and large-chunk warnings; the WebLLM worker/model download is intentionally large.
- `node scripts/contrast.mjs`: 11/11 configured Night Shift color pairs meet their listed contrast targets. This is a color-token calculation, not a full accessibility audit.

## P11 categories

### Innovation

The proposed differentiator is a personal action plus a source-linked before/after change, not a generic summary. The production fixture demonstrates this interaction, but no claim of first-ever novelty is made.

### Code quality

35 automated tests, lint, typecheck and build pass. The checks cover parser/domain behavior; they do not replace full browser acceptance. Build succeeds with upstream directive and chunk-size warnings.

### Impact / functionality

The live signature case produced a personal task and confirmed change; the proposal-only variant avoided promoting a question into a confirmed update. Broader cancellation, conflict and chunk-boundary cases remain unverified live.

### Architecture

The app is a static Vite/React site on Cloudflare Pages. Qwen3-4B runs in a browser worker through WebLLM; there is no inference server or database. First-use model download and WebGPU requirements are material.

### Security / optimization

Source IDs and exact quotes are validated; chat text is treated as untrusted input. A complete network capture including worker requests has not verified that chat content never leaves the device. No privacy certification is claimed.

## Findings

| Severity | Evidence / reproduction | Requirement | Correction / acceptance check |
|---|---|---|---|
| **Release blocker — insufficient verification** | AC10 cancellation, AC11 ambiguous owner, AC12 conflicting decisions, AC15 cross-chunk reconciliation, AC16 unsupported WebGPU, AC17 offline recovery, AC18 reset/reload persistence, AC19 complete keyboard/focus flow, and AC20 worker-inclusive network capture were not all exercised on production. | R3, R6, R9, R12; AC10–AC20 | Run the remaining high-risk flows on the public build; for AC20 capture worker requests and confirm chat content is absent. Record actual outcomes in this file and re-evaluate readiness. |
| **Risk — runtime interpretation** | AC7/AC8 pass on this synthetic scenario; this is not broad model-accuracy evidence. There is no authorized real conversation in the test record. | R1–R3; AC7/AC8 | Rehearse with a permitted real chat if available; inspect every cited source and disclose the synthetic fixture if used. |
| **Risk — privacy claim scope** | Model assets load from external hosts. No complete worker network capture verified whether any chat content leaves the browser. | Chosen local-first constraint; AC20 | Do not claim certified privacy/no-egress. Complete worker-inclusive capture. |
| **Risk — device and load** | First model load previously took 129.7 seconds and transferred about 2.16 GB on one device; the model requires WebGPU and available memory. | R1, R10; AC6, AC16 | Disclose requirement and load behavior; verify on the actual presentation device before relying on a live demo. |
| **Non-blocking limitation** | Build succeeds with upstream Framer Motion module-directive warnings and chunk-size warnings. | Code quality / optimization | Keep dependencies pinned; consider bundle splitting only after preserving the working release. |

## AC status at handoff

- **Live passes:** AC1, AC3, AC7, AC8.
- **Partial or unit-only:** AC6, AC13, AC14, AC21.
- **Not demonstrated in this final production pass:** AC2, AC4, AC5, AC9–AC12, AC15–AC20, AC22. Some corresponding unit checks pass, but they do not replace the specified live/manual checks.

## Decision

**P11 result: INSUFFICIENT VERIFICATION.** The deployed model now passes the signature and proposal-only runs, which fixes the previously observed time-change failure. However, the full audit is incomplete, privacy egress is unverified, and no real permitted conversation was tested. This record does not certify all mandatory requirements or declare the app fully ready. The source package and live link exist; the participant must decide whether to use a scored portal attempt after reviewing these limits and the organizer's current portal status.
