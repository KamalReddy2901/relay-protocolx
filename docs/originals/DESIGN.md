# DESIGN — Relay

Art direction contract for the coding agent, written in P05. It is consistent with `SPEC.md`: SPEC controls behavior, data, scope and exclusions; this document controls presentation within them. Screen IDs (S1–S5), features (F#) and acceptance checks (AC#) refer to SPEC. Where this document and the challenge rules disagree, the rules win; where this document and SPEC disagree, SPEC wins and this file must be corrected.

---

## 1. Direction

**Visual thesis:** Relay looks like a marked-up handover sheet — a single typeset page of what you must do, with revisions redlined in place and every line footnoted to the message that says so.

This fits the domain because the user's real problem is not "too much information" but *untrustworthy reconstruction*: they need to know what is current and why. Editorial redlining and footnoted minutes are the established human tools for exactly that.

**Workflow artifacts that inform the structure**
1. **Tracked-changes / redlined document** — old text struck through, new text beside it, the change attributed. Drives the What changed pair (F11).
2. **Meeting minutes with action register** — "Decisions / Actions (owner, due) / Noted" sections. Drives the three-section brief (F7) and its strict order.
3. **Stage manager's call sheet** — one sheet, time-first, per-person calls, the *current* time and venue impossible to miss. Drives the reference-time header and verb-first, deadline-led action lines.

**Three departures from the generic UI**
1. **A document, not a dashboard.** The brief is one readable column with ruled section breaks, not a card grid or KPI strip. The user reads it top to bottom once and acts; cards would fragment a sequence that has an order of priority.
2. **Evidence lives in a margin, not a modal.** Each line carries footnote-style message references (`m57`) in a dedicated right margin; the source inspector (S5) opens *in that margin* beside the line it supports. Proof stays next to the claim, which is the product's promise.
3. **Changes are typeset as redlines.** A change reads `~~3pm · B214~~ → 4pm · LT-2` with the struck value in revision red and the current value in ink. No arrows-in-badges, no "Updated!" chips. The visual grammar is borrowed from editing because editing is what happened to the plan.

## 2. Typography

| Role | Font | Fallback stack | Use |
|---|---|---|---|
| Display | **Newsreader** (opsz 6–72, wght 500/600) | `"Iowan Old Style", Georgia, "Times New Roman", serif` | Brief title, section headings, empty-state headline only |
| Body / UI | **Public Sans** (wght 400/500/600) | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | All reading text, controls, labels |
| Data | **IBM Plex Mono** (wght 400/500) | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` | Message IDs, timestamps, raw chat lines, line numbers, model progress text |

**Loading strategy.** Self-host through `@fontsource-variable/newsreader`, `@fontsource-variable/public-sans` and `@fontsource/ibm-plex-mono` (latin subset only), imported in `src/index.css` after the Tailwind import. Self-hosting is mandatory: SPEC §8's CSP is `default-src 'self'`, so the Google Fonts CDN would be blocked. Use `font-display: swap`. Preload only Public Sans 400 (`<link rel="preload" as="font" type="font/woff2" crossorigin>`). Fallback metrics are close enough that layout must not depend on exact widths; mono columns use `ch` units.

**Rules.** Body is 16px / 1.55. Never set raw chat text in the serif. Numerals in times and dates use `font-variant-numeric: tabular-nums`. Serif appears at most once per screen region.

## 3. Color tokens

A warm paper ground with ink, plus three semantic hues for item states. Hue is never the only signal: each status also has a text label (SPEC §5 labels) and, for changes, strikethrough.

| Token | Hex | Role | Contrast target |
|---|---|---|---|
| `--paper` | `#F6F3EC` | Page background | — |
| `--sheet` | `#FFFDF8` | Brief column / input surface | — |
| `--ink` | `#1B1A17` | Primary text | ≥ 7:1 on paper and sheet |
| `--ink-2` | `#55514A` | Secondary text, metadata | ≥ 4.5:1 on paper and sheet |
| `--rule` | `#D8D2C6` | Hairline rules, dividers | Decorative, no target |
| `--rule-strong` | `#8F887C` | Input borders, control outlines | ≥ 3:1 on sheet (non-text UI) |
| `--revise` | `#9A2F1F` | Struck "before" values, Overdue | ≥ 4.5:1 on sheet |
| `--revise-wash` | `#F7E4DF` | Background of the before value | Text on it ≥ 4.5:1 |
| `--current` | `#1E5B45` | "After" value marker, Done, Confirmed | ≥ 4.5:1 on sheet |
| `--current-wash` | `#E1EEE7` | Background of the after value, quote highlight in inspector | Text on it ≥ 4.5:1 |
| `--tentative` | `#7A5410` | Proposed, Needs clarification | ≥ 4.5:1 on sheet |
| `--tentative-wash` | `#F6EBD3` | Proposed row background | Text on it ≥ 4.5:1 |
| `--focus` | `#1F4FD1` | Focus ring | ≥ 3:1 against paper and sheet |
| `--action` | `#1B1A17` | Primary button fill (ink) | Label `--sheet` ≥ 7:1 |
| `--disabled` | `#A8A196` | Disabled control text/border | Exempt, but paired with a written reason |

**Contrast status:** these are targets. Ratios are **not yet calculated**. CP2 must compute each pair (for example with a WCAG contrast checker) and record results in `docs/verification.md`, adjusting hex values that miss the target before any other visual work.

No gradients, glows or dark "AI" theme. A dark mode is out of scope for the prototype.

## 4. Scale, rhythm, grid

```css
:root {
  /* color */
  --paper:#F6F3EC; --sheet:#FFFDF8; --ink:#1B1A17; --ink-2:#55514A;
  --rule:#D8D2C6; --rule-strong:#8F887C;
  --revise:#9A2F1F; --revise-wash:#F7E4DF;
  --current:#1E5B45; --current-wash:#E1EEE7;
  --tentative:#7A5410; --tentative-wash:#F6EBD3;
  --focus:#1F4FD1; --action:#1B1A17; --disabled:#A8A196;

  /* type */
  --font-display:"Newsreader Variable","Iowan Old Style",Georgia,"Times New Roman",serif;
  --font-body:"Public Sans Variable",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --font-data:"IBM Plex Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;

  --text-xs:0.8125rem;   /* 13px — mono metadata only */
  --text-sm:0.875rem;    /* 14px — labels, reason text */
  --text-base:1rem;      /* 16px — body default */
  --text-md:1.125rem;    /* 18px — action line titles */
  --text-lg:1.5rem;      /* 24px — section headings (serif) */
  --text-xl:2.25rem;     /* 36px — brief title / S1 headline (serif) */
  --leading-tight:1.2; --leading-body:1.55;

  /* space: 4px base, 8px rhythm */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px;
  --s-6:32px; --s-7:48px; --s-8:64px;

  /* layout */
  --measure:68ch;           /* brief column max */
  --margin-col:360px;       /* evidence margin at ≥1280px */
  --gutter:var(--s-6);

  /* shape */
  --radius-0:0; --radius-1:3px; --radius-2:6px;
  --hairline:1px solid var(--rule);
  --outline:1px solid var(--rule-strong);
  --focus-ring:0 0 0 2px var(--sheet), 0 0 0 4px var(--focus);

  /* motion */
  --ease-out:cubic-bezier(.2,.7,.2,1);
  --dur-1:120ms; --dur-2:200ms; --dur-3:280ms;
}
@media (prefers-reduced-motion: reduce){
  :root{ --dur-1:0ms; --dur-2:0ms; --dur-3:0ms; }
}
```

**Smaller sizes justified.** 14px is used only for short labels and reason text attached to a 16–18px line; 13px only for mono IDs and timestamps, which are scanned reference marks, not reading text. Nothing the user must read to act is below 16px.

**Grid.**
- Page: 12 columns, 32px gutter, 48px outer margins at ≥1280px.
- Brief layout ≥1280px: `[line-number rail 56px] [brief column ≤68ch] [evidence margin 360px]`, centered with paper visible on both sides.
- Alignment: everything in the brief column is flush-left on one edge; deadlines sit in a fixed 12ch mono column at the left of each action line so times align vertically like a call sheet.

**Borders and radius.** Hairline rules separate sections and items; no drop shadows, except a 1px `--rule-strong` outline on the inspector panel. Radius: 0 for the sheet and rules, 3px for inputs and buttons, 6px for the inspector panel only. No pill badges.

**Density.** Comfortable reading density in the brief (24px between items, 48px between sections). Compact density in S2's parse issues table (row height 36px, mono). The difference is deliberate: the brief is read, the issues are scanned.

**Icons and imagery.** Lucide icons (stroke 1.5, 16/20px, `currentColor`), used sparingly: `FileText` (import), `CornerDownRight` (source jump), `Check` (Done), `X` (close), `AlertTriangle` (issue). No illustration, no photography, no AI sparkle iconography. Relay is a private-content tool; imagery would be decoration.

## 5. First useful screen — S1 Import

S1 is the first screen; there is no landing page. It must look like the top of the sheet before anything is written on it.

**Hierarchy and copy**
1. Wordmark top-left: "Relay" (Newsreader 600, 20px). Top-right, in `--ink-2` 14px: "Runs in this browser · No account".
2. Headline (serif, `--text-xl`): **"What did you miss?"**
3. Subhead (16px, `--ink-2`, ≤ 60ch): "Paste the chat you've been away from. Relay finds what's changed, what's yours to do, and the messages that say so."
4. **Paste area** (the dominant region): labeled `<label>` "Chat text"; mono 14px placeholder lines showing a real supported shape:
   `09/10/26, 18:02 - Sam: could we do 4?`
   Min height 18 lines at desktop.
5. Beside/below the area: "Or **choose a .txt export**" (native `<input type="file">` styled as a text button, labeled "Choose a .txt export").
6. **Primary action:** "Review messages" (ink fill, 44px tall). Disabled until text exists, with the visible reason "Paste or choose a chat to continue."
7. Supported-format note, collapsed by default as a native `<details>`: "Supported formats" → four example lines from SPEC §7.1.
8. Secondary text button: "Load example chat (synthetic)" — loads input only (SPEC §9).
9. Privacy line under the action, 14px `--ink-2`: "Your chat is processed in this browser. It is not uploaded. The AI model (about several GB of files on first use) downloads from its public host." The model size is not stated as a number until measured in CP1.

**Route to the outcome.** S1 → Review messages → S2 → Catch me up → S3 → S4. A three-step progress marker at the top of the column reads in text: "1 Paste · 2 Check · 3 Catch up" with the current step in ink and bold, the others `--ink-2`. It is an ordered list, not a decorative stepper.

### Wireframes — S1

1440px (sheet centered, 760px wide; generous paper either side)
```
|<-- 340 paper -->|<------------- 760 sheet ------------->|<-- 340 paper -->|
                   Relay                Runs in this browser · No account
                   1 Paste · 2 Check · 3 Catch up
                   What did you miss?                         (serif 36)
                   Paste the chat you've been away from...
                   Chat text
                   +-----------------------------------------------------+
                   | 09/10/26, 18:02 - Sam: could we do 4?   (mono ph)   |
                   |                                                     |
                   |                      18 lines                       |
                   +-----------------------------------------------------+
                   [ Review messages ]   Or choose a .txt export
                   Your chat is processed in this browser...
                   > Supported formats        Load example chat (synthetic)
```

1024px (sheet 720px, 152px paper each side; identical order)
```
|152|<----------------- 720 sheet ----------------->|152|
     Relay                  Runs in this browser · No account
     What did you miss?
     +-------------------------------------------------+
     |            paste area, 16 lines                 |
     +-------------------------------------------------+
     [ Review messages ]  Or choose a .txt export
```

390px (full-bleed sheet, 16px padding; action stays in the first viewport below a shorter area)
```
|16|<--------- 358 --------->|16|
   Relay        No account
   What did you miss?  (serif 28)
   Paste the chat you've been...
   Chat text
   +-----------------------+
   |  paste area, 8 lines  |
   +-----------------------+
   [   Review messages   ]  (full width)
   Choose a .txt export
   Processed in this browser...
```

## 6. Main result screen — S4 Brief with S5 margin

This is the protected composition.

**Header block** (top of sheet):
- Serif title: "Catch-up for **Kamal**"
- Mono line, 13px `--ink-2`: `132 unread of 214 · resolved against 10 Oct 2026 09:14 IST`
- Coverage line, 16px: "Complete — all 132 unread messages read." or the Partial banner (§8).
- Controls row: native `<select>` labeled "Viewing as" (identity switch, F13), text buttons "Run again" and "Start over".

**Sections, in fixed order**, each an `<h2>` in serif 24px with a count in body text ("Act now · 2"):

1. **Act now.** Each item is one row:
   `[due, mono 12ch]  Bring the projector to LT-2            m57 ›`
   `                  Assigned to you · Reassigned from Arjun`
   Title 18px ink, verb first. Reason text 14px `--ink-2`, joined with " · ". Row actions on the right of the title on hover and focus, always visible on touch: "Done", "Not mine", "Edit". Overdue rows show "Overdue" in `--revise` text at the start of the due column.
2. **What changed.** Each change is a redline pair:
   `Venue   ~~B214~~  →  LT-2          m12 › m57 ›`
   `Time    ~~3pm~~   →  4pm`
   `For you: you now bring the projector (was Arjun).`
   The field label is mono 13px; the before value is struck in `--revise` on `--revise-wash`; the after value is ink on `--current-wash`, weight 600. The personal consequence line is 16px ink, starting with "For you:".
3. **For context.** Quieter: 16px `--ink-2` rows with a status label word first ("Proposed — could we move to 4pm? m41 ›"). "Needs clarification" rows show both values side by side, neither struck. The discarded-suggestions count is a closed `<details>` at the end.

Footer of the sheet: "Generated in this browser by Qwen3-4B (WebLLM) from the messages above." (SPEC §9 label, exact).

**Evidence margin (S5).** At ≥1280px a persistent right column. Empty state: "Select a line to see the messages behind it." When open: messages in mono 14px with author, timestamp, ±2 surrounding messages in `--ink-2`, quoted span on `--current-wash` with a 2px left bar, and the note "Quote matches source. Check the interpretation yourself." Below 1280px the margin becomes an overlay panel from the right (1024px) or a bottom sheet at 90% height (390px).

### Wireframes — S4

1440px
```
|48|56 |<------------ 680 brief column ------------>|32|<--- 360 margin --->|  remaining paper
    rail Catch-up for Kamal                (serif)      Sources
         132 unread of 214 · resolved 10 Oct 09:14 IST  ------------------
         Complete — all 132 unread messages read.       m12 Priya 9 Oct 14:10
         Viewing as [Kamal v]  Run again  Start over     "...confirmed for 3pm
         ───────────────────────────────────────────     in Room B214..."
         Act now · 2                                    ------------------
     01  4pm 10 Oct  Bring the projector to LT-2  m57›  m57 Priya 10 Oct 08:40
                     Assigned to you · Reassigned...     "...moved to LT-2 at
     02  No date     Send the budget sheet        m33›   4pm..."
         ───────────────────────────────────────────    Quote matches source.
         What changed · 1                               Check the interpretation.
         Venue ~~B214~~ → LT-2           m12› m57›      [Close  Esc]
         Time  ~~3pm~~  → 4pm
         For you: you now bring the projector.
         ───────────────────────────────────────────
         For context · 4
         Proposed — could we move to 4pm?  m41›
```

1024px (margin becomes a 400px overlay panel when a source is open; brief takes the full sheet width)
```
|32|<------------- 960 brief, ≤68ch text ------------->|32|
     Catch-up for Kamal          Viewing as [Kamal v]
     Act now · 2
     4pm 10 Oct  Bring the projector to LT-2        m57›
                                  ┌──── 400 panel ────┐ (over the brief, right edge)
                                  │ Sources   [Close] │
                                  │ m12 ... m57 ...   │
                                  └───────────────────┘
```

390px (due date moves above the title; references wrap to a line below)
```
|16|<-------- 358 -------->|16|
   Catch-up for Kamal
   132 unread · Complete
   Viewing as [Kamal v]
   Act now · 2
   4pm · 10 Oct
   Bring the projector to LT-2
   Assigned to you · From Arjun
   Sources m57 ›    [Done] [⋯]
   What changed · 1
   Venue ~~B214~~ → LT-2
   Time  ~~3pm~~  → 4pm
   For you: you bring the projector
   ── bottom sheet when opened ──
```

## 7. Signature interaction — opening a change (F11)

**Trigger:** activating a What changed pair (click, Enter or Space on the pair's row, which is a `<button>` wrapping the pair summary).

**State change:** the selected pair becomes `selected`, and the evidence margin switches from its previous content to the two sources for that pair, labeled **Before** (`m12`) and **After** (`m57`), in chronological order with any linked proposal (`m41`) between them, labeled "Proposed".

**Values:** both values are displayed, never computed: `Time 3pm → 4pm`, `Venue B214 → LT-2` (units come from the source text; times are shown in the selected timezone, e.g. "4pm IST").

**What moves:**
1. In the brief, the selected row gets a 3px `--ink` left bar (instant) and its background becomes `--sheet`-on-`--paper` emphasis. No motion here.
2. In the margin, the previous content fades out (opacity 1→0, `--dur-1`), then the Before and After messages enter: opacity 0→1 and translateY 8px→0, `--dur-3`, `--ease-out`, with the After message staggered 60ms behind the Before message. The order of entry mirrors the order in time.
3. In each message, the quoted span's `--current-wash` background (for After) or `--revise-wash` (for Before) appears with the message; it is not animated separately.

Use Framer Motion `AnimatePresence` with `mode="wait"` keyed on the selected item ID, and `layout` disabled on the brief column so it never shifts while reading. Total time under 400ms. This is a reaction to a selection, not an indicator of processing.

**Keyboard:**
- Tab reaches each pair in document order; Enter or Space opens it.
- Focus moves to the margin heading ("Sources for: Venue and time change") at ≥1280px only when the user chose the pair with the keyboard; at panel/sheet widths focus always moves into the panel and is trapped.
- Inside the margin, "Previous source" / "Next source" buttons and the J/K keys step between Before, Proposed and After.
- Esc closes the panel (narrow widths) or clears the selection (wide), returning focus to the originating pair.

**Reduced motion:** all durations become 0 (token override); the margin content swaps instantly and the left bar on the selected row remains the change indicator.

**Secondary meaningful motion (F9).** Marking an item **Done** collapses its row height to 0 over `--dur-2` and moves it into a "Done · 1" `<details>` at the end of Act now; the count updates in text. Undo is offered in an inline status message for 8 seconds ("Marked done. Undo") announced through `aria-live="polite"`. Reduced motion: instant move.

## 8. States

| State | Presentation |
|---|---|
| **Empty (S1)** | As in §5. The paste area is focused on load. |
| **Parse review (S2)** | Same sheet. Summary sentence in 18px: "214 messages from 7 people. 3 lines need a look." Issues as a compact mono table (line, raw text, what Relay did). Required choices (identity, date order) are native `<select>`/radio groups with visible labels; unresolved choices show their reason next to the disabled "Catch me up" button. |
| **Model setup (S3)** | Plain text, no spinner theatre. Sheet shows "Getting the model ready" (serif), the WebLLM progress text verbatim in mono, and a native `<progress>` element whose value is the reported fraction only. If WebLLM reports no fraction, show text only — no indeterminate bar pretending to know. Cancel button. Cached case: one line, "Model ready (cached on this device)". |
| **Running** | "Reading messages 81–160 (section 2 of 3)" in body text, updated only when a chunk actually starts; completed sections listed as text lines with a check icon. No fake percentage. |
| **Success** | S4 as in §6. Coverage line in `--current`, with the word "Complete". |
| **Partial** | A ruled banner at the top of the sheet, `--tentative-wash` background, 4px `--tentative` left bar: "Partial — 2 of 5 sections couldn't be read (m81–m160). Items from those messages may be missing." Button "Retry failed sections". The title becomes "Partial catch-up for Kamal". |
| **No actions** | Act now section reads: "Nothing assigned to you in the unread messages." in 18px ink. Other sections still render. Never styled as an error. |
| **Errors** | Inline near the cause, not as toasts: `--revise` 4px left bar, AlertTriangle icon, a plain sentence naming what failed, and one recovery button (Retry, Choose another file, Back). Unsupported device uses SPEC §10 copy exactly and no recovery button that pretends to work. |
| **Focus** | `box-shadow: var(--focus-ring)` on every interactive element via `:focus-visible`; never removed. Rows in the brief show the ring around the whole row. |
| **Disabled** | `--disabled` text and border, `cursor: not-allowed`, plus a visible written reason adjacent. Disabled buttons keep `aria-disabled="true"` and remain focusable so the reason can be reached. |
| **Hover** | Rows: background `--paper` → `--sheet` emphasis only; no lift or shadow. |

## 9. Layouts

- **Laptop (1280–1600px):** three-column brief with persistent evidence margin, as in §6.
- **Presentation (1920px projected, or browser zoom 150% at 1280px):** the sheet stays centered with `--measure` 68ch; the root font scales through `html { font-size: clamp(16px, 0.9vw + 6px, 20px) }` at ≥1600px so the brief reads from a distance. The margin stays docked. No new layout.
- **Tablet / small laptop (768–1279px):** single column; evidence opens as a 400px right overlay panel with a scrim at 40% `--ink`.
- **Narrow (<768px):** single column, 16px padding; due date stacks above the title; row actions collapse to "Done" plus a native-menu "More" button labeled "More actions for: <title>"; evidence opens as a bottom sheet.

**Long content**
- Titles wrap; never truncated with ellipsis. Long raw messages in the inspector show the first 12 lines with "Show full message (38 lines)".
- Participant names over 24 characters wrap in tables; the identity `<select>` uses native text.
- More than 8 items in For context: the first 8 are shown, then "Show 14 more".
- The S2 issues table scrolls inside a region with a visible heading and is keyboard-scrollable (`tabindex="0"`, labeled by the heading).
- Very long chats keep the brief fast: the inspector renders only the selected messages ±2, never the full chat.

## 10. Familiar patterns kept

- Native `<select>`, `<input type="file">`, `<details>`, `<progress>`, radios and buttons — accessible names come from visible `<label>` text and button text.
- Standard step order (Paste → Check → Catch up) with Back buttons.
- Strikethrough for "no longer true", because it is universally read that way.
- Esc to close, Tab order equals visual order, Enter to activate.
- Inline "Undo" after Done.
- A confirm dialog (native `<dialog>`) for Start over: "Delete this chat and catch-up from this browser?" with buttons "Delete and start over" and "Cancel".

No custom charts are used. If any summary graphic is later proposed, it must have a text equivalent and be justified against SPEC — none is planned.

## 11. Visual acceptance checks

| V# | Check | Screen / state | How to verify |
|---|---|---|---|
| V1 | First viewport at 1440×900 and 390×844 shows the headline, paste area and "Review messages" without scrolling; no marketing content above | S1 empty | Screenshot |
| V2 | Computed `font-size` of body text and S4 item titles is ≥ 16px; only mono IDs/timestamps are 13px | S1, S4 | Computed styles |
| V3 | `h1`/`h2` use Newsreader (or its serif fallback); raw chat text uses the mono stack; nowhere does chat text use the serif | S2, S4, S5 | Computed `font-family` |
| V4 | At 1440px, brief text column is ≤ 68ch and the evidence margin is visible to its right | S4 success | Screenshot + computed width |
| V5 | A change pair shows the before value with `text-decoration: line-through` in `--revise` and the after value in ink, plus the "For you:" line when applicable | S4 What changed | Screenshot + computed styles |
| V6 | Status words (Confirmed, Proposed, Needs clarification, Overdue, Cancelled) are present as text, not color only; grayscale screenshot still distinguishes states | S4 | Grayscale screenshot |
| V7 | Every interactive element shows the 2px focus ring in `--focus` on keyboard focus | All | Keyboard screenshots |
| V8 | Opening a change shows Before and After sources in chronological order with highlighted quotes; Esc returns focus to the originating row | S5 | Screenshot + `document.activeElement` |
| V9 | With `prefers-reduced-motion: reduce`, computed transition/animation durations are 0 | S4, S5 | Emulated media + computed styles |
| V10 | Model setup shows the WebLLM progress text verbatim and a `<progress>` only when a fraction is reported; no spinner or invented percentage | S3 | Screenshot during real download |
| V11 | Partial state shows the tentative banner, "Partial catch-up" title and the failed message range | S4 partial | Screenshot (forced chunk failure in test) |
| V12 | No gradients, drop shadows (except inspector outline), pill badges, card grids or sparkle icons anywhere | All | Screenshot review + CSS grep for `gradient`, `box-shadow` |

## 12. Protected decisions

Preserve these unless a concrete defect (failed contrast, broken accessibility, failed AC) forces a change; record any change and its reason in `docs/verification.md`.

1. **Composition:** S4 is one document column with a right evidence margin. No card grid, no dashboard header, no KPI tiles.
2. **Section order:** Act now → What changed → For context, as SPEC F7 defines.
3. **Redline grammar:** changes are shown with struck before values beside current values, with both message references (F11). No "Updated" chips or arrow badges.
4. **Evidence placement:** sources open beside the claim (margin, panel or sheet by width), never in a centered modal that hides the brief.
5. **Typography roles:** serif for headings only, Public Sans for reading and controls, Plex Mono for message data. Body 16px minimum.
6. **Color roles:** revise red = no longer current or overdue; green = current or done; amber = tentative or unclear. These meanings never swap and are always paired with words.
7. **Honest loading:** progress shows only what WebLLM or the chunk loop actually reports.
8. **First screen is the task:** S1 is the paste area; no landing page, login or tour.
9. **Motion only for selection and acknowledgment**, using Framer Motion with the reduced-motion override.

Screen-to-SPEC links: S1 → F1, AC1–AC5; S2 → F2, F3; S3 → F4, F5, F14, AC6, AC16–AC17; S4 → F7, F9, F10, F11, F12, F13, F14, AC7–AC12, AC18; S5 → F8, AC19. Excluded features from SPEC §3 (integrations, login, analytics, numeric scores, cloud fallback, sample-output fallback, landing page) stay excluded; the "Load example chat (synthetic)" button loads input only.
