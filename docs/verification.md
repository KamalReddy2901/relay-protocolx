# Verification record

Observed checks only. See `docs/BUILD-LOG.md` for chronology. Nothing here has been verified on the deployed site yet.

## Colour contrast (DESIGN §3), computed 9 Oct 2026
`node scripts/contrast.mjs` (WCAG relative luminance). All 16 pairs meet their DESIGN targets; no hex values changed.

    ink on paper                           15.70:1  target 7  pass
    ink on sheet                           17.12:1  target 7  pass
    ink-2 on paper                         7.12:1  target 4.5  pass
    ink-2 on sheet                         7.76:1  target 4.5  pass
    rule-strong on sheet (non-text UI)     3.45:1  target 3  pass
    revise on sheet                        7.38:1  target 4.5  pass
    revise on revise-wash                  6.11:1  target 4.5  pass
    current on sheet                       7.83:1  target 4.5  pass
    current on current-wash                6.67:1  target 4.5  pass
    ink on current-wash                    14.57:1  target 4.5  pass
    tentative on sheet                     6.66:1  target 4.5  pass
    tentative on tentative-wash            5.72:1  target 4.5  pass
    ink-2 on tentative-wash                6.66:1  target 4.5  pass
    focus on paper (non-text UI)           6.12:1  target 3  pass
    focus on sheet (non-text UI)           6.67:1  target 3  pass
    sheet on ink button fill               17.12:1  target 7  pass

## Not yet verified (pending a browser pass once the CP1 probe finishes)
V1–V12 visual checks, keyboard/focus checks, reduced-motion checks, all AC items on the deployed URL, real inference results.

## Known deviations from DESIGN.md (observed in code, to be reviewed after a rendered pass)
- Narrow-screen row actions are shown as wrapping buttons, not a "More actions" disclosure.
- Done collapse uses a Framer Motion height/opacity exit; Undo is the inline status plus a Restore list in the "Done or dismissed" disclosure.
- Targeted reconciliation pass (SPEC 7.4 last sentence) is not implemented; only ledger-assisted chunk prompts and conservative merging exist. A cross-chunk relation is only created when the later item cites the earlier message itself.
- No `@fontsource` preload link; no Playwright e2e test yet.

## CP1 live probe (relayed, synthetic fixtures; see BUILD-LOG for figures)
Observed by Codex/BrowserOS on the deployed `#probe` (commit `e29851f`) and reported to this session: cold load 129,728 ms, 2,159 MB transferred, 2,281 MB storage; signature pair correct; proposal-only correct; injection fixture exposed a coverage defect (fixed in code, regression-tested, NOT re-probed live). Non-thinking mode unproven. Egress unproven. These are probe results, distinct from unit-test fixtures, which only test the validator/runner with a model double.
