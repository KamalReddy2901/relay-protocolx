# Relay — What did I miss?

**A private, source-linked handover for a group chat you have not read.** Choose who you are and where you stopped. Relay separates your next actions from changed plans and background context, then lets you open the original messages behind each result.

- **Live app:** https://relay-protocolx.pages.dev
- **Source:** https://github.com/KamalReddy2901/relay-protocolx
- **Challenge:** ProtocolX, “The Unread Problem — What Did I Miss?”

## Why Relay for this problem?

A general chatbot can summarize pasted messages. Relay is built around the catch-up decision: **what changed since I last read, which change affects me, what should I do, and where did that come from?** It uses the selected identity and last-read boundary, ranks actions for that person, and presents plan revisions as an old → new line linked to both messages. A proposal stays separate from a confirmed change.

The primary analysis uses Qwen3-4B through WebLLM and WebGPU in a browser worker. The model runs on the device; chat text is not sent to a Relay server. The first run downloads model files from Hugging Face (the model is large); later runs can reuse the browser cache. If WebGPU is unavailable or the user wants an immediate result, Relay offers an explicitly labeled rule-based mode. The mode that produced a brief is identified in its “About and limits” section.

| Challenge need | Relay behavior |
|---|---|
| Understand an overwhelming chat | Import or paste supported text, review parsing, select identity and last-read message, then get a short personal brief. |
| Identify decisions and action items | **Act now**, **What changed**, and **For context**, with reasons and source links. |
| Prioritize urgency and relevance | Deterministic ranking uses the selected person, explicit deadline, and changes after the read boundary. No deadline is invented. |
| Highlight mentions, deadlines and missed tasks | Addressed actions are highlighted; users can mark Done/Not mine, edit an owner/date, or switch identity. |
| Keep conversations on the device | WebLLM inference runs locally in a Web Worker; the app has no chat backend or account. The model files themselves are downloaded from Hugging Face. |

## The demo

Use [`examples/SYNTHETIC-HANDOVER-DEMO.txt`](examples/SYNTHETIC-HANDOVER-DEMO.txt). It is a **synthetic** conversation created for demonstration, not a real chat. At review, use `Asia/Kolkata`, add yourself as **Kamal** and **Arjun** as a person mentioned but not speaking, then mark **m1** as the last message read.

Then select **Catch me up with private AI**. The first use may need WebGPU setup and a large model download; do not start it until the model is ready if the demo window is short. The fallback is **Use instant rules (no model)**. The expected story is:

1. Kamal’s check-in sheet tasks appear under **Act now**, with the stated deadlines.
2. The showcase changes from **3pm · Room B214** to **4pm · LT-2**, with both source messages available.
3. The projector handover moves from Arjun to Kamal, changing whose action needs attention.
4. The livestream remains a **proposal**, and the rehearsal is **cancelled**; neither is confused with the confirmed showcase plan.

Open the source references to show the original messages. Switch the identity to Arjun to show the personal view change. The “Why not ChatGPT?” answer: *ChatGPT can summarize a pasted chat; Relay makes the last-read boundary and “who am I?” first-class, then turns revisions into a two-source redline and reranks the next actions for that person. Its Qwen model runs on the device.*

## How it works

```text
src/ui      import → review → on-device AI or disclosed rules → personal brief → source inspector
src/domain  parser · chunker · extraction validation · reconciliation · ranking · dates · instruction guard
src/inference WebLLM adapter → Web Worker → WebGPU
```

The parser recognizes the supported chat text formats, flags ambiguous dates and applies the user-selected read boundary. The extractor proposes structured items. The validator checks source IDs, exact quotes and change pairs; reconciliation links revisions and retires replaced assignments; ranking is deterministic for the selected person. Chat lines are treated as data, including instruction-like text.

## GenAI disclosure

- **Runtime AI:** Qwen3-4B-q4f16_1-MLC through WebLLM, executed locally using WebGPU. The model files are fetched from Hugging Face; chat content is processed in the browser worker. The app also has a separate, explicitly labeled rule-based fallback that does not use a model.
- **Development:** tools and models are recorded in [`prompt.md`](prompt.md) and [`docs/PROMPT-LOG.md`](docs/PROMPT-LOG.md). Model names are marked as reported when not independently verified.

## Privacy, security, accessibility

Chat text and generated results are held in browser memory; Start over clears the active session. There is no app server, account, analytics service, or database. React renders chat as text, and evidence links point to validated message spans. The CSP permits the WebLLM worker and model-file hosts needed for local inference; that is not a claim of a completed packet-capture audit. Review a source before acting on an extraction.

The interface uses semantic controls, visible focus, keyboard-operable source inspection, reduced-motion support, responsive layouts, and self-hosted fonts. See `DESIGN.md` and `docs/verification.md` for the visual contract and the checks that remain unverified.

## Limits

The model can miss or misinterpret informal language; exact citations establish provenance, not correctness. The rule-based fallback covers a narrower set of English patterns. The user supplies the conversation and last-read point; Relay cannot see the chat app’s unread state. WebGPU support and available device memory vary. The synthetic demo is not evidence of accuracy on real conversations, and no accuracy or time-saving score is claimed.

## Development

```sh
npm ci
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
node scripts/contrast.mjs
```

Node and npm versions are pinned in `package.json` and `.nvmrc`. See [`SPEC.md`](SPEC.md), [`DESIGN.md`](DESIGN.md), and [`docs/verification.md`](docs/verification.md).
