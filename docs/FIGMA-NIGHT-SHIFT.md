Relay: "Night Shift" redesign
One idea: catching up on a chat feels like starting a shift. Someone has been handling the conversation while you were away, and Relay hands you a single bright desk lamp: a dark workspace where only what needs you is lit up in highlighter. Everything else stays dim until you ask for proof.

This replaces the whole warm-paper, editorial, redline direction. Nothing carries over: no serif headings, no paper, no tracked-edit marks, no margin column.

1. Principles
Lit means it's yours. A yellow highlighter fill marks only things that need your action. If something is highlighted, you have to deal with it.
The chat is a timeline, not a document. A vertical "thread rail" shows the whole pasted chat as a compressed bar of ticks. Every brief item maps to a place on it.
Proof sits behind the claim. Evidence isn't shown alongside every item. You pull it into view with a "proof drawer", and the source message lights up on the rail.
Big counts, short sentences. The brief opens like a scoreboard: how many actions, changes and decisions, in very large type.
2. Typography (Google Fonts only)
Role	Face	Use
Display	Bricolage Grotesque (variable, opsz + wdth)	Counts, section labels, screen titles. Tight, condensed, loud.
Body	Atkinson Hyperlegible 400/700	Brief items and chat text. Built for legibility in dense reading.
Mono	JetBrains Mono 400/600	Message IDs, timestamps, sender handles, keyboard hints.
Scale (fluid, clamp-based):

--fs-count: clamp(4rem, 12vw, 9rem), Bricolage 800, wdth 75, line-height 0.85, tracking -0.04em
--fs-h1: clamp(2rem, 5vw, 3.5rem), Bricolage 700, wdth 85
--fs-label: 0.75rem, Bricolage 700, uppercase, tracking 0.14em
--fs-item: 1.125rem, Atkinson 700 for the claim, 400 for the detail
--fs-body: 1rem / 1.6
--fs-meta: 0.8125rem, JetBrains Mono
3. Palette and tokens
The theme is dark by default, with a matching light theme. Contrast was checked against WCAG AA for body text and AAA for item claims.

:root {
  /* surfaces – "after hours" */
  --bg:            #0E1420;   /* desk */
  --surface:       #161E2D;   /* cards, drawer */
  --surface-2:     #1F2A3D;   /* hover, inputs */
  --line:          #2C3950;   /* hairlines */
  --ink:           #EEF1F6;   /* primary text */
  --ink-dim:       #8E9AB0;   /* secondary / unlit */
  --ink-faint:     #5A6680;   /* rail ticks, disabled */

  /* signal colours – each means exactly one thing */
  --lit:           #F2FF5C;   /* NEEDS YOU – highlighter */
  --lit-ink:       #14180A;   /* text on --lit */
  --shift:         #FF7A59;   /* CHANGED – something moved */
  --settled:       #5EE6B8;   /* DECIDED / confirmed */
  --proof:         #8FB4FF;   /* evidence links, source focus */

  /* glows (lamp effect) */
  --glow-lit:      0 0 0 1px #F2FF5C33, 0 12px 48px -12px #F2FF5C40;
  --glow-proof:    0 0 0 2px #8FB4FF, 0 0 24px #8FB4FF55;

  /* type */
  --font-display: "Bricolage Grotesque", system-ui, sans-serif;
  --font-body:    "Atkinson Hyperlegible", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  /* space – 4px base */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px;
  --s6: 32px; --s7: 48px; --s8: 72px; --s9: 112px;

  /* shape and motion */
  --r-sm: 6px; --r-md: 12px; --r-lg: 20px; --r-pill: 999px;
  --ease-out: cubic-bezier(.2,.8,.2,1);
  --t-fast: 120ms; --t-med: 240ms; --t-slow: 520ms;

  /* layout */
  --rail-w: 56px;
  --drawer-w: 420px;
  --content-max: 760px;
  --topbar-h: 56px;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #F3F1EA; --surface: #FFFFFF; --surface-2: #ECE9DF;
    --line: #D8D3C4; --ink: #121722; --ink-dim: #545D6E; --ink-faint: #9AA1AE;
    --lit: #EEFF3A; --shift: #D9431F; --settled: #0E8F67; --proof: #2F5BD3;
    --glow-lit: 0 0 0 1px #12172214, 0 10px 30px -14px #9AA11455;
  }
}
Highlighter treatment. The .lit text marker is a hand-swiped fill, not a badge: background: linear-gradient(transparent 12%, var(--lit) 12% 88%, transparent 88%); color: var(--lit-ink); padding: 0 .15em; box-decoration-break: clone; Change and decision markers use a 3px left bar in --shift or --settled, never a fill.

4. Paste screen: "Start your shift"
Desktop (≥1024px)
Top bar (56px, full width, transparent over --bg): wordmark "relay" in Bricolage 800 lowercase on the left, with a small --lit dot as the "on" light. On the right, a mono status pill for the local model (● model local · ready, or a progress readout while loading). That pill is the only status chrome.
Composition: an asymmetric split, roughly 5/12 left and 7/12 right, with no outer card.
Left: a stacked headline in --fs-h1: "You were away." on the first line, then "Here's your shift." with "your shift" swiped in --lit. Below it, three mono lines in --ink-dim explain what happens: 01 paste the chat / 02 relay reads it on this device / 03 get what needs you, with proof. Underneath, a privacy line with a lock glyph: "Nothing leaves this browser."
Right: a large drop/paste surface in --surface with radius --r-lg, a 1px --line border and at least 60vh of height. The textarea uses JetBrains Mono at 0.875rem with a ghost placeholder showing a sample chat line ([09:14] Priya: moving standup to 4pm).
When text is present, a live thread rail preview appears on the surface's left edge. Every parsed message becomes a tick (2px × 4px, --ink-faint), so the user can see the chat being "understood" as they paste. A mono counter at top right reads 214 messages · 6 people · 3 days.
The primary button docks at the bottom right of the surface: "Start shift →". It's a --lit fill with --lit-ink text, Bricolage 700, a pill shape and --glow-lit. The secondary actions "Try sample chat" and "Clear" are text buttons in --ink-dim.
Processing state: the input surface stays where it is. The rail ticks run a scan line: a --lit gradient sweeps top to bottom, repeating, and each tick brightens as the worker reports progress. The button changes to "Reading… 62%" (mono numerals) with a Cancel option. If the user prefers reduced motion, a static progress bar replaces the sweep.
Mobile (<640px)
One column. The headline shrinks to 2 lines and the step list collapses into one mono line.
The paste surface fills the width with min-height 50vh, and the rail is hidden to save space. The message counter moves above the surface.
"Start shift" becomes a sticky bottom action bar (full-width pill, safe-area padding).
States
Empty, pasted, unparseable, model loading, processing, error and cancelled are all inline on the surface, using existing SPEC.md copy where it exists. Errors use a --shift left bar plus a message, never a modal.

5. Populated brief: "Your shift"
Desktop: three zones
┌──────────────────────────────────────────────────────────────────────┐
│ relay●   Shift · Design team chat · 214 msgs     [New shift] [Copy]  │ topbar
├────┬───────────────────────────────────────────┬─────────────────────┤
│ ▮  │  3          2          4                  │                     │
│ ▮  │  NEED YOU   CHANGED    DECIDED            │   PROOF DRAWER      │
│ ━  │ ───────────────────────────────────────── │   (closed by        │
│ ▮  │  NEEDS YOU                                │    default; opens   │
│ ━  │  ▌Send Priya the revised deck by Thu      │    on item select)  │
│ ▮  │    asked by Priya · 2 sources ⟶           │                     │
│ ▮  │  CHANGED                                  │                     │
│ ━  │  ▌Standup  3pm → 4pm                      │                     │
│ ▮  │  DECIDED                                  │                     │
└────┴───────────────────────────────────────────┴─────────────────────┘
 rail        brief column (max 760)                drawer 420px
Zone A: thread rail (56px, sticky, full height under the top bar)

The whole chat as a vertical strip. Each message is a tick whose length is proportional to message length (2–24px) in --ink-faint. Day boundaries are mono labels (MON, TUE).
Messages cited as sources are marked in their category colour: --lit for action, --shift for change, --settled for decision. The rail becomes a heatmap of where the important parts of the chat are.
Hovering or focusing an item in the brief highlights its source ticks on the rail with --glow-proof. Clicking a marked tick opens the drawer on that message.
A viewport indicator (a translucent bracket) shows which messages are visible in the drawer.
Zone B: brief column

Scoreboard at the top: three counts in --fs-count. "NEED YOU" is a --lit numeral, "CHANGED" is --shift and "DECIDED" is --settled, each with a --fs-label caption. Each count is a button that jumps to its section. Zero counts drop to --ink-faint and read "nothing".
Optionally, a one-sentence summary line (SPEC.md's overview/TL;DR field) in --fs-item 400 --ink-dim, max 2 lines.
Sections in this order, each with a sticky --fs-label header: Needs you → Changed → Decided → then any other categories SPEC.md defines (open questions, FYI), styled dimmer.
Item anatomy:
Claim in Atkinson 700 --fs-item. For Needs you items, the claim's key verb phrase is highlighted with .lit.
Changed items render as old → new on one line: old value in --ink-dim with a thin strikethrough, an arrow in --shift, new value in --ink 700. A 3px --shift left bar marks the row.
Decided items get a 3px --settled left bar and a ✓ glyph from the project icon set.
A meta row in mono --fs-meta: owner or asker, due date, and a source link (2 sources ⟶, in --proof). It also shows SPEC.md's confidence or uncertainty indicator if one exists, as a dotted underline with a tooltip, never a color alone.
The whole row is a button. Hover fills it with --surface. Selected adds --surface-2 plus a 2px --proof left inset.
Items can be checked off ("Got it"). Checked items collapse to one dim line, and the scoreboard count ticks down with a 240ms number roll. This state is session-local unless SPEC.md persists it.
Zone C: proof drawer (420px, slides in from the right over --t-med, pushing the brief column rather than overlaying it on ≥1280px and overlaying it on 1024–1279px)

Header: the item's claim in short form plus Proof · 2 messages.
Body: the cited source messages rendered as chat bubbles: sender in mono, timestamp, and the message text in Atkinson. The exact span supporting the claim is swiped in a translucent --proof marker.
Each source has 1–2 surrounding messages of context in --ink-dim, plus an "Expand context" option.
On Changed items, the "before" and "after" source messages are stacked under mono labels WAS · msg #41 / NOW · msg #188.
Close it with Esc, the × button, or by clicking the selected item again. Opening the drawer moves focus into it, and closing it returns focus to the item.
Top bar on the brief: the wordmark, then a mono shift title (chat name or first participant set, message count, date range). On the right: "New shift" (returns to the paste screen, with confirmation if items are checked), "Copy brief" (plain text with source IDs), and the model status pill.

Tablet (640–1023px)
The rail shrinks to 32px and stays visible. The drawer becomes a bottom sheet at 70vh with a drag handle, and the scoreboard counts shrink.
Mobile (<640px)
No side rail. A horizontal rail (8px tall, full width) sits under the top bar showing the same heatmap. Tapping it scrubs through the chat.
The scoreboard becomes a horizontal row of three compact counts (3rem numerals) that stays sticky as a segmented nav while scrolling.
Items are full width. The proof drawer is a full-height sheet with a "Back to shift" header.
Sticky bottom bar: "Copy brief" / "New shift".
6. Interactions and motion
Reveal on load: the scoreboard numbers count up from 0 over --t-slow, then sections fade and rise 8px, staggered 40ms apart. Rail marks then light up top to bottom in one sweep.
Item ↔ rail linking: hovering or focusing an item lights its rail ticks within --t-fast. Hovering a rail tick shows a mono tooltip (#188 · Priya · Tue 14:02).
Keyboard: j/k move between items, Enter opens proof, Esc closes it, x checks an item off, 1/2/3 jump to sections, / focuses the paste box on the paste screen. A "Keys" hint sits in the footer in mono.
Reduced motion: no count-up, sweep or slide. The drawer just appears. Glows stay because they're static.
Focus: a 2px --proof outline with 2px offset on every focusable element. It's never removed.
7. Accessibility and fidelity to SPEC.md
Category is never shown by color alone. Every item sits under a text section label and carries a glyph (● action, → change, ✓ decision).
The scoreboard is an <nav aria-label="Brief sections">. The rail is an aria-hidden visual, mirrored by the accessible source links in each item. The drawer is role="dialog" (sheet on mobile) or role="complementary" (pushed on desktop).
Every SPEC.md behavior stays the same: the same parsing, worker inference, categories, source-linking to exact messages, copy and export, error and cancel paths, CSP and local-only guarantees, and AC1–AC22. The redesign only changes presentation and adds presentation-level interactions: the rail, the drawer and session-local check-off. If check-off conflicts with SPEC.md, drop it.
8. Implementation brief for Codex
REPO: KamalReddy2901/relay-protocolx
GOAL: Replace the visual direction with "Night Shift" (below). Presentation-only rewrite.
SPEC.md is binding for functionality and AC1–AC22. DESIGN.md is superseded: replace its
contents with this direction (sections 1–7 of the proposal) as the new design source of truth.

HARD CONSTRAINTS
- Do not change src/domain, src/inference, src/worker logic, data shapes, or the CSP.
- Fonts: Bricolage Grotesque (variable, opsz+wdth), Atkinson Hyperlegible 400/700,
  JetBrains Mono 400/600. Self-host via @fontsource packages (CSP-safe); remove
  Newsreader/Public Sans/IBM Plex Mono and old paper/redline/margin CSS.
- All colours/spacing/motion via the CSS custom properties in section 3 (dark default,
  prefers-color-scheme: light override). No hard-coded hex outside :root.

TASKS
1. src/index.css: replace tokens with section 3 verbatim; add base styles (body uses
   --font-body 16px/1.6 on --bg/--ink), .lit highlighter, .bar-shift/.bar-settled left bars,
   focus-visible outline 2px var(--proof) offset 2px, reduced-motion overrides.
2. Paste screen (src/ui): asymmetric 5/7 grid ≥1024, single column <640 with sticky bottom CTA.
   Headline "You were away. / Here's your shift." with "your shift" in .lit; 3-step mono list;
   privacy line. Paste surface with live tick-rail preview + "N messages · N people · span" counter
   (derive from existing parser output only). Primary "Start shift →", secondary "Try sample chat"
   / "Clear". Processing: rail scan sweep + "Reading… NN%" from existing worker progress + Cancel.
   Inline error/empty/loading states reusing existing copy.
3. Brief screen: three-zone layout — ThreadRail (56px sticky; 32px tablet; horizontal 8px strip
   mobile), BriefColumn (max 760px), ProofDrawer (420px; push ≥1280, overlay 1024–1279,
   bottom sheet 640–1023, full sheet <640).
   - Scoreboard: counts per category in --fs-count with category colours; buttons jump to sections;
     sticky segmented nav on mobile.
   - Sections ordered Needs you → Changed → Decided → remaining SPEC categories (dimmer).
   - Item rows per section 5 anatomy; Changed renders "old → new" single line; meta row mono with
     source link. Whole row is a button that opens ProofDrawer.
   - ProofDrawer: cited messages as bubbles with supporting span marked in --proof, ±2 context
     messages, "Expand context"; WAS/NOW stacking for changes. Esc/×/re-click closes; focus trap
     on sheet modes, focus return on close.
   - Rail: tick per message (length ∝ text length, 2–24px), day labels, source ticks coloured by
     category, hover/focus linking with --glow-proof, tooltip "#id · sender · time", click opens
     drawer at message. aria-hidden; accessible links live on items.
   - Top bar: wordmark + lit dot, mono shift title, New shift (confirm if items checked), Copy brief
     (existing export), model status pill. Same container on both screens.
   - Session-local "Got it" check-off with count roll — only if it doesn't conflict with SPEC.md.
4. Motion per section 6 (count-up, staggered rise, rail sweep, drawer slide) using CSS transitions;
   all disabled under prefers-reduced-motion. Keyboard: j/k, Enter, Esc, x, 1/2/3, "/".
5. Rewrite DESIGN.md to document this system.

VERIFY
- Run the repo's existing build, typecheck, lint and test scripts exactly as defined in package.json.
- Walk AC1–AC22 on the new UI; confirm no network requests beyond existing allowances.
- Check 360px, 768px, 1280px, 1440px widths; light and dark; keyboard-only path; axe/contrast AA.
- Summarize the diff by file and list any SPEC conflicts you resolved and how.