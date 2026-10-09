# prompt.md — Relay (ProtocolX "What Did I Miss?")

Status: DRAFT, 9 Oct 2026. The app is NOT ready for judging. The real-model check has not been run. Written after the CP1 probe code already existed (commit e29851f); it was not prepared before or alongside that code.

The organizer's prompt.md format/size announcement was not supplied to this agent as text, so this file follows no confirmed organizer format. Adjust once the announcement is provided.

## 1. Product summary
Relay: paste a group chat, choose who you are and where you stopped reading, and get a personal catch-up (Act now / What changed / For context) with source messages. Planned runtime AI: WebLLM running Qwen3-4B-q4f16_1-MLC in the browser. Current state: shell page plus a hidden `#probe` debug view; the brief UI does not exist.

## 2. GenAI use, by phase
| Phase | Tool/model | Status |
|---|---|---|
| Planning/spec/design (SPEC.md, DESIGN.md, research review) | Earlier tools (Make, Craft and others, per `docs/PROMPT-LOG.md`) | Prompts there are only those recorded in that file. Earlier conversations were not visible to this agent; gaps exist. |
| Implementation | Zed agent, model reported as "Claude Sonnet 5.5" by its system prompt (not independently verified) | Wrote the code listed in section 4. |
| Runtime inference | WebLLM 0.2.85 + Qwen3-4B-q4f16_1-MLC (Apache-2.0 per SPEC; notice not yet checked) | Code exists. **Never executed.** No output observed. |

Development prompts (section 3) are separate from the runtime prompt (section 5).

## 3. Development prompts (Zed session, 9 Oct 2026)
### Prompt 1 (verbatim, attachment links kept)
> Continue ProtocolX implementation in this existing workspace. First read docs/ZED-HANDOFF.md and follow it, then read the complete P07 and P08 Mode B + P12 instructions in docs/EXECUTION-PROMPTS.md. Read SPEC.md, DESIGN.md, docs/EVENT-RULES.md, docs/RELEASE.md and docs/RESEARCH-REVIEW.md. Also review all three attached research briefs.
>
> Use the existing GitHub repo and Cloudflare Pages project. Check the current Git and deployment state; preserve existing work. Start with CP1: run and evaluate real WebLLM inference on the deployed site with unfamiliar chat input. Continue through the product implementation and deployed verification if the probe passes. Preserve the approved visual direction and the change-aware personal catch-up interaction. Do not replace real inference with canned results, add an unverified second model engine, or submit to the judging portal.
>
> Show me the first wired screen with its visual-check findings, then keep building. Record actual prompts and checks accurately. Report concrete blockers and the verified production URL/commit. Do not claim the app is ready for judging until the deployed end-to-end journey works.

Observed output: read the docs (EVENT-RULES read was truncated by tool output; the three research briefs were seen only as outlines), added the CP1 probe code (commit e29851f), pushed, confirmed by curl that production serves it. Then the browser tool failed (section 6).

### Prompt 2 (verbatim, summary of attachments omitted)
> Thanks. Keep application-code changes paused. Before any more coding, follow the new organizer announcement: create an accurate prompt.md at the repository root and present the current development plan for my review, then wait for my confirmation.
>
> Record that the CP1 probe code already exists and prompt.md is being created after it; do not imply otherwise. Use actual prompt text only where available, label summaries as summaries, and record the BrowserOS timeout and unverified model checks exactly as reported. Don't claim the app is ready or the model works.
>
> After I review and confirm, we'll refocus BrowserOS Neo and continue with the probe.

Human decisions recorded: pause application code; confirm plan before continuing. (Decisions only as stated in the prompts.)

## 4. Code that exists (commit e29851f, before this file)
Parser, extraction schema/prompt, validator, WebLLM worker, `#probe` debug view, CSP changes, 14 unit tests on synthetic fixtures. Checks run locally: tests 14/14, lint, typecheck, build passed. Deployed assets confirmed via curl, not in a browser. See `docs/BUILD-LOG.md`.

## 5. Runtime prompt (as coded, not yet run)
System prompt text lives in `src/domain/extraction.ts` (`SYSTEM_PROMPT`); user prompt is built from chat lines serialized as JSON objects; output is constrained by a JSON schema; `enable_thinking: false`, temperature 0.2, top_p 0.9, seed 7. Tuning has not happened because no output has been seen. Its worked example (bake sale) is a synthetic prompt example, not a user conversation. Test fixtures are synthetic.

## 6. Verification record (exactly as observed)
- BrowserOS Neo returned "Context server request timeout" on every call (tab list, `run`, `wait`, human-help request). The probe was therefore NOT run.
- NOT verified: model download, cold/warm load time, whether non-thinking mode works, JSON validity, confirmed-vs-proposed accuracy, quote validity, CORS/redirect hosts in the CSP, cache behavior, memory, offline recovery, network content leakage, judge-device support.
- No real conversation has been supplied. No end-to-end journey exists.

## 7. Gaps and redactions
Earlier Make/Astra/Craft prompts are not reproduced here beyond `docs/PROMPT-LOG.md`. No secrets were involved; nothing redacted. Not submitted to any judging portal.
