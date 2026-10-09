# Relay — "What did I miss?"

**A personal handover for the group chat you have not read.** Paste a chat, say who you are and the last message you read, and Relay returns what needs *you*, what *changed* while you were away, and the exact source messages behind every item. Everything runs on your device.

- **Live app:** https://relay-protocolx.pages.dev
- **Source:** https://github.com/KamalReddy2901/relay-protocolx
- **Challenge:** ProtocolX — "The Unread Problem — What Did I Miss?"
- **Login:** none. No accounts, no API keys, no test credentials needed.

## Problem-statement alignment

| Challenge goal | How Relay does it |
|---|---|
| Summarize long/unread conversations | Only messages after your chosen last-read point are processed; long chats are chunked with context and coverage is shown (incomplete runs are labelled partial). |
| Identify important messages, decisions, action items | Brief sections: **Needs you**, **Changed**, **For context**. |
| Prioritize by urgency and relevance | Deterministic ranking: tasks for the selected person first, then by deadline, then changes, then context. |
| Highlight mentions, deadlines, tasks missed | Items assigned to or mentioning you are highlighted; deadlines are only shown when the chat states one (otherwise "No date given"). |
| Local-first processing | Qwen3-4B runs in your browser via WebLLM + WebGPU in a Web Worker. No inference server, no cloud AI, no database. Chat text is never sent to a server by the app. |

**What makes it different:** a before → after *redline* for plan changes (e.g. Room B214 → LT-2, 3pm → 4pm) linked to both source messages, and a strict rule that a question ("could we do 4?") stays *Proposed* until a later message confirms it.

## How to try it (2 minutes)

Requirements: desktop Chrome or Edge with **WebGPU**, a few GB of free memory, and a connection for the **one-time ~2.2 GB model download** (cached afterwards).

1. Open the live app and paste a chat, or paste the contents of [`examples/SYNTHETIC-SIGNATURE-DEMO.txt`](examples/SYNTHETIC-SIGNATURE-DEMO.txt) (a disclosed *synthetic* chat, used only as input; the output is generated fresh by the model).
2. Confirm date order/timezone if asked, choose **who you are** and **the last message you read**.
3. Click run. Wait for the model to download and load (progress and Cancel are shown).
4. Read the brief; open any item's **source** to see the original messages. Mark items Done / Not mine, switch identity, run again, or start over.

If your browser lacks WebGPU, the app says so up front instead of failing silently.

## Features

- Import by paste or plain-text export (WhatsApp-style formats); parse review with issue reporting.
- Date-order and timezone handling for ambiguous exports.
- Real on-device LLM extraction with JSON-schema-constrained output.
- Evidence validation: every item must cite real message IDs and exact quoted text, otherwise it is dropped or downgraded.
- Conservative change reconciliation (confirmed vs. proposed).
- Prompt-injection guard: instruction-like text inside a chat is treated as data.
- Source inspector, Done / Not mine / Edit / Undo, retry failed chunks, copy brief.
- Dark "Night Shift" theme with light-theme and reduced-motion support.

## Architecture

```
src/ui         screens: import, review, model setup, brief, source inspector
src/inference  capability check, session, engine adapter
src/worker     WebLLM Web Worker
src/domain     parser, chunker, extraction prompt, validate, reconcile, rank, dates, injection guard, runner
```

Static React 19 + TypeScript + Vite site on Cloudflare Pages with a strict CSP (`public/_headers`). The model is the only AI component; parsing, validation, ranking and deadline logic are plain, unit-tested TypeScript. See [`SPEC.md`](SPEC.md) and [`DESIGN.md`](DESIGN.md).

## GenAI services used

- **Runtime (in the product):** WebLLM 0.2.85 running `Qwen3-4B-q4f16_1-MLC` in the browser. Used for extracting tasks, changes and context from the pasted chat. No canned or hard-coded output.
- **Development:** Zed agent (Claude Sonnet 5.5), Codex via BrowserOS Neo for browser probes, Figma Make for design exploration. Full record in [`prompt.md`](prompt.md).

## Security and privacy

- No server, no secrets, no analytics; chat text lives in memory only.
- The only network traffic is static assets and the model weights from Hugging Face (allow-listed in the CSP).
- Model output is untrusted: schema-constrained, then validated against the source text before display.
- Not a certified privacy guarantee; a full network-capture audit was not performed.

## Accessibility

Visible focus styles, keyboard-operable controls and source inspector, semantic structure, light/dark themes, reduced-motion support, and 11/11 configured colour-contrast pairs (`node scripts/contrast.mjs`).

## Known limits

- First run needs WebGPU and a ~2.2 GB download; unsupported devices cannot run inference.
- A 4B model can miss or misread items. Citations show *where* a claim came from, not that it is interpreted correctly — check the originals.
- Unread state is chosen by the user, not detected.

## Development

```sh
npm ci
npm run dev        # local dev server
npm test           # 35 unit/pipeline tests
npm run lint
npm run typecheck
npm run build
node scripts/contrast.mjs
```

Node and npm versions are pinned in `package.json` and `.nvmrc`. CI (`.github/workflows/check.yml`) runs the checks on push. Further notes: [`docs/verification.md`](docs/verification.md), [`docs/REVIEW.md`](docs/REVIEW.md), [`docs/RELEASE.md`](docs/RELEASE.md).
