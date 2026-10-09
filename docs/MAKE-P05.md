# Send after SPEC.md is complete, in the same Make conversation

Act as the product's art director. Read the accepted specification: SPEC.md you just produced in this conversation, together with the supplied Relay handoff.
Choose one strong visual direction grounded in this user's task. Consider
alternatives internally, but deliver one decisive design, not a menu or a model
comparison. Distinguish it through composition, type, density, and interaction.

The selected contract must define:
- Visual thesis in one sentence and how it relates to the domain. Name two or
  three real workflow artifacts that inform structure. State three concrete
  departures from the obvious generic UI, justified by the user task.
- Exact display/body/data fonts as needed, fallbacks, and loading strategy.
- Semantic color tokens with hex codes and contrast requirements.
- Type scale, spacing rhythm, grid, borders, radius, density, and alignment.
  Supply a usable CSS custom-property token block, not a framework-version-specific
  configuration assumed to exist. Default body text to readable 16px; justify
  smaller labels. Include icon/imagery source and style, or explicitly none.
  State contrast targets; call ratios verified only if actually calculated.
- The first useful screen: realistic copy, content hierarchy, exact major regions,
  main action, and a clear route to the promised outcome. Include monospaced
  wireframes with region proportions at 1440px, 1024px and 390px widths.
- One signature interaction: trigger, before/after values and units, what moves,
  duration/easing, keyboard behavior and reduced-motion alternative. Motion must
  reflect an actual state transition, not pretend to measure processing.
- Loading/empty/error/success/focus/disabled states and reduced-motion behavior.
- Laptop, presentation, and narrow-screen layouts; long-content behavior.
- Which familiar patterns are worth keeping for usability.
- Eight to twelve V# visual acceptance checks verifiable from screenshots or
  computed styles, tied to the key screen and states.
- Protected design decisions: the composition, typography, color roles and
  interaction choices the reviewer/builder must preserve unless a concrete defect
  requires a change. Link screens to SPEC IDs; do not revive excluded features.

Avoid default SaaS card grids, ornamental gradients, generic AI badges, filler
taglines, and decorative charts. Do not force PALS's aesthetic onto a new domain.
Do not sacrifice readability to unusual fonts or ban useful native controls.
Make the application feel authored for this product. Be decisive and specific.

Write DESIGN.md with a precise written main-screen composition and interaction
contract. Markdown only: no screen generation or application implementation.
Keep it consistent with SPEC.md, including any excluded features. Use Framer
Motion for meaningful motion where compatible with the chosen stack. Preserve
readable fallback fonts if preferred fonts cannot load.

Put the useful product and its meaningful primary action on the first screen;
avoid a marketing page that hides the task. Derive composition and typography
from the user's real workflow. Keep data density intentional and copy specific.
Every control needs an accessible name: prefer visible labels and semantic HTML,
not blanket aria-label additions. Specify keyboard focus and readable summaries
for custom charts. Do not invent processing delays or measured-looking activity
to make the app appear intelligent.
