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
