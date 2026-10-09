# Observed build checks

CP0 shell checks pending. No domain tests exist yet; this is not a test pass. P07 must add meaningful parser, validation, ranking and real-inference tests.

Initial install found TypeScript 7 incompatible with typescript-eslint peer range; pinned compatible TypeScript 6.0.3. No forced dependency resolution used.

CP0: lint, typecheck and production build passed under Node 22.23.3 / npm 10.9.9. npm audit at install reported zero vulnerabilities. GitHub public signed-out page rendered. Cloudflare API created a Git-connected Pages project on main; initial deployment is pending first subsequent push. Python default CA lookup failed before the request; retry used system CA verification, not disabled TLS.

P06 color-token calculation (not rendered UI verification):
--ink on --paper: 15.70:1 (target 7:1)
--ink on --sheet: 17.12:1 (target 7:1)
--ink-2 on --paper: 7.12:1 (target 4.5:1)
--ink-2 on --sheet: 7.76:1 (target 4.5:1)
--rule-strong on --sheet: 3.45:1 (target 3:1)
--revise on --revise-wash: 6.11:1 (target 4.5:1)
--current on --current-wash: 6.67:1 (target 4.5:1)
--tentative on --tentative-wash: 5.72:1 (target 4.5:1)
--focus on --paper: 6.12:1 (target 3:1)
--focus on --sheet: 6.67:1 (target 3:1)

CP0 production verified at commit 586ff5e: successful matching Cloudflare deployment and GitHub CI; fresh root visit and nested /catch-up refresh rendered; hashed JS/CSS loaded. No model or domain tests run at this shell stage.

## 9 Oct 2026 — CP1 start (Zed session)

Observed state: main = origin/main at 16a8dc4 (CP0), untracked docs only. Read ZED-HANDOFF, EXECUTION-PROMPTS (P07, P08, P12), SPEC, DESIGN, EVENT-RULES, RELEASE, RESEARCH-REVIEW. The three Downloads reports were attached to the session by the user (outline only was shown to the agent; they were NOT read in full by this agent, so no claim from them is repeated here).

Added (commit e29851f): `@mlc-ai/web-llm` 0.2.85 (exact), vitest 4.1.11 (3.x had audit advisories), parser (WA-A, WA-I, BRACKET, PLAIN), extraction schema/prompt, validator, worker, `#probe` debug view, CSP with `wasm-unsafe-eval` and connect-src for huggingface.co, *.huggingface.co, *.hf.co, raw.githubusercontent.com (hosts are a starting guess, not yet verified against real redirects).
Checks run locally: `npm test` 14/14 pass (parser, validator; synthetic fixtures), `npm run lint` clean, `npm run typecheck` clean, `npm run build` ok.
Deployed: production serves e29851f assets (index-Dt3TZxpl.js) with the new CSP header (verified by curl).

CP1 model probe: NOT RUN. BrowserOS Neo returned "Context server request timeout" for every call (tabs, run, wait, human-help). No model load, timing, quality, network or cache result exists yet.
