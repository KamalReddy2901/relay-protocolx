# Relay

Know what changed, what you need to do, and which messages prove it.

**Status: live BASE checkpoint. Not submission-ready, not claimed ready for judging.** The S1–S5 journey exists in code and deploys, but the full journey has not been verified end to end on the deployed site, and the current model prompt has not been re-probed.

[Live site](https://relay-protocolx.pages.dev) · first action: paste a supported chat (WhatsApp export lines, or `Name: message` lines), choose who you are and the last message you read, then "Catch me up". Needs a WebGPU browser (recent Chrome/Edge) and a first download of about 2.2 GB (measured once on one laptop). Use only text you are allowed to process; this is not a hosted service.

## What it does
For a student who returns to a busy group chat: paste the text, choose your identity and last-read message (Relay cannot see your chat app's unread state), and get **Act now / What changed / For context** with exact source quotes. An explicit revision of an earlier plan is shown as a before/after redline linked to both messages. Differentiation is a product hypothesis, not a "first" claim: unread summaries, action extraction and citations already exist in major products.

## How it works
Deterministic parser (`src/domain/parser.ts`) → chunker with context and evidence ledger (`chunker.ts`) → WebLLM Qwen3-4B in a Web Worker (`src/worker`, `src/inference`) → validator (`validate.ts`: exact quotes, real message ids, change-pair rules, instruction-like text never confirms anything) → conservative reconcile → deterministic ranking (`rank.ts`). Results come only from live inference on your text; there is no canned or sample output and no cloud fallback. Stack: React, TypeScript, Vite, `@mlc-ai/web-llm` 0.2.85, Cloudflare Pages (static).

## Evidence so far (be skeptical)
- Unit tests: 30 passing (parser, validator, runner with a labelled model test double, chunking, retry, injection regression, task deadline handling, and multi-field redline validation).
- Live probe on the earlier probe build (`e29851f`), synthetic fixtures only, reported by the participant/Codex: Qwen3-4B cold load 129.7 s on one WebGPU/Metal laptop, warm load from cache, signature change found, proposal stayed Proposed, one injection fixture lost a valid proposal (fixed in code; fix not re-probed live). See `docs/BUILD-LOG.md`.
- Not verified: the complete deployed journey, thinking mode (empty `<think>` markers still appear), a no-network-egress guarantee, other devices, long chats, accessibility and visual checks beyond the three S1 viewports, all acceptance checks AC1–AC22.
- Current live run issue: a synthetic full-app run surfaced the reassigned projector task but missed the explicit time/place redline. Commit `c20b386` strengthens the extraction prompt and its synthetic pipeline test; the latest BrowserOS check still served the prior model chunk, so that prompt change has not been verified live.

## Limitations
Extraction can be wrong; quote checks show source, not meaning. Only the listed formats are supported; English assumed. 10–40 s per section was observed, so long chats take minutes. Hardware without WebGPU cannot run it. Targeted second reconciliation pass not implemented. No accuracy figure is claimed.

## Development
Node 22.23.3, npm 10.9.9: `npm ci`, `npm run dev`; checks `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` (output `dist`). QA scripts: `scripts/qa/` (need local Chrome). No secrets are required.

## AI assistance
Planning documents: Figma Make (as reported by the participant). Implementation: Zed agent and Codex. Runtime AI: WebLLM + Qwen3-4B in the browser. Records: `prompt.md`, `docs/PROMPT-LOG.md`, `docs/BUILD-LOG.md` (with gaps noted there). Contracts: `SPEC.md`, `DESIGN.md`. Release evidence: `docs/RELEASE.md`.
