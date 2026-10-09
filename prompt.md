# prompt.md — Relay (ProtocolX "What Did I Miss?")

Status: DRAFT, 9 Oct 2026. The app is NOT ready for judging. The real-model check has not been run.

**Chronology (honest record).** The organizer's master prompt says prompt.md should be created before application code. That did not happen here: the CP0 shell was built earlier (`16f0210`), and the CP1 probe code (`e29851f`) was written and deployed BEFORE this file existed. The first prompt.md (`fc0bd48`) was created after it, on the user's instruction, and this version restructures it to the organizer's sections. Application code has been paused since then. The master prompt's text says "six required sections" but lists seven; all seven are below.

Each interaction below records: prompt, tool/model, purpose, files affected, outcome and verification status. "Summary" marks paraphrases; "verbatim" marks exact text. Tool/model for all Zed entries: Zed agent, model name as reported by its own system prompt ("Claude Sonnet 5.5"), not independently verified. BrowserOS Neo is used as a browser tool, not as a code generator. No secrets are included.

## 1. Project Overview
- **Problem:** after being away from a busy group chat, a student cannot tell what changed, what they personally must do, and which messages prove it.
- **Solution:** Relay: paste a supported chat export, choose who you are and the last message you read, and receive a brief with Act now / What changed / For context. The user chooses the text and the last-read boundary; Relay does not detect unread state. Each item links to exact source quotes. Differentiation (product hypothesis, not a "first" claim): an explicit revision is shown as a before/after redline with both sources and a personal consequence.
- **Features implemented so far:** deterministic chat parser, extraction schema/prompt, evidence validator, WebLLM worker, hidden `#probe` debug view. **Not implemented:** import/review/model/brief/inspector screens, chunking, reconciliation, ranking, acknowledgments, reset, failure states.
- Specs: `SPEC.md`, `DESIGN.md`.

## 2. Tech Stack & Architecture
React 19 + TypeScript + Vite, `@mlc-ai/web-llm` 0.2.85 (Qwen3-4B-q4f16_1-MLC) in a Web Worker, Vitest, Cloudflare Pages (static, no server, no secrets), GitHub repo `KamalReddy2901/relay-protocolx`. Architecture per SPEC §8: UI → reducer state → pure domain modules (parser, validate, later chunker/rank) → inference adapter → worker. Chat text is meant to stay in the browser; this has NOT been verified in a network capture.

## 3. AI Code Generation
### 3.1 Continue implementation, start with CP1 (verbatim)
> Continue ProtocolX implementation in this existing workspace. First read docs/ZED-HANDOFF.md and follow it, then read the complete P07 and P08 Mode B + P12 instructions in docs/EXECUTION-PROMPTS.md. Read SPEC.md, DESIGN.md, docs/EVENT-RULES.md, docs/RELEASE.md and docs/RESEARCH-REVIEW.md. Also review all three attached research briefs.
>
> Use the existing GitHub repo and Cloudflare Pages project. Check the current Git and deployment state; preserve existing work. Start with CP1: run and evaluate real WebLLM inference on the deployed site with unfamiliar chat input. Continue through the product implementation and deployed verification if the probe passes. Preserve the approved visual direction and the change-aware personal catch-up interaction. Do not replace real inference with canned results, add an unverified second model engine, or submit to the judging portal.
>
> Show me the first wired screen with its visual-check findings, then keep building. Record actual prompts and checks accurately. Report concrete blockers and the verified production URL/commit. Do not claim the app is ready for judging until the deployed end-to-end journey works.

- **Tool/model:** Zed agent. **Purpose:** CP1 mechanism probe.
- **Files affected (commit `e29851f`):** `src/domain/{types,time,parser,extraction,validate}.ts`, `src/domain/domain.test.ts`, `src/worker/llm.worker.ts`, `src/inference/engine.ts`, `src/probe/Probe.tsx`, `src/main.tsx`, `public/_headers`, `package.json`, `package-lock.json`.
- **Outcome:** code written, pushed, production serves it (checked with `curl`: asset name and CSP header). **Verification:** unit tests 14/14, lint, typecheck and build pass locally. Model behavior NOT verified. The three research briefs were seen only as outlines and the EVENT-RULES read was truncated; no claims from them are repeated.

## 4. Debugging
| Problem (observed) | Prompt/action | Solution | Status |
|---|---|---|---|
| CP0: TypeScript 7 conflicted with typescript-eslint peer range (from `docs/BUILD-LOG.md`, earlier session) | Not recorded in this session | Pinned TypeScript 6.0.3 | Resolved per build log |
| `npm audit` reported critical advisories in vitest 3.2.4 and 3.2.7 (tinypool, @vitest/mocker) | Part of prompt 3.1 | Upgraded to vitest 4.1.11; audit reports 0 vulnerabilities | Verified locally |
| A unit test failed: fixture dates were ambiguous, so the parser (correctly) gave no timestamp | Part of prompt 3.1 | Test supplies `dateOrder: 'DMY'` | Tests pass |
| BrowserOS Neo returned "Context server request timeout" on every call (tabs, `run`, `wait`, human-help) | Part of prompt 3.1 | None yet; user to refocus BrowserOS Neo | **Unresolved at time of writing**; probe NOT run |

## 5. AI Features & Design
### 5.1 Runtime AI (coded, never executed)
System prompt: `SYSTEM_PROMPT` in `src/domain/extraction.ts` (data-not-instructions rule, JSON schema, confirmed vs proposed definitions, change only on explicit revision, one worked example about a bake sale, which is a synthetic prompt example). Chat lines are serialized as JSON objects. Settings: JSON-schema constrained output, `enable_thinking: false`, temperature 0.2, top_p 0.9, seed 7. These values were chosen without any model output; they are untuned.
**Status:** no output ever observed; effectiveness unverified.
### 5.2 Design and architecture decisions
Taken from the accepted `SPEC.md`/`DESIGN.md` (written earlier with other tools; their prompts are only as recorded in `docs/PROMPT-LOG.md`, with gaps). Decisions in this session: no cloud/second-engine fallback; no canned output; CSP hosts for model files are an unverified guess pending the probe.

## 6. Testing & Improvements
Done: parser and validator unit tests on synthetic fixtures (formats, multiline, ambiguity, read boundary, invented IDs, altered quotes, ordering, owner ambiguity); lint, typecheck, build.
NOT done (unverified): model download, cold/warm load, non-thinking behavior, JSON validity, confirmed-vs-proposed accuracy, quote validity, CORS/redirect hosts, cache, memory, offline recovery, content-leakage check, judge-device support, all AC1–AC22 end-to-end checks, accessibility and visual checks. No real conversation supplied.

## 7. Final Summary (interim)
- **AI tools used:** Zed agent for implementation; earlier planning/design tools per `docs/PROMPT-LOG.md`; WebLLM + Qwen3-4B planned for runtime, not yet run.
- **Major contributions so far:** parser, schema/prompt, validator, worker, probe, tests, deployment of the probe build.
- **Completed features:** none verified. The S1–S5 journey exists in code (local, unpushed, un-rendered); no end-to-end run has been observed. Not ready for judging.
- **CP3 readiness gate:** may be claimed only when the deployed end-to-end journey passes all mandatory acceptance checks, including multi-chunk processing and reconciliation (AC15) and failure recovery (AC16–AC17, partial coverage), with real inference, as listed in SPEC §11 and §13.

## Interaction log (append-only)
### 3.4 Implementation of S1–S5 while Codex probes (verbatim)
> Codex is handling the CP1 probe in the already deployed #probe page through BrowserOS Neo. Do not call Neo or deploy while that probe is running. The approved plan stands. Start implementation in this existing checkout: build the complete required S1–S5 journey from SPEC.md and DESIGN.md using the current parser, validator, WebLLM worker and inference adapter. Preserve the accepted editorial/redline visual direction. Implement real import/parse review, identity and read boundary, honest model setup/progress, real inference, evidence-linked validated results, required chunking/reconciliation and coverage, deterministic ranking, source inspector, acknowledgments/reset, and meaningful failure/retry states. Keep all required behavior within CP3; optional F15–F17 can remain excluded. Do not add canned/default analysis or a cloud/second-model fallback. Synthetic fixtures are for tests only and must be labeled; never represent them as real chats. Treat model capability as unverified until Codex sends actual probe results. Keep one active code writer, run tests/lint/typecheck/build, inspect the rendered UI at 1440/1024/390 with screenshots when the probe is complete, and fix concrete defects. Update prompt.md and build logs with this exact instruction and only observed outcomes. Keep the current repo/branch and lockfile. Do not deploy until Codex confirms the production probe is finished; then publish a verified checkpoint to the existing Pages project and repo, with release docs and no judging-portal submission.

- **Tool/model:** Zed agent (model name as self-reported). **Purpose:** build the CP3 journey in code.
- **Files affected:** `src/domain/{chunker,runner,reconcile,rank,dates}.ts` (+ edits to `extraction`, `validate`, `parser`, `time`, `types`), `src/inference/{capability,session,engine}.ts`, `src/ui/*` (App, Import, Review, ModelStep, Brief, Inspector, common), `src/index.css`, `src/main.tsx`, `vite.config.ts`, `scripts/contrast.mjs`, tests, `docs/verification.md`, `package.json`/lockfile (fontsource x3, framer-motion, lucide-react), removed `public/shell.css`.
- **Outcome / verification:** 25 unit tests, lint, typecheck and build pass locally; colour contrast computed (16/16 pass). NOT verified: rendered UI, any real model output with this pipeline, accessibility behavior, any acceptance check on the deployed site. Neo was not called and nothing was pushed or deployed in this step. The model test double used in unit tests is a labelled test fixture, not production behavior.
- **Debugging in this step:** vitest assertion about date ambiguity was wrong in my own test and was removed; the cross-chunk and retry tests passed on first run (no failures observed to report).
- **Known gaps (honest):** targeted reconciliation pass not implemented; narrow-screen "More actions" disclosure not implemented; no Playwright test; README/P12 package not started.

### 3.2 Plan review request (verbatim)
> Thanks. Keep application-code changes paused. Before any more coding, follow the new organizer announcement: create an accurate prompt.md at the repository root and present the current development plan for my review, then wait for my confirmation.
>
> Record that the CP1 probe code already exists and prompt.md is being created after it; do not imply otherwise. Use actual prompt text only where available, label summaries as summaries, and record the BrowserOS timeout and unverified model checks exactly as reported. Don't claim the app is ready or the model works.
>
> After I review and confirm, we'll refocus BrowserOS Neo and continue with the probe.

Outcome: first `prompt.md` (`fc0bd48`) and an 8-step plan. Purpose: documentation. Files: `prompt.md`.

### 3.3 Approval and organizer master prompt (summary; the full organizer text was pasted by the user and is not reproduced here)
Summary: plan approved with two corrections; the organizer master prompt requires `prompt.md` with the sections above and, per interaction: actual prompt, tool/model, purpose, files, outcome/verification; no invented prompts or results; no secrets; wait for confirmation before application code. User asked to replace the "no confirmed format" line, keep the chronology honest, gate CP3 readiness on the full journey and acceptance checks, and then continue with the CP1 probe after refocusing BrowserOS Neo.
Outcome: this restructure. Files: `prompt.md`. Verification: none beyond reading the file.
