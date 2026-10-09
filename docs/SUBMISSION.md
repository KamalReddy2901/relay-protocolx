# ProtocolX submission draft — do not transmit from this file

**Operator name:** Kamal (enter the exact name registered with the event).

**Source repository:** https://github.com/KamalReddy2901/relay-protocolx

**Deployed project:** https://relay-protocolx.pages.dev
**Upload:** the repository-root `prompt.md`.

**Description:** Relay turns unread group conversations into a personal handover: what needs you, what changed (as a before→after redline), and the source messages behind each item. Qwen3-4B runs locally in the browser using WebGPU; chat text is not sent to a Relay server. A clearly labeled rules mode is available when WebGPU is unavailable. Results are checked against source IDs and exact quotations, then ranked for the selected identity and read boundary.

**GenAI disclosure:** Runtime: Qwen3-4B-q4f16_1-MLC via WebLLM in a browser worker, using WebGPU on the user's device. The model files are downloaded from Hugging Face; chat text is processed locally. A separate deterministic TypeScript fallback is not generative AI. Development tools and verified chronology are in `prompt.md`.

**Honest limits:** WebGPU/device memory support varies; first model download is large. Model outputs can miss or misinterpret informal wording; citations show provenance, not correctness. Tested on synthetic chats only.

**Portal checklist:** public GitHub repository; deployed URL; short accurate description; root `prompt.md` uploaded. Before using a scored attempt, confirm the portal is accepting submissions and review the uploaded file and final URLs. The event deck states up to three scored submissions and that only the final attempt score counts; it also documents a 12:30–1:00 PM bonus window. Do not infer an extension from a portal still being reachable, and do not claim a bonus after the published window without organizer confirmation.
