# Relay — What did I miss?

Relay turns a group chat you have not read into a personal handover: what needs you, what changed, and the messages that support each item. The signature interaction is a source-linked redline: an earlier confirmed plan beside its explicit replacement, with any reassigned action shown separately.

**Live app:** https://relay-protocolx.pages.dev

**Public repository:** https://github.com/KamalReddy2901/relay-protocolx

## Try the app

Paste a chat or choose a plain-text export. Confirm the date order and timezone if asked, choose your identity and last-read message, then run the local model. Open source links before acting; mark items done or not yours, change identity, copy the brief, or reset.

[`examples/SYNTHETIC-SIGNATURE-DEMO.txt`](examples/SYNTHETIC-SIGNATURE-DEMO.txt) is a synthetic test scenario, not a real conversation. The model generates a fresh result from its text; the output is not precomputed. It exercises a proposed time, a later confirmed time/place change, and a task reassigned to Kamal. Never describe this fixture as a real chat. The organizer warns against fake data being presented as real; use it as a disclosed synthetic demonstration only if that is acceptable to the judges. Otherwise, test with a real conversation you have permission to use.

## How it works

React + TypeScript + Vite on Cloudflare Pages. WebLLM runs Qwen3-4B in a browser Web Worker using WebGPU. Parsing, exact-quote and source-ID validation, change reconciliation, and personal ranking are deterministic code around model-generated extraction. Long chats are chunked; incomplete runs are labeled partial. No server, database, cloud inference API, login, or API secret is used.

The model must be downloaded on first use (about 2.2 GB was observed on one laptop); WebGPU support, memory, and network determine whether it runs. Model assets are downloaded from external hosts. Chat-text egress has not been independently verified with a complete network capture, so the intended on-device processing is not a privacy certification. Inference can omit information; source quotes prove provenance, not semantic correctness. Check the original messages.

## Current verification

Production at `https://relay-protocolx.pages.dev` served the same JS/CSS asset hashes as the local build from application commit `895b40a` on 9 October 2026. In BrowserOS Neo, two actual Qwen3-4B runs on the production app used synthetic inputs:

- Signature case: 2 unread messages; surfaced Kamal's projector action, grouped Room B214 → LT-2 and 3pm → 4pm, and cited source messages m1/m3. The task deadline stayed “No date given.”
- Proposal-only variant: with the final update removed, the question “could we do 4?” appeared as “Proposed” under For context; no confirmed change or Kamal task was shown.

Local checks: 35 tests, lint, typecheck, production build, and 11 Night Shift contrast pairs pass. These checks do not establish every acceptance scenario or semantic accuracy. The full AC1–AC22 production audit is incomplete; see [`docs/verification.md`](docs/verification.md), [`docs/REVIEW.md`](docs/REVIEW.md), and [`docs/RELEASE.md`](docs/RELEASE.md). The project has not been submitted to the judging portal.

## Development and verification

Use Node/npm versions pinned in `package.json`. Run `npm ci`, then `npm run dev`. Checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `node scripts/contrast.mjs`. Cloudflare Pages builds `dist` from `main`.

The root [`prompt.md`](prompt.md) records the development process and GenAI disclosure. It also records that coding began before the organizer-required prompt file existed; chronology is not rewritten. Zed, Codex, and Figma Make were used during development (the Figma model name is participant-reported); runtime inference is Qwen3-4B through WebLLM.
