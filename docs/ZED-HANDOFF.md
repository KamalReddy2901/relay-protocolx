# Zed implementation handoff

Open this folder in Zed:

`/Users/kamal/Desktop/My projects/relay-protocolx`

Use the existing checkout and `main` branch. The GitHub repository is public and already connected to the Cloudflare Pages project `relay-protocolx`. GitHub and Cloudflare are logged in in BrowserOS Neo; the existing shell accounts were also verified. The working site is https://relay-protocolx.pages.dev. This is CP0 only: a truthful shell, not a submission-ready app.

Start a Zed Claude Sonnet session in this folder. The project context and accepted SPEC/DESIGN are available in the root. Read `docs/EXECUTION-PROMPTS.md` for the complete P07 build prompt and P08 Mode B + P12 text. Read these current build inputs:

- `SPEC.md`
- `DESIGN.md`
- `docs/EVENT-RULES.md`
- `docs/RELEASE.md`
- `docs/RESEARCH-REVIEW.md`

Also read the three newly supplied full reports from disk:

- `/Users/kamal/Downloads/ProtocolX Chat Summarizer Research.md`
- `/Users/kamal/Downloads/deep-research-report (13).md`
- `/Users/kamal/Downloads/ProtocolX evidence brief_ “What Did I Miss_”.md`

Do not claim a file was read if you cannot access it. If Zed cannot open an absolute path, ask Kamal to attach that specific report; continue other independent work meanwhile.

## Do this

Execute P07 and P08 Mode B from `docs/EXECUTION-PROMPTS.md`. Continue the existing product and deployment. Do not recreate the repo, Pages project or scaffold. First check `git status`, current branch/HEAD, latest production deployment and shell behavior. Preserve all accepted work. If the checkout is dirty, inspect it and preserve the changes. Keep one active writer and commit coherent milestones.

Begin with CP1: test a real, downloaded WebLLM model on the deployed origin, with unfamiliar and adverse conversation inputs. Record actual cold/warm load, supported browser/device, completion behavior, provenance/quote validity, model output validity, failure recovery and whether source content leaves the device. No model has passed this test yet. The app's WebGPU browser probe on Kamal's laptop is not proof the model works or that judges' devices support it. Use the written CP1 gate: fix a concrete issue or report the failure. Do not add a second engine or change privacy architecture just to avoid the gate.

Then build the real importer/parser, identity/read-boundary choices, evidence-grounded brief, explicit change relationship, source inspector, accessible states and reset, in CP order. Validate all three output categories with actual live inference; fixtures are internal test inputs only. Do not put canned answers in the production path. Run the actual checks described in P07. Publish verified improvements with P08 Mode B, keep a known working deployment and maintain `docs/BUILD-LOG.md`, `docs/RELEASE.md` and accurate `docs/PROMPT-LOG.md`.

## Research correction to preserve

The new reports show that generic unread summaries, action extraction, prioritization and source citations already exist in major products. Preserve Relay's specific change-aware personal catch-up as the signature interaction. Describe the differentiation as a product hypothesis, never a first-ever claim. User-selected paste/export does not carry confirmed unread state; say the user chooses the text and last-read boundary. Do not implement chat DOM scraping, OAuth connectors, cloud AI, Chrome Prompt API, ONNX/Transformers.js, Telegram JSON or a second model runtime without a verified CP1 failure and a narrowly justified decision. The longer report contains claims and citation placeholders that may be stale or unverifiable; check primary sources before repeating them.

The user confirms BrowserOS Neo has GitHub and Cloudflare sessions logged in. This is an available UI fallback for account authorization, not proof a new OAuth/API integration is needed. GitHub and Cloudflare project access is already wired for this repo; verify rather than recreate it.

## Communication

Start with the CP1 probe and tell Kamal what it actually showed. Continue to the first wired screen and share its screenshot and V# findings as P07 requests. Continue implementation without pausing for approval. Report blockers with the evidence and next action. Do not say it is ready for judging until the actual end-to-end product journey passes on the deployed URL. Never submit through the judging portal.
