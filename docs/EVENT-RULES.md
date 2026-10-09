# ProtocolX — released challenge intake

Source: Kamal's photograph of the challenge slide, received 9 October 2026. This is intake and a product recommendation, not a final specification or implementation authorization for a selected angle. Organizer submission and evaluation deck received and inspected; remaining ambiguities are listed below.

## Exact slide text

Challenge:

The Unread Problem — “What Did I Miss?”

The challenge is to build a simple AI micro-app that helps users quickly understand and prioritize important information from overwhelming chat conversations.

The solution can focus on:
- Summarizing long and unread conversations
- Identifying important messages, decisions, and action items
- Prioritizing information based on urgency and relevance
- Highlighting mentions, deadlines, and tasks the user may have missed
- Using local-first processing, ensuring conversations, data, and summaries never leave the user’s device

## Evidence status

R1: Build a simple AI micro-app (explicit main challenge).
R2: Help users quickly understand important information from overwhelming chat conversations (explicit main challenge).
R3: Help users prioritize that information (explicit main challenge).

The five bullets are introduced by “can focus on”; they must not automatically be represented as five independently mandatory requirements. The final bullet nevertheless sets a strong privacy expectation. Treat chat content and derived summaries as device-local while awaiting confirmation. Do not silently design cloud inference and call it local-first.

Kamal recalls UI/UX, security, accessibility, innovation/uniqueness, code quality, and git commits as judging concerns. Exact weights and required commit practices have not been announced in the supplied evidence. Full-stack is tentative, not confirmed. No requirement for a live WhatsApp/Slack integration appears on the slide. Paste or import can be a valid intake mechanism unless guidelines add constraints.

## Three candidate angles

Internal scores 1–5, weights fit25/value20/depth20/difference15/visual10/dependency10. These are comparative judgments, not predicted judging scores.

| Candidate | Fit | Value | Depth | Difference | Visual | Dependency | Main tradeoff |
|---|---|---|---|---|---|---|---|
| General unread digest | 5 | 3 | 3 | 2 | 3 | 4 | Clear fit but summary output alone offers little distinctive interaction |
| Personal action inbox | 5 | 5 | 4 | 3 | 4 | 4 | Direct value; needs reliable ownership/deadline interpretation |
| Change-aware personal catch-up | 5 | 5 | 5 | 4 | 5 | 3 | Strongest demo; resolving revisions/cancellations is the main technical risk |

## Recommended angle — Relay (working name)

For a student coordinating a project or club event after being away from the group chat, Relay turns an unread conversation into an evidence-backed personal catch-up: what changed, what they need to do, and what can wait. Its signature behavior connects a revised plan to the earlier message it replaces, then updates the user's action list.

Workflow: paste/import a supported text chat → choose who you are and where you stopped reading → get a brief with “Act now”, “What changed”, and “For context” → inspect original messages behind each finding → acknowledge or save the relevant action locally.

Illustrative demo only: older message says Room 204 at 2 pm; newer explicit revision says Lab 3 at 3:30 pm; a mention assigns Kamal a slide update by noon. Show the revised plan, retire the obsolete instruction, and prioritize the personal task with its source evidence. Switching the selected participant changes relevant actions. Relative times use the chat's dated context and timezone, not an invented event timestamp.

Strongest objection: an attractive brief with wrong owners, dates or superseded instructions is less useful than the raw chat. Require exact source-message references and clear distinctions between confirmed change, proposed change and unresolved conflict. An explicit later correction can supersede an older instruction; “last message wins” is not a valid general rule. Surface ambiguity rather than silently inventing resolution.

UI direction for later art direction: a calm catch-up workspace with a dominant brief and an adjacent source-message inspector, strong typography, restrained priority color, and meaningful before/after transitions. No mandatory final palette chosen at intake. Keyboard operation, non-color priority labels and source navigation are core product behavior.

## Closest verified precedent and limits

Slack's official guide documents conversation summaries and recaps: https://slack.com/intl/en-gb/help/articles/25076892548883-Guide-to-AI-features-in-Slack . A summary panel, recaps, or citations alone should not be claimed as novel. Proposed differentiation is the combined workflow of personal relevance, explicit change/supersession handling, source inspection, and device-local handling. This is a direction to validate, not a first-ever claim.

## Architecture questions to resolve before specification

1. Are device-local data and summaries mandatory, or is this an optional focus? If mandatory, ordinary hosted cloud-LLM processing of private chats is incompatible.
2. Is full-stack mandatory, and what qualifies? A local backend can preserve device-local processing; whether that meets the required hosted demo experience is a separate question. Do not bolt on an irrelevant server solely to claim full-stack.
3. If on-device browser inference is selected, prove model loading, browser support, memory and result quality before committing the UI to it. Real AI inference must be distinguished from rule-based ranking and samples.
4. Verify exact chat input scope, format, parsing, date/timezone behavior and multiline messages. Avoid broad platform integrations unless required.
5. Keep source content out of analytics, logs and external error reports. Render imported messages as untrusted text and treat instructions inside them as data during AI extraction.

## Next step

Kamal accepts or adjusts the recommended angle. Research targets existing workflows and the specific local-processing/full-stack feasibility constraints; incoming organizer guidelines override provisional assumptions. Then generate the actual Make input brief and product-specific P04/P05 prompts. No generic app scaffolding or competition repository has been created by this intake step.


## Official deck received during intake (9 October)

Source: /Users/kamal/Downloads/pitch_deck.pptx.pptx. Inspected text across all 31 slides and the embedded disqualification graphic on slide 10. No speaker notes were present. Challenge slide 17 is a placeholder in this deck; the photographed released statement remains the source for the actual challenge.

- Slides 5–6: submit a public GitHub repository URL, deployed project URL, brief description, and identify GenAI services used and where. This includes distinguishing development assistance from runtime inference in our submission.
- Slide 7: automated assessment signals include code quality, security, efficiency, testing, accessibility and problem-statement alignment. Only Challenge scores count. Final attempt counts, not best attempt.
- Slide 8, categories mapped using their positions: HIGH UI/UX styling/polish and code quality/modular structure; MEDIUM security, innovation/engineering uniqueness, accessibility and Git commits; LOW testing and documentation. These are qualitative tiers, not numerical weights. Several explanatory captions appear mismatched; do not infer hidden scoring formulas from them.
- Slide 9: up to THREE scored submissions. One retry of the same attempt for a connectivity/temporary technical failure that prevented submission/evaluation, not for a successfully evaluated poor score.
- Slide 10 embedded graphic: static/hardcoded output without real logic/model, fake or placeholder data presented as real output, AI responses not generated by a working AI call, and features failing genuine testing can disqualify. Each demonstrated feature must work end-to-end; GenAI must use a real API/model call. If authentication exists, supply test credentials. Test as an evaluator.
- Slides 10, 11, 23: organizers manually check working functionality and alignment for Top 10 selection. Broken deployed link can disqualify even a leaderboard Top 10 entry. This replaces the unverified earlier Top 15 then Top 10 assumption.
- Slide 12: 12:30–1:00 PM submission window offers +2 points. Whether that bonus persists after a later submission is not specified. Submit a verified working release in the window if ready; do not spend an attempt on a shell.
- Slide 3 lists Main Challenge 10:45–3:00. Treat 3:00 PM as scheduled end unless organizers announce a different cutoff.
- Slides 13–16: separate social engagement contest and surprise rewards; these do not establish additional main leaderboard weights. No posts are authorized by reading this deck.

No explicit full-stack requirement, mandatory live-chat integration, prompt.md format, or clarification of mandatory device-only processing appears in this deck. Retain prompt.md preparation from prior organizer/user context. Real supplied/pasted/imported conversations can exercise genuine inference; live integration is not established as necessary. Synthetic fixtures, if used internally for tests, must never be presented as real conversations or canned inference output.

Execution changes: prioritize deployed functional access and unfamiliar-input checks; maintain meaningful incremental commits; document actual model/service use; preserve the last known working release; submit another scored attempt only after validating the changed release. Continue the existing Craft P01/P02 → P04/P05 → P06 → P08/P07 route.

Read-only feasibility inventory: this laptop reports Apple M4 and 16 GiB memory. Neither ollama nor lmstudio was found on the shell PATH; this does not establish that no GUI/runtime is installed. No local inference or model-quality test has run yet.
