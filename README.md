# Relay

Know what changed, what you need to do, and which messages prove it.

**Status: CP0 deployment shell only. No chat analysis or runtime model is implemented yet. Not ready for judging.**

## Development

Node 22.23.3 and npm 10.9.9. Run `npm ci`, `npm run dev`. Checks: `npm run lint`, `npm run typecheck`, `npm run build`. Output: `dist`.

Reviewed contracts: SPEC.md and DESIGN.md. Deployment evidence: docs/RELEASE.md. No environment secrets are required by this shell.

## AI assistance

Planning documents: Opus 5.5 through Figma Make, as reported by the participant. Review and shell: Codex in this conversation. Planned runtime: WebLLM with Qwen3-4B, not implemented or tested yet. See docs/PROMPT-LOG.md for record limits.
