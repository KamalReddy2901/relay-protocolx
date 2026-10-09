# P06 focused review
Original documents preserved under docs/originals.

Fixed R3/AC7–AC15: dated fixture without fabricated task deadline; token-budget and cross-chunk source ledger; validated change fields; proposal/assignment/confirmation rules; multiline parser detection; partial-coverage semantics.
Fixed R9/AC19/V7–V9/V12: modal-only focus trap, no nested interactive controls, persistent undo, scoped shortcuts, animation budget, focus-ring exception and CSP style compatibility.
Removed public synthetic demo fallback from both files; synthetic internal tests remain permitted. No cloud fallback added. Art direction preserved.
CP1 actual model quality/load and a real permitted demo conversation remain unverified.

# P11 re-audit — 9 October 2026

The latest production bundle now passes the two targeted real-inference tests that previously exposed the missing time revision. Details, requirement mappings, limitations, and the acceptance matrix are in `docs/verification.md`.

**Prioritized finding:**

| Severity | Evidence / reproduction | Requirement | Correction / acceptance check |
|---|---|---|---|
| **Release blocker — insufficient verification** | AC7 and AC8 passed in live BrowserOS Neo inference on synthetic inputs. AC10–AC20 were not all exercised on production, particularly the AC15 multi-chunk real run, AC16/17 device/offline recovery, AC19 complete keyboard journey, and AC20 worker-inclusive network capture. | R3, R6, R9, R12; AC10–AC20 | Complete the remaining public-app checks; capture worker requests for AC20; record exact results before changing readiness status. |
| **Risk — data boundary** | The checked-in demo fixture is synthetic and visibly labeled; no real permitted conversation was supplied. | R1–R3; event rule against fake data presented as real | Do not present it as real. Disclose synthetic status if it is used for a demo; prefer a permitted real chat if the organizer requires real data. |
| **Risk — privacy and model scope** | The app downloads model assets from external hosts; a complete capture including the worker was not done. Two scenarios do not prove semantic accuracy. | Chosen local-first constraint; AC20 | Avoid privacy certification and accuracy claims; finish the network capture and inspect source evidence during use. |

**Decision:** INSUFFICIENT VERIFICATION. There is no portal submission. A package draft is present, but this review does not declare the product fully ready or guarantee a score.
