# Observed build checks

CP0 shell checks pending. No domain tests exist yet; this is not a test pass. P07 must add meaningful parser, validation, ranking and real-inference tests.

Initial install found TypeScript 7 incompatible with typescript-eslint peer range; pinned compatible TypeScript 6.0.3. No forced dependency resolution used.

CP0: lint, typecheck and production build passed under Node 22.23.3 / npm 10.9.9. npm audit at install reported zero vulnerabilities. GitHub public signed-out page rendered. Cloudflare API created a Git-connected Pages project on main; initial deployment is pending first subsequent push. Python default CA lookup failed before the request; retry used system CA verification, not disabled TLS.
