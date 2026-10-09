# Relay — What did I miss?

A private chat handover: import a conversation, choose your identity and last-read message, then see personal actions, changed plans and the exact messages behind them.

**Live:** https://relay-protocolx.pages.dev
**Repository:** https://github.com/KamalReddy2901/relay-protocolx

## Use
Paste a real conversation you have permission to use, or import a plain-text WhatsApp export. Review the parsing, select your name (add silent participants if necessary), and mark where you stopped reading. Download the model and run the catch-up. Open source links to verify claims; mark actions done, undo, change identity, copy the brief or reset. There is no login or precomputed answer.

WebGPU is required. The Qwen3-4B model downloads about 2.2 GB on first use (one observed laptop); subsequent use can reuse the browser cache. Download and inference depend on device/network capabilities. Chat processing runs locally in a worker; no cloud inference API or secret is required. No comprehensive network-egress certification is claimed.

## Mechanism
React + TypeScript + Vite; WebLLM in a Web Worker; exact-quote/source-ID validation; conservative change reconciliation; deterministic personal ranking after extraction. An extra same-model audit checks possible omitted named assignments or time revisions. Invalid evidence is discarded. Long input is chunked; failures expose partial coverage and retry. Local session state and acknowledgments can be reset.

Night Shift visual direction uses self-hosted Bricolage Grotesque, Atkinson Hyperlegible and JetBrains Mono, meaningful highlighter colors, actual counts and an on-demand proof drawer. Fonts retain their bundled license notices.

## Development
Use the Node/npm versions in package.json. Run `npm ci`, `npm run dev`. Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Cloudflare Pages builds `dist` from main. No server/database is needed for the intended on-device workflow.

## Evidence and limitations
33 automated domain tests pass; lint and production build pass. Browser testing on the deployed c10fb40 mechanism recovered a personal projector task and a source-linked reassignment. Schedule details were still omitted: extraction is not reliably complete, and quoted evidence validates provenance rather than meaning. Synthetic inputs are test fixtures, not real chats or precomputed product results. No accuracy percentage or production-readiness claim is made.

See SPEC.md, DESIGN.md, prompt.md, docs/BUILD-LOG.md and docs/RELEASE.md for the actual process. Development used Zed, Codex and Figma Make (reported Opus model). Runtime uses Qwen3-4B through WebLLM. `prompt.md` accurately records that it was first created after coding began.
