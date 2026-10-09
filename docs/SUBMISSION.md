# ProtocolX submission draft — do not transmit from this file

**Operator name:** Kamal (enter the exact name registered with the event).

**Source repository:** https://github.com/KamalReddy2901/relay-protocolx

**Deployed project:** https://relay-protocolx.pages.dev
**Upload:** the repository-root `prompt.md`.

**Description:** Relay turns unread group conversations into a personal handover: what needs you, what changed, and the source messages behind each item. It uses Qwen3-4B locally through WebLLM, validates source IDs and exact quotations, ranks results for the selected identity/read boundary, and presents plan changes as source-linked redlines.

**GenAI disclosure:** Qwen3-4B via WebLLM/WebGPU performs runtime extraction in the browser. Zed and Codex assisted development; Figma Make was used for planning/design (Opus 5.5 is participant-reported). The full chronology and interaction records are in `prompt.md`. No cloud inference service is used.

**Honest limits:** WebGPU and a first-use model download of about 2.2 GB are required. Extraction can omit or misinterpret information; exact citations do not prove correctness. The two production inference checks used a synthetic scenario, not a real permitted chat. The synthetic fixture is labeled and is not a precomputed answer. No full network-egress audit or complete AC1–AC22 production run has been completed. Portal submission has not been performed.

**Portal checklist:** public GitHub repository; deployed URL; short accurate description; root `prompt.md` uploaded. Before using a scored attempt, confirm the portal is accepting submissions and review the uploaded file and final URLs. The event deck states up to three scored submissions and that only the final attempt score counts; it also documents a 12:30–1:00 PM bonus window. Do not infer an extension from a portal still being reachable, and do not claim a bonus after the published window without organizer confirmation.
