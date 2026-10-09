# New research briefs: implementation-relevant review

Reviewed 9 October 2026:
- `ProtocolX Chat Summarizer Research.md` (Downloads)
- `deep-research-report (13).md` (Downloads)
- `ProtocolX evidence brief_ “What Did I Miss_”.md` (Downloads)

## What changes in how we explain Relay

The reports converge on a useful competitive correction: unread summaries, action/decision extraction, prioritized recaps and source citations already appear in WhatsApp, Slack, Teams and Google Chat product offerings. Relay must not pitch any one of those as novel. The product promise remains the SPEC's narrower user outcome: show the explicit plan change that affects this person, the person's supported next action, and the original messages behind both. Portability across user-supplied text and local handling contribute to this story, but neither establishes first-ever novelty or proven user demand. Treat market gap as a hypothesis.

The official WhatsApp export path does not establish an unread-only cutoff. Pasting text or importing a file gives Relay selected conversation data, not proof of the chat app's read state. Keep the UI accurate: user-selected input and a user-selected last-read boundary. Never imply automatic unread detection.

## Architecture advice: useful but not a new specification

All three briefs support explicit import, no authenticated-page scraping, no cloud AI fallback, cited source evidence and user-visible uncertainty. The existing SPEC already captures these. Their additional architecture proposals conflict with each other and with our inspected WebLLM plan: Chrome Prompt API/Gemini Nano, Transformers.js/ONNX with a 1.7B model, a dual-engine provider, Telegram JSON, SNR filtering and recursive summary-of-summaries. None has been tested in this project; some hardware/API/memory figures in the longest report are uncited in context or presented with stronger certainty than the supplied evidence supports.

Do not add a second inference runtime, platform connector, Telegram parser, "infinite context" claim or SNR pipeline just because a report recommends it. Keep the deployed WebLLM CP1 probe as the current plan. Run actual model loading and real extraction first. If it fails, report the concrete failure. Do not silently switch to cloud, claim local-only fallback is GenAI, or ship a large rearchitecture before testing. A deterministic mention/date scan may be an honestly labeled degraded assist only if it is useful and does not pretend to meet the runtime AI feature; the project's R1/R10 requirement still needs real inference in the demonstrated path.

## Product and demo implications

- Keep the strongest signature: an explicit confirmed revision connected to its earlier message, and the resulting personal action. Distinguish a proposal, confirmation, cancellation and unresolved conflict.
- Do not claim citations or source highlighting alone are a unique differentiator; they are trust requirements.
- Imported exports may not preserve unread status. Make the boundary explicit and let the user choose it.
- No genuine chat export has been supplied for this project. Synthetic fixtures stay internal tests and must not be portrayed as participant conversation.
- Test unfamiliar input; source IDs, exact quotes and identity changes must derive from the actual inference run.

## Items to verify before using externally

The deep-research report contains citation placeholders such as `turn17search3`, not resolvable links in the saved Markdown, for several competitor claims. The first long report makes strong claims about Chrome Summarizer availability/storage, WhatsApp scraping bans, fixed Chromium memory caps, model speed and SNR effectiveness. Treat these as unverified leads; do not repeat them as established facts. The evidence brief has directly linked sources for many alternatives and export limitations, but those links still do not validate this particular model or user workflow. No report supplies a tested local extraction benchmark for Relay.

Implementation handoff: read the three original research files by their absolute paths named in the Zed prompt. This note is a concise synthesis, not a replacement for the source material or event rules.
