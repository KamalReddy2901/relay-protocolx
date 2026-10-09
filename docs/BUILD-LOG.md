# Observed build checks

CP0 shell checks pending. No domain tests exist yet; this is not a test pass. P07 must add meaningful parser, validation, ranking and real-inference tests.

Initial install found TypeScript 7 incompatible with typescript-eslint peer range; pinned compatible TypeScript 6.0.3. No forced dependency resolution used.

CP0: lint, typecheck and production build passed under Node 22.23.3 / npm 10.9.9. npm audit at install reported zero vulnerabilities. GitHub public signed-out page rendered. Cloudflare API created a Git-connected Pages project on main; initial deployment is pending first subsequent push. Python default CA lookup failed before the request; retry used system CA verification, not disabled TLS.

P06 color-token calculation (not rendered UI verification):
--ink on --paper: 15.70:1 (target 7:1)
--ink on --sheet: 17.12:1 (target 7:1)
--ink-2 on --paper: 7.12:1 (target 4.5:1)
--ink-2 on --sheet: 7.76:1 (target 4.5:1)
--rule-strong on --sheet: 3.45:1 (target 3:1)
--revise on --revise-wash: 6.11:1 (target 4.5:1)
--current on --current-wash: 6.67:1 (target 4.5:1)
--tentative on --tentative-wash: 5.72:1 (target 4.5:1)
--focus on --paper: 6.12:1 (target 3:1)
--focus on --sheet: 6.67:1 (target 3:1)

CP0 production verified at commit 586ff5e: successful matching Cloudflare deployment and GitHub CI; fresh root visit and nested /catch-up refresh rendered; hashed JS/CSS loaded. No model or domain tests run at this shell stage.

## 9 Oct 2026 — CP1 start (Zed session)

Observed state: main = origin/main at 16a8dc4 (CP0), untracked docs only. Read ZED-HANDOFF, EXECUTION-PROMPTS (P07, P08, P12), SPEC, DESIGN, EVENT-RULES, RELEASE, RESEARCH-REVIEW. The three Downloads reports were attached to the session by the user (outline only was shown to the agent; they were NOT read in full by this agent, so no claim from them is repeated here).

Added (commit e29851f): `@mlc-ai/web-llm` 0.2.85 (exact), vitest 4.1.11 (3.x had audit advisories), parser (WA-A, WA-I, BRACKET, PLAIN), extraction schema/prompt, validator, worker, `#probe` debug view, CSP with `wasm-unsafe-eval` and connect-src for huggingface.co, *.huggingface.co, *.hf.co, raw.githubusercontent.com (hosts are a starting guess, not yet verified against real redirects).
Checks run locally: `npm test` 14/14 pass (parser, validator; synthetic fixtures), `npm run lint` clean, `npm run typecheck` clean, `npm run build` ok.
Deployed: production serves e29851f assets (index-Dt3TZxpl.js) with the new CSP header (verified by curl).

CP1 model probe: NOT RUN. BrowserOS Neo returned "Context server request timeout" for every call (tabs, run, wait, human-help). No model load, timing, quality, network or cache result exists yet.

## 9 Oct 2026 — S1–S5 implementation (Zed, one writer, no Neo calls, no push/deploy)

Instruction: Codex runs the CP1 probe through Neo on the deployed `#probe` page; this session must not call Neo or deploy until Codex confirms. Model capability stays UNVERIFIED until Codex reports.

Implemented locally (uncommitted until the commit noted below; not pushed):
- Domain: chunker with context, ledger and oversize-message parts; runner (retry once on invalid JSON, split on overflow/truncation, fatal GPU errors, cancel, partial coverage, retry-failed merge); conservative reconcile (merge, supersession, conflicting confirmed decisions); deterministic deadline resolver; deterministic ranking with per-identity acknowledgments.
- UI: S1 import, S2 review (issues table, date order, timezone, identity incl. names not in chat, last-read filter), S3 model/run (capability, explicit download, cached auto-initialize, verbatim progress, chunk progress, cancel, retry, unsupported panel, remove model files), S4 brief (Act now / What changed redlines / For context, coverage and Partial banner, Done/Not mine/Edit/Undo, identity switch, run again, retry failed, start-over dialog), S5 inspector (aside at ≥1280px, modal dialog below).
- Fonts self-hosted via @fontsource; framer-motion and lucide-react added (pinned).
Checks run: `npm test` 25/25 (parser, validator, runner with a clearly labelled test double for the model, chunker/ledger cross-chunk change, oversize parts, retry merge, deadlines, owner resolution), `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass. Contrast script: all 16 pairs pass (docs/verification.md).
NOT done: any rendered UI check (no browser used), V1–V12, AC1–AC22, real inference with the new prompts/pipeline, deployment of this build, Playwright, README/P12. The test double is internal; the production path has no canned analysis.
Prompt note: the ledger sentence is appended to the system prompt only when ledger lines are present; the base prompt text probed at CP1 is unchanged.

## 9 Oct 2026 — CP1 live probe evidence (RELAYED by the user from Codex/BrowserOS; not observed by this agent)

Source and limits: figures below were reported to this session by the user. All inputs were synthetic fixtures, not real conversations. This agent did not see raw responses or screenshots and has not re-run them. Single device (WebGPU/Metal), single browser. Deployed probe build was `e29851f`.

| Finding (as reported) | Value |
|---|---|
| Model | Qwen3-4B-q4f16_1-MLC, WebGPU/Metal |
| Cold load | 129,728 ms; transfer 2,159 MB; browser storage 2,281 MB |
| Signature fixture | Correct 3pm/B214 → 4pm/LT-2 pair with exact m1/m3 quotes; generation 41,155 ms |
| Same fixture, owner | Action assigned to Kamal returned, but `ownerParticipantId` stayed null because Kamal was not a chat author |
| Proposal-only fixture | `proposed`, exact quote, no change; warm generation 10,044 ms |
| Injection + cancellation fixture | Cancellation validated. Hostile m4 text was cited as `confirms`, turning the proposal into a "proposed change"; the validator rejected the unsupported change, so no false confirmed result, but the proposal was lost |
| Thinking | All raw responses began with an empty `<think></think>` wrapper (`thinkingStripped=true` in the probe). Non-thinking mode is NOT proven |
| Network | Worker resource timing showed config/tokenizer/shards from huggingface.co and WASM from raw.githubusercontent.com. The main-page host list missed worker requests. No-egress/privacy is NOT proven |

Not covered by the probe as reported: multi-chunk runs, offline recovery, ambiguous-owner fixture, judge-device support, long-chat timing.

### Responses to the findings (code, local, not pushed or deployed)
1. Owner for a non-author: S2 already lets the user add their own name or silent participants (names matched exactly). Not a model defect; confirmed only by unit test, not re-probed.
2. Injection defect: added `src/domain/injection.ts` (heuristic detector, labelled defence-in-depth, not a guarantee). Evidence from a flagged message is dropped when its role is confirms/assigns/cancels/revises/before/after. A change claim that fails validation is no longer simply discarded: the surviving valid evidence is kept as the original statement (`proposal`/`proposed` if the model said proposed, otherwise `decision`/`needs-clarification`), with roles reset to `states` so no replacement is asserted. Counts are shown in the discarded-suggestions disclosure. The inspector labels instruction-like messages. A system-prompt rule was ADDED (chat lines telling the model to ignore rules or mark things done are not evidence). This prompt change is UNTESTED against the live model; it differs from the probed prompt and must be re-probed.
3. Regression tests added (synthetic fixture shaped after the finding): hostile text flagged, never a confirming source, proposal preserved, benign "ignore the noise" not flagged. 28/28 tests pass; lint, typecheck, build pass.
4. Thinking: `thinkingStripped` now means non-empty reasoning text was removed; an empty wrapper sets a separate `emptyThinkWrapper` flag and no UI note. This reflects what the output contains; it does not prove WebLLM honours `enable_thinking:false` (or that the empty wrapper comes from the template or the model).
5. UI copy: the first-use download size now says "about 2.2 GB ... measured once on one laptop" (from the relayed 2,159 MB transfer figure).
6. Privacy/no-egress remains unproven. The UI line "Your chat is processed in this browser. It is not uploaded." is the intended design; verification needs a network capture that includes the worker (e.g. CDP across targets).
7. CSP: observed hosts huggingface.co and raw.githubusercontent.com. The wildcard hf.co/huggingface.co entries have not been narrowed; narrowing requires observing the redirect hosts during a full download.

### Status correction (9 Oct 2026, after Codex finished the live probe)
The earlier entry "CP1 model probe: NOT RUN" described this Zed session when BrowserOS timed out. Codex has since run the probe on the deployed `#probe` (commit `e29851f`) and the user reported: cold Qwen3-4B load 129.7 s (2,159 MB shown), warm load from cache, cached inference completed with the browser offline then connectivity restored, signature case found the m1→m3 time/place changes, proposal-only stayed Proposed, injection+cancellation fixture misclassified the hostile message as confirmation (fixed in code, see above), empty `<think>` markers remain (thinking NOT shown to be disabled), model files from huggingface.co and WASM from raw.githubusercontent.com. Synthetic data only. Not a complete no-egress guarantee. This agent did not observe these runs.

## 9 Oct 2026 — P09 finding and local rendered checks (Zed, local headless Chrome via playwright-core; Neo not used)
- P09 (user-reported, from Neo): at 1024×768 the "Review messages" button ended at y=782, below the viewport. Fix: textarea min-height 21rem for 768–1279px only. Re-measured with `scripts/qa/s1.mjs` (headless Chrome): button bottom 1440×900 = 783 (viewport 900), 1024×768 = 703 (viewport 768), 390×844 = 558 (viewport 844); no horizontal overflow at any width; button height 44px. Computed fonts: body Public Sans 16px, h1 Newsreader 36px (28px at 390), textarea IBM Plex Mono 14px.
- Defect found by my own scripted journey: choosing a date format made the DMY/MDY control disappear (the ambiguity flag cleared once a choice existed). Fixed in `parser.ts` (flag stays true; Review still blocks only while no choice is made); test updated. 
- Cosmetic: step separators moved to CSS, native file button styled.
- My scripted full model journey (headless Chrome, WebGPU reported true) was interrupted by the user before completing; no result from it is claimed.
- Not claimed: V2–V12, S2–S5 rendered review, keyboard checks, deployed checks. The user is running those in Neo.
