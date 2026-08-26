---
name: Athiya's Hyderabad Biryani
description: Direct-order site for the Old City — hand-painted signboards, stamped bill chits
colors:
  paper: "#f4ead2"
  paper-deep: "#e9dbb8"
  paper-light: "#faf3e1"
  ink: "#2b2114"
  ink-soft: "#6b5a44"
  ink-faint: "#9c8a70"
  board-green: "#4a7c47"
  board-green-deep: "#325a31"
  board-dark: "#15130e"
  gold: "#d9a441"
  gold-light: "#f0c766"
  brick: "#b23a2e"
  brick-deep: "#8e2c22"
  paid: "#3e7c4f"
  amber: "#c98a1f"
typography:
  display:
    fontFamily: "\"Rozha One\", \"Times New Roman\", serif"
    fontSize: "clamp(20px, 5.4vw, 30px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.02em"
  body:
    fontFamily: "\"Mukta\", system-ui, -apple-system, \"Segoe UI\", sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "\"Mukta\", system-ui, -apple-system, \"Segoe UI\", sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.14em"
    textTransform: "uppercase"
rounded:
  board: "10px 18px 12px 16px"
  card: "8px 14px 9px 13px"
  chit: "6px 10px 6px 12px"
  btn: "6px 14px 7px 12px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
components:
  button-primary:
    backgroundColor: "{colors.brick}"
    textColor: "#ffffff"
    typography: "{typography.display}"
    rounded: "{rounded.btn}"
    padding: "10px 18px"
  button-primary-active:
    backgroundColor: "{colors.brick-deep}"
    textColor: "#ffffff"
    typography: "{typography.display}"
    rounded: "{rounded.btn}"
    padding: "10px 18px"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.board-dark}"
    typography: "{typography.display}"
    rounded: "{rounded.btn}"
    padding: "10px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.btn}"
    padding: "10px 18px"
  shelf-tab:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.btn}"
    padding: "6px 16px"
  shelf-tab-selected:
    backgroundColor: "{colors.board-green}"
    textColor: "{colors.gold-light}"
    typography: "{typography.display}"
    rounded: "{rounded.btn}"
    padding: "6px 16px"
  add-btn:
    backgroundColor: "{colors.brick}"
    textColor: "#ffffff"
    rounded: "50% 60% 55% 65%"
    size: "34px"
  chit:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chit}"
    padding: "14px"
---

# Design System: Athiya's Hyderabad Biryani

## Overview

**Creative North Star: "The Bazaar Facade"**

This site is a row of hand-painted boards strung over a counter in the Old City of Hyderabad. The menu is a signboard wall of pista-green and black boards with gold-leaf brush lettering; prices hang on paper swing-tags; an order is a stamped bill chit pinned to the counter. The customer browses the boards and drops a chit; the owner watches the same counter from the back office.

The world is physical, painted, and a little worn — paper that shows its grain, boards with a painted edge catching light, chits whose status is a rubber stamp. Nothing reads as software. Density is counter-like: a full menu wall, a shelf of categories, a stack of chits. Texture and hand-painted irregularity are the personality; the red chill button is the only "digital action" and it is the one loud thing on screen.

**Key Characteristics:**
- Painted, not printed: every surface could have been done with a brush and a stencil.
- Gold is rare — lettering on boards, the brand plate, and the money moment only.
- Chilli red is singular — the add-to-cart circle, the primary CTA, the pending stamp, the new-order alert.
- Paper is never flat — a fine noise field under everything so the page reads as aged stock.
- Corners are hand-cut — every radius is four unequal values, never a clean arc.

## Colors

The palette is paint stock from the bazaar: brick dust, pista green, gold leaf, aged paper. One color per job; never decorative.

### Primary
- **Pista Green** (`#4a7c47`): the menu board face, the selected category tab. Reads as "the menu" wherever it appears. Deepens to **Deep Pista** (`#325a31`) as the painted lower edge of each board.

### Secondary
- **Gold Leaf** (`#d9a441`): board lettering (item names, brand name), the brand plate border, the stamp on the paid/earnings moment. Lit to **Lit Gold** (`#f0c766`) on hover and on the nameplate.
- **Chilli Red** (`#b23a2e`): the single action color — add button, primary CTA, pending stamp, section-title dash, new-order alert ledger. Pressed to **Deep Chilli** (`#8e2c22`).

### Tertiary
- **Cardamom** (`#3e7c4f`): paid/success only — the paid stamp and the earnings trend.

### Neutral
- **Aged Paper** (`#f4ead2`): page ground.
- **Fresh Paper** (`#faf3e1`): raised panels, chits, tabs, inputs.
- **Old Paper** (`#e9dbb8`): board backs and older panels.
- **Brown Ink** (`#2b2114`): text on paper, board borders, chit dashes.
- **Soft Ink** (`#6b5a44`): secondary text.
- **Faint Ink** (`#9c8a70`): placeholders and quiet labels.
- **Board Black** (`#15130e`): the header nameplate, the khali ribbon, toast, stamps.
- **Hairline** (`rgba(43, 33, 20, 0.18)`): 1px rules on paper.
- **Caution Amber** (`#c98a1f`): low-stock and pincode warnings, the cooking stamp.

### Named Rules
**The Rarity Rule.** Gold and chilli red each carry one job. Gold is for board lettering, the brand, and the money moment; chilli red is for the single action and the pending state. If a screen adds a third role for either color, it is wrong.

**The Flat-Paper Rule.** The paper ground always carries the grain texture. A flat, empty-colored region is unfinished paper.

## Typography

**Display Font:** Rozha One (with `Times New Roman`, `serif` fallback)
**Body Font:** Mukta (with `system-ui` fallback)
**Label/Mono Font:** Mukta, bold, letterspaced, uppercase (labels, chips, stamps)

**Character:** A weathered painted-serif (Rozha One) for everything on a board — names, buttons, tabs, tokens, KPI values — paired with a clean humanist sans (Mukta) for reading text. The display font carries the brush-painted voice; the body font stays legible under it. There is no mono font; ticket numbers use Rozha One in red.

### Hierarchy
- **Display** (400, `clamp(20px, 5.4vw, 30px)`, 1.15): the brand name on the nameplate and board item names. Uppercase, letter-spaced `0.02em`, with a dark drop shadow.
- **Headline** (400, 20px, 1.15): section titles — uppercase, letter-spaced `0.05em`, led by a 34×8px red dash.
- **Title** (700, 16–20px, 1.2): order tokens, ledger values (`26px`), board names.
- **Body** (400, 16px, 1.5): all reading text; secondary at `13px`.
- **Label** (700, 12px, `0.14em`, uppercase): field labels, board category lines, ledger labels, stamp lettering (`0.18em`).

### Named Rules
**The Paint-Only-Case Rule.** Anything on a board or stamp is uppercase. Reading sentences stay sentence case.

## Layout

One centered column, max width `1080px`, gutters `16px` (`--space-4`). The customer page stacks: nameplate → hero/About → category shelf → board wall → footer. The board wall is a responsive grid: two columns at `≥720px`, full-bleed rows below. The admin dashboard uses a two-column grid of ledger KPIs at `≥900px`, stacking to one column on phones, with a single chit stack below. Spacing rhythm is a fixed 4px scale (`--space-1`…`--space-7`); vertical rhythm on cards runs 4/8/12/16px. The category shelf scrolls horizontally on phones (scrollbar hidden). Chit action rows wrap.

## Elevation & Depth

Layered, not shadowed: depth comes from the paper/board stack — darker older paper behind, fresher paper raised above it, boards painted with a lit top edge and a darkened bottom edge. Shadows are paint-like and directional, never diffuse ambient glow:

- **Board shadow** (`0 3px 4px rgba(21,19,14,0.35), 0 14px 30px -10px rgba(21,19,14,0.45)`): boards and the nameplate — a board hanging off the wall.
- **Lift** (`0 2px 2px rgba(43,33,20,0.14), 0 10px 24px -8px rgba(43,33,20,0.28)`): raised panels and toasts.
- **Chit** (`0 1px 1px rgba(43,33,20,0.16), 0 6px 16px -6px rgba(43,33,20,0.24)`): chits and ledger cards pinned near the surface.
- Inset paint: boards carry `inset 0 1px 0 rgba(255,255,255,0.22)` (lit edge) and `inset 0 -2px 0 rgba(0,0,0,0.25)` (shade) — the two-paint-stroke edge of a hand-painted board.

### Named Rules
**The Painted Edge Rule.** Inset light-and-shade edges appear only where a hand-painted board would catch light — never as a generic bevel on paper surfaces.

**The Push-Down Rule.** Buttons show `0 3px 0 rgba(0,0,0,0.28)` as a hard under-stroke; pressing moves the button down `2px` and removes it. Interaction is physical: press, don't hover.

## Shapes

Corners are hand-cut, never clean: every radius is four unequal values — boards `10px 18px 12px 16px`, cards `8px 14px 9px 13px`, chits `6px 10px 6px 12px`, buttons `6px 14px 7px 12px`. The add button is a lumpy circle (`50% 60% 55% 65%`). Chits are outlined with a `2px` dashed ink border (solid red when a new order drops). Stamps are rotated `-3deg` dashed outline boxes. The brand plate carries a thin gold outline `6px` outside its border. Khali (out-of-stock) boards show a rotated ribbon tab. Focus rings are gold (`3px solid`, offset `2px`).

## Components

### Buttons
- **Shape:** hand-cut corners (`6px 14px 7px 12px`), no flat rectangles anywhere.
- **Primary (chilli red):** brick background, white text, uppercase Rozha One, `10px 18px`, hard `0 3px 0` under-stroke, brightness `1.08` on hover.
- **Gold:** gold background, board-black text — reserved for the money moment (place order, mark paid).
- **Ghost:** transparent, `2px` ink border, no under-stroke.
- **Press:** translates down `2px`, under-stroke collapses. Disabled at `0.5` opacity.

### Shelf Tabs (category chips)
- **Style:** fresh-paper background, ink text, `2px` board-black border with a hard `0 2px 0` under-stroke.
- **Selected:** pista-green background, lit-gold text, dark-green border.

### Boards (menu items)
- **Shape:** hand-cut corners, pista-green gradient (`160deg`), inset painted edge.
- **Name:** gold-light Rozha One, `17px`, dark text-shadow.
- **Swing-tag:** fresh-paper tag, bold ink `₹` price, red dot `•` marker — the tag hangs off the board.
- **Khali state:** board turns stone grey, desaturated, item name struck through, a rotated black/gold **KHALI** ribbon.
- **Add:** a 34px chilli-red lumpy circle, top-right, `+` glyph; hidden when khali.

### Chits (order tickets)
- **Corner Style:** `6px 10px 6px 12px`, dashed ink border, fresh-paper background.
- **Head:** red Rozha One token + quiet timestamp, hairline underline.
- **Rows:** itemized `name — ₹amount` lines, then a net total over a hairline rule, then the customer's name and pincode.
- **Stamps:** `PENDING` (red), `COOKING` (amber), `DISPATCHED` (dark gold), `PAID` (cardamom), `REJECTED` (faint) — rotated `-3deg` dashed outlines. State is a stamp, never a color alone.
- **New order:** solid red border, drops in with a `380ms` settle animation.

### Inputs / Fields
- **Style:** fresh-paper background, `2px` hairline border, hand-cut corners, inset paper shadow.
- **Focus:** pista-green border with a `3px` soft green halo — never blue.
- **Error:** brick border + red message; help text in faint ink.

## Do's and Don'ts

### Do:
- **Do** paint text on boards with gold or lit-gold Rozha One and a dark text-shadow.
- **Do** render every state of an order as a rotated dashed stamp.
- **Do** use the four-value irregular radii on every card, button, and board.
- **Do** give every button a hard `0 3px 0` under-stroke and a `2px` press-down.
- **Do** keep the page ground's noise texture at all times.
- **Do** reserve chilli red for exactly one action per view and the pending/new state.

### Don't:
- **Don't** use flat `border-radius` values anywhere; hand-cut corners only.
- **Don't** add extra accent colors; gold, chilli red, pista green, and cardamom are the whole palette.
- **Don't** render a board or button with CSS bevels; the painted edge is the only inset treatment.
- **Don't** show order status as a colored badge or bar; it is a stamp.
- **Don't** use a system display face for the brand or item names; Rozha One is the voice.
- **Don't** flatten paper with a solid color where the world expects paper stock.
- **Don't** add soft diffuse shadows; paint shadows are directional and hard-edged.
