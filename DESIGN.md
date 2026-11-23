# DESIGN.md: Matt's Club re-theme

A **re-theme** of the working app (version 14, Phases 1–7 of the After Hours spec are done).
Every feature, function, stored value and behaviour stays. Only the look changes, plus four components that get a new form (the ticket, the record, the pennant and the taped note).

- **Mockups (canvas):** https://claude.ai/artifact/BRR1RXLQEYWsinVTmF5bCM, **row 10, "Clubhouse × your board"**: the home screen (press Play, tap the green button, try the All / Expenses / Income tabs) and the add sheet (try the Expense / Income tabs). Ignore every other row.
- The previous spec (After Hours) is in git history (commit `d3ad99a`). The old design-system artifact is After Hours too, so **don't use it**. This file is the only source.
- If this file and the mockup disagree, this file wins (it has the accessibility fixes).

---

## 1. The idea

**Matt's Club**: a members' club with a varsity-jacket streak, for a guy who likes records, cigars, card nights and New York heritage clothes. Cream paper, forest green, burgundy and a little gold. Money is set in a classic serif, like a ledger. Swag comes from craft details: a chenille patch, a felt pennant, a cigar band, a poker chip, a spinning record, a taped handwritten note, and a disco ball when a month goes well.

**Rules of thumb**
- Calm base, loud details: the details are small and few, and the numbers stay the easiest thing to read.
- Light theme only (the app was dark-only). No dark mode.
- Gold is never text on cream. It's for stars, dots, the cigar band trim and the income dot.

### What stays exactly as it is
All data and logic: `expenses` storage and its shape, `type` (expense/income), adjustments, opening balance, budget, `filters` (month, category, type), `recapSeen`, CSV export/import with preview, backup reminder, offline status, the service worker, the count-up, `fitTotal()` / `fitAmount()`, swipe-to-delete with undo, drag-to-close sheets, `MOTTOS` rotation, the monthly recap logic (`showRecap`, good-month rule, `throwFlecks`), `percentsSummingTo100`, focus handling, aria labels and live regions. Keep every `id` in `index.html` so `app.js` keeps finding its elements; class names may change where this spec says so.

---

## 2. Tokens

Replace the whole `:root` block in `style.css` with this, then update every `var(--old)` using the mapping table below. Delete tokens that end up unused (walnut, cone, amber, glow, lightbox tokens).

```css
:root {
  color-scheme: light;

  /* Paper and ink */
  --paper: #f1ece1;          /* page background */
  --ticket: #fbf6ea;         /* ticket / card surface */
  --sheet: #f1ece1;          /* bottom sheets */
  --tan-surface: #e4dccb;    /* close buttons, unselected tabs, bar tracks */
  --line: #ddd5c4;           /* row dividers (decorative) */
  --line-strong: #cfc6b4;    /* dashed tear line, handle (decorative) */
  --control-line: #8a8170;   /* chip + input borders, 3.3:1 on paper */
  --ink: #1b2233;            /* text, 13.5:1 on paper */
  --muted: #5e6170;          /* secondary text, 5.2:1 on paper, 5.7:1 on ticket */
  --scrim: rgba(27, 34, 51, 0.55); /* behind sheets */

  /* Club colours */
  --green: #1f3b2d;          /* primary: buttons, income amounts, budget fill. 10.4:1 on paper */
  --green-hi: #2c5240;       /* patch highlight */
  --burgundy: #6e1f2a;       /* expense tab/chips, pennant, cigar band, poker chip, active tab line */
  --navy: #1c2a44;           /* Breton stripe */
  --gold: #d9b35e;           /* stars, cigar band trim, income dot, record slice. Never text on paper */
  --tan: #b8ad96;            /* "Rest" slice */
  --cream: #f3e9d2;          /* text on green / burgundy / ink (10:1+) */
  --danger: #9e2a2b;         /* delete text, errors, swipe-delete background (6.3:1 on paper) */

  /* Record */
  --vinyl: #161616;
  --groove: #1e1e1e;

  /* Note */
  --note: #fffdf6;
  --tape: rgba(217, 179, 94, 0.55);

  /* Category dots (expense rows). Each 3:1+ on paper; dots also get a 1px outline */
  --cat-food: #b85e14;
  --cat-transport: #2f5e9e;
  --cat-bills: #1f3b2d;
  --cat-shopping: #6e1f2a;
  --cat-health: #3f7d4e;
  --cat-nights-out: #7a4fa0;
  --cat-school: #9c7020;
  --cat-other: #8a8170;

  /* Record slices by rank (not by category) */
  --rank-1: var(--green);
  --rank-2: var(--burgundy);
  --rank-3: var(--gold);
  --rank-4: var(--tan);

  /* Type */
  --font-serif: Newsreader, Georgia, "Times New Roman", serif;
  --font-sans: "Hanken Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-varsity: Graduate, "Arial Black", sans-serif;
  --font-hand: "Caveat Brush", cursive;

  /* Space (unchanged) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;

  /* Radius */
  --radius-sm: 6px;     /* ticket, sheet chips are 8px */
  --radius-md: 8px;     /* chips, felt tabs, inputs with a box */
  --radius-sheet: 24px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-ticket: 0 0 0 4px var(--ticket), 0 0 0 5px var(--green), 0 16px 26px rgba(31, 59, 45, 0.16);
  --shadow-patch: 0 6px 12px rgba(31, 59, 45, 0.3);
  --shadow-record: 0 10px 18px rgba(0, 0, 0, 0.28);
  --shadow-button: 0 10px 20px rgba(31, 59, 45, 0.25);
  --stitch: inset 0 0 0 4px var(--green), inset 0 0 0 5.5px rgba(243, 233, 210, 0.55);

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1); /* unchanged */
  --tap: 44px;                                 /* unchanged */
}
```

**Old → new token mapping**

| Old | New |
|---|---|
| `--ground` | `--paper` |
| `--surface` | `--ticket` (cards) / `--sheet` (sheets) / `--ink` (toast) |
| `--surface-raised` | `--tan-surface` |
| `--line`, `--line-soft` | `--line-strong`, `--line` |
| `--control-line` | `--control-line` (new value) |
| `--ink`, `--ink-muted`, `--ink-faint` | `--ink`, `--muted`, `--muted` |
| `--lightbox`, `--lightbox-ink`, `--lightbox-muted`, `--lightbox-track` | `--ticket`, `--ink`, `--muted`, `--tan-surface` |
| `--gold` (selected chips, income text) | `--green` (selected/primary) or `--burgundy` (expense); `--gold` only for decoration |
| `--signal`, `--live-ink` | removed (pennant) |
| `--amber`, `--amber-track`, `--glow-*`, `--walnut*`, `--cone*` | removed (record) |
| `--danger` | `--danger` (new value) |
| `--font-sans` (Outfit) | `--font-sans` (Hanken Grotesk) + `--font-serif` for money and headings |

---

## 3. Type

Replace the Google Fonts link in `index.html` (only the weights used):

```html
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,600&family=Hanken+Grotesk:wght@500;600;700&family=Graduate&family=Caveat+Brush&display=swap" rel="stylesheet">
```

Offline, the fallbacks in the font stacks are used (the service worker already ignores cross-origin requests; keep it that way).

| Role | Font | Size / weight | Where |
|---|---|---|---|
| Balance | serif | 62px / 500, letter-spacing −2px, line-height 1, tabular nums | ticket. `fitTotal()` keeps working through the existing classes: set `.lightbox-total.is-medium #total` to 50px and `.is-small` to 40px (same for `.recap-total`) |
| Amount input | serif | 58px / 500, −2px; prefix 38px / 500 | sheet. `fitAmount()` keeps its `.is-medium` (44px) / `.is-small` (34px) classes; prefix 32px at both |
| Money in rows | serif | 20px / 600 | row amounts |
| Month sums | serif | 22px / 600 | Earned / Spent this month |
| App name | serif italic | 25px / 600, −0.4px | header |
| Sheet titles | serif italic | 27px / 600, −0.4px | "New expense" |
| Section titles | serif italic | 20px / 600 | "Now spinning" |
| Day headers | serif | 20px / 500 | "Today" |
| Body / row titles | sans | 16px / 600 | notes, chips (15px / 600) |
| Labels / meta | sans | 12–14px / 600–700 | "Balance", "Category", second row line |
| Varsity labels | Graduate | 10–14px | pennant, cigar band, felt tabs, poker chip |
| Motto | Caveat Brush | 22px, line-height 1.1 | taped note |

All money uses `font-variant-numeric: tabular-nums`. Inputs stay ≥ 16px. Sentence case everywhere; capitals only in Graduate labels (they're signage).

---

## 4. Global and PWA

- `index.html`: `<title>Matt's Club</title>`, `<meta name="color-scheme" content="light">`, `<meta name="theme-color" content="#f1ece1">`, `apple-mobile-web-app-title` = "Matt's Club".
- `manifest.webmanifest`: `"name": "Matt's Club"`, `"short_name": "Matt's Club"`, `"background_color": "#f1ece1"`, `"theme_color": "#f1ece1"`. Icons unchanged.
- Body: `background: var(--paper); color: var(--ink); font-family: var(--font-sans);`.
- `:focus-visible { outline: 3px solid var(--burgundy); outline-offset: 2px; }` (on green buttons use `--cream` via `.on-dark:focus-visible`).
- Keep all safe-area padding, `100dvh`, tap-highlight and hover rules from today.
- **Version bump every phase:** `?v=` on `style.css` and `app.js` in `index.html` and `VERSION` in `sw.js`, all three together (14 → 15 for the first phase).

---

## 5. Home screen

Order on the page (unchanged DOM order): header → ticket (`.lightbox`) → record (`.speaker-panel`) → entries (tabs, filter line, list) → motto note → footer → Add button.

### 5.1 Header (`.app-header`)

**Monkey patch** (`.app-icon` wrapped in a new `<span class="patch">`):
- 58×58 circle, `background: radial-gradient(circle at 35% 30%, var(--green-hi), var(--green) 70%)`.
- Rings: `box-shadow: 0 0 0 3px var(--cream), 0 0 0 5px var(--burgundy), var(--shadow-patch)`.
- Stitching: `::before` at `inset: 4px`, `border: 1.5px dashed rgba(243,233,210,.7)`, round.
- Monkey image 38×38 centred. The whole patch is `transform: rotate(-6deg)`.

**Title** (`.app-title` text): "Matt's Club" (serif italic 25/600), and under it a new `<span class="tagline">Members only, est. 2026</span>` (sans 12/600 `--muted`). The `<h1>` keeps the name only; the tagline sits outside it or is `aria-hidden`.

**Pennant** replaces the Live badge look (`#live-badge`, keep the invisible `#filter-month` select stretched over it, keep `renderLiveBadge()`):
- 86×44 hit area. Inside: a burgundy triangle 84×36 (`clip-path: polygon(0 0, 100% 50%, 0 100%)`), a 6px `--cream` strip on its left edge (the pennant's sleeve), and the label in Graduate 13px `--cream`, `rotate(-2deg)`, left 11px.
- Label text: `renderLiveBadge()` sets **"NOV ’26"** (uppercase short month + apostrophe + 2-digit year) for every month. Remove "Live:".
- Past month (`.is-past`): the triangle becomes `--muted` grey, so it's clear you're not on the current month.
- Remove `.live-dot`.

### 5.2 The ticket (`.lightbox`, keep every id inside)

```
╔═══════════════════════════════════════╗  2px --green border, radius 6, --shadow-ticket (double frame)
║▓▓▓▓▓▓ ( MATT’S CLUB · RESERVA ) ▓▓▓▓▓▓║  cigar band, full width, 30px
║ Balance                    (poker     ║  sans 13/700 --muted
║ ₱20,651                      chip)    ║  serif 62/500
║ - - - - - - - - - - - - - - - - - - - ║  2px dashed --line-strong, 14px above / 12px below
║ Earned this month   Spent this month  ║  sans 12/600 --muted
║ +₱16,200            −₱2,849           ║  serif 22/600; earned in --green
║ ▬▬▬▬▬░░░░░░░░░░░░   ₱7,151 left of ₱10,000 ║
╚═══════════════════════════════════════╝
```

- Surface `--ticket`, padding `0 22px 16px`, `border: 2px solid var(--green)`, `border-radius: 6px`, `box-shadow: var(--shadow-ticket)`, margin-top 24px.
- **Cigar band** (new element, first child, `aria-hidden`): 30px tall, `margin: 0 -22px`, `background: linear-gradient(var(--gold) 0 2px, var(--burgundy) 2px 28px, var(--gold) 28px)`. Centred label: Graduate 11px `--burgundy`, letter-spacing .5px, on a `--ticket` pill (padding 2px 14px, radius 12px, 1.5px `--gold` border): "MATT’S CLUB · RESERVA".
- "Balance" label row 12px below the band. Past month: "Balance at end of October" (as today).
- **Budget row** (`#budget-box`): a flex row. Track 6px, radius 3px, `--tan-surface`; fill `--green`. Right side, no wrap: **"₱7,151 left"** (sans 13/700 `--ink`) + " of ₱10,000" (500 `--muted`). Over budget: "₱420 over" + " of ₱10,000". No budget: hidden (as today).
- Earned value colour `--green`; spent value `--ink`.

**Poker chip** (new `<span class="poker-chip" id="poker-chip" aria-hidden="true" hidden>`), only shown when **a budget is set and the shown month's spending ≤ budget**. Set it in `renderLightbox()`.
- 66×66 circle, position absolute, `right: 12px; top: 46px`, `rotate(12deg)`, shadow `0 6px 12px rgba(60,20,20,.3)`.
- Edge: `repeating-conic-gradient(var(--burgundy) 0 22.5deg, var(--cream) 22.5deg 45deg)`.
- Inner 50px burgundy disc; inside it a 42px circle with `1.5px dashed rgba(243,233,210,.7)` and "UNDER / BUDGET" in Graduate 8px `--cream`, centred, two lines.
- It must not cover the balance: when `fitTotal()` keeps the 62px size and the number is wider than the ticket minus 90px, hide the chip (the screen reader text already says it).
- When it first appears in a session: scale .6 → 1 with a slight overshoot, 300ms (none with Reduce Motion).

### 5.3 The record (`.speaker-panel` → "Now spinning")

Replace the cones. Keep `renderSpeakerPanel()`'s data work (slots, top 3 + Rest, `percentsSummingTo100`, `<1%`, the category filter, aria-pressed); change what it draws.

Layout: a flex row, gap 16px, margin-top 22px.

**Record** (left, `aria-hidden`), 140×140:
- `background: repeating-radial-gradient(circle, #121212 0 1.5px, var(--groove) 1.5px 3px)` plus one faint ring at 31% (`radial-gradient(circle, transparent 30%, rgba(255,255,255,.06) 31%, transparent 32%)`), radius 50%, `--shadow-record`.
- Shine: a `::after` overlay `linear-gradient(135deg, rgba(255,255,255,.14), transparent 40%, transparent 60%, rgba(255,255,255,.08))`.
- **Label** (centre), 62×62: a pie of the slots by rank colours `--rank-1…4`, with **0.6% `--cream` gaps between slices**, and `box-shadow: 0 0 0 2px var(--cream)`. An 8px `--paper` spindle hole in the middle. Build the conic-gradient string in JS from the percents.
- When a category is picked (filter on): the other slices drop to 35% opacity (use a second conic-gradient with semi-transparent colours).
- With Reduce Motion off: when the panel first renders, the record turns once (360°, 1.2s, ease-out). Never loops.

**Legend** (right): title "Now spinning" (serif italic 20/600, 8px below), then one row per slot (gap 6px):
- 10px dot in the slot's rank colour with `box-shadow: inset 0 0 0 1px rgba(27,34,51,.4)`, the name (sans 14/600), and the percent on the right (serif 16/600).
- Category rows are the **buttons** (min-height 44px; the 14px text sits centred in it, so the list grows: that's fine). "Rest" is not a button (`role="img"`, as today).
- Picked row: name in `--burgundy` with a 2px burgundy underline; `aria-pressed="true"`.
- With 4 or fewer categories there's no Rest: slot 4 uses `--rank-4`.

### 5.4 Entries

**Tabs** (`#list-filter` / `.segmented-list`): plain text tabs, gap 18px, sitting on a 1.5px `--ink` bottom rule. Each label: sans 15/700, **min-height 44px, min-width 44px**, `--muted`; checked: `--ink` with a 3px `--burgundy` bottom border overlapping the rule. Focus ring on the label when its radio has focus.

**Filter line** (`#filter-summary`): sans 14 `--muted`; "Clear" as a `--burgundy` text button.

**Day header**: label serif 20/500 `--ink`; totals (`.day-totals`) sans 14/700 on the right: `.day-in` "+₱1,200 earned" in `--green`, `.day-out` "−₱230 spent" in `--muted`. In `renderList()` change the two strings from `… in` / `… out` to `… earned` / `… spent`.

**Rows** (`makeExpenseRow`):
- 54px min height, `border-top: 1px solid var(--line)` (none on the first of a day).
- Dot 9px with `box-shadow: inset 0 0 0 1px rgba(27,34,51,.4)`: expense = `categoryColor()`; income (`.is-income`) = `--gold`; adjustment = `--tan-surface`.
- Title sans 16/600 (ellipsis), meta sans 13 `--muted`.
- Amount serif 20/600: expense `--ink`, income `--green`, adjustment `--muted`.
- Swipe-delete background `--danger`, text `--cream`.

**Empty states**: serif italic 18 `--muted`, centred, same texts as today.

### 5.5 Motto as a taped note (`#motto`)

The motto button becomes a small note taped under the list:
- 210px wide, centred, padding 14px 14px 10px, background `--note`, shadow `0 4px 10px rgba(0,0,0,.12)`, `rotate(-2.5deg)`, text Caveat Brush 22px `--ink`, centred.
- Tape: `::before`, 64×18px, `--tape`, centred on the top edge (`top: -9px`), `rotate(3deg)`.
- Keep the tap-to-cycle and the fade. Hit area ≥ 44px (it is).

### 5.6 Footer
"Backup & settings" (`.settings-link`): sans 15/600 `--muted`, underlined, 44px tall. Backup reminder and offline status: sans 13 `--muted` (reminder overdue state in `--danger`).

### 5.7 Add button (`#add-btn`)
- Fixed as today (20px sides, 34px + safe area from the bottom), 58px, `--radius-pill`, background `--green`, text `--cream`, serif italic 21/600.
- `box-shadow: var(--stitch), var(--shadow-button)` (an inner cream stitch line).
- An 18px gold star before the label, drawn with `::before` (a `mask` of the star SVG path `m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z` filled with `--gold`), so `app.js` can keep setting the button's `textContent`. Use the same rule for every green pill (`.glow-button`).
- Label **"Add to the books"**.
- The fade behind it (`.add-fade`) goes from transparent to `--paper`.

---

## 6. Sheets (add/edit, settings, opening)

Shared (`.sheet`, `.sheet-panel`, keep drag-to-close and slide):
- Panel background `--sheet`, top corners `--radius-sheet`, `box-shadow: 0 -10px 30px rgba(0,0,0,.25)`. Backdrop `--scrim`.
- **Breton stripe** along the top edge: a 14px band, `repeating-linear-gradient(180deg, var(--navy) 0 3px, var(--paper) 3px 7px)`, clipped to the top corners. The handle sits 12px below it (40×5, `--line-strong`).
- Title serif italic 27/600. Close: 44px circle `--tan-surface`, icon `--ink`.
- Field labels ("Category", "When", …): sans 14/700 `--muted`.

### 6.1 Add / edit sheet
- **Type tabs** (`.segmented-type`): two felt tabs side by side, gap 8px, 44px tall, radius 8px, Graduate 14px:
  - Unselected: `--tan-surface` background, `--muted` text.
  - Checked: Expense = `--burgundy`, Income = `--green`; text `--cream`; `box-shadow: inset 0 0 0 3px <same colour>, inset 0 0 0 4.5px rgba(243,233,210,.6), 0 6px 12px rgba(31,59,45,.2)` (stitch).
  - Labels stay "Expense" / "Income" in the HTML; CSS `text-transform: uppercase` makes them read as varsity lettering (screen readers still hear normal words).
- **Amount** (`#amount-field`): a small ticket. `--ticket`, 2px `--green` border, radius 6px, double frame like the home ticket, padding `0 18px 12px`. On top, a 26px cigar band in **burgundy for an expense, green for income** with the pill label "HOW MUCH". Amount serif 58/500 `--ink` (income `--green`), prefix "₱" / "+₱" serif 38/500 with `white-space: nowrap`. Error: 1px → 2px `--danger` border + the existing message in `--danger`.
- **Category chips**: 40px tall (44px hit area), padding 0 14px, radius 8px, sans 15/600.
  - Unselected: transparent, `1.5px solid var(--control-line)`, `--ink`.
  - Checked: felt (burgundy for expense categories, green for income), `--cream` text, `border: 1.5px dashed rgba(243,233,210,.7)`, `box-shadow: 0 0 0 2px <felt colour>` (dashed stitch inside the felt edge).
- **When chips**: same chip style; checked is green felt.
- **Note**: no box, just a 1.5px `--ink` underline, 44px tall, serif italic 19px. Counter as today.
- **Save** (`#submit-btn`): the green pill from 5.7 with the star. In `updateSheetTexts()` change the labels to "Add to the books" (new expense) and "Add income to the books" (new income); "Save changes" (edit) stays. The toasts stay "Expense saved" / "Income saved".
- **Delete**: text button `--danger`; confirm row as today, "Yes, delete" = `--danger` fill with `--cream` text.

### 6.2 Settings and opening sheets
- Same panel. Money inputs (`.money-input`): `--ticket`, 1.5px `--control-line`, radius 8px, 48px, prefix "₱" `--muted`.
- `.btn`: transparent, 1.5px `--control-line`, radius 8px, 44px, sans 15/600 `--ink`. `.btn-gold` → green felt (`--green`, `--cream`, stitch). `.btn-danger` → `--danger` text. `.btn-danger-solid` → `--danger` fill, `--cream` text.
- Opening sheet's amount field uses the 6.1 ticket style with a green band reading "YOU HAVE".

### 6.3 Toast (`#toast`)
- `--ink` background, `--cream` text, sans 14/600, radius pill, 44px, shadow `0 10px 20px rgba(0,0,0,.25)`. Undo: `--gold` text button (gold on ink is 8:1).
- The vinyl record keeps its spin. Recolour it to match the home record: grooves `#0e0e0e`/`#1e1e1e`, label `--burgundy` with a 3px `--gold` ring and a `--cream` spindle dot.

---

## 7. Monthly recap (disco ball stays)

Same logic (`showRecap`, `throwFlecks`, the good-month rule, Reduce Motion handling). New look: **the club after dark**.
- Dialog background `--green` (full screen), with a soft spotlight: `radial-gradient(ellipse 70% 45% at 50% 0%, rgba(243,233,210,.14), transparent 70%)`.
- Title serif italic 30/600 `--cream`; subtitle sans 16 `rgba(243,233,210,.8)` (≥ 7:1 on green).
- The "Kept" box becomes a **ticket** like 5.2 (cigar band reading "MONTH CLOSED"), with "Kept" / the amount (serif 58/500), the budget row ("Spent ₱2,700" / "of ₱10,000") and the sums line ("Earned ₱10,000 · Spent ₱2,700", sans 13 `--muted`). When the month was under budget, show the poker chip on it.
- Motto: the taped note (5.5) under the ticket, not interactive.
- Button: a `--cream` pill with `--green` serif italic text ("Start December") and a gold star.
- **Disco ball:** keep the element, size, drop and tile spin, but recolour for the club: ball gradient `radial-gradient(circle at 34% 30%, #fff6df 0 5%, #e2c98f 14%, #8a7550 38%, #2c2418 72%, #120e08 100%)`, tile lines unchanged, glints `#fff6df`, `--gold`, `--cream`, ball glow `0 0 40px rgba(217,179,94,.4)`. Cord: `--cream` at 50% opacity.
- **Flecks:** colours `['#d9b35e', '#f3e9d2', '#e8c676', '#ffffff']` (update the array in `throwFlecks`).

---

## 8. Accessibility and contrast

| Pair | Ratio |
|---|---|
| `--ink` on `--paper` | 13.5:1 |
| `--muted` on `--paper` / `--ticket` | 5.2:1 / 5.7:1 |
| `--green` on `--paper` (income, earned) | 10.4:1 |
| `--cream` on `--green` / `--burgundy` / `--ink` | 10.1 / 9.2 / 13.2:1 |
| `--danger` on `--paper` | 6.3:1 |
| `--gold` on `--ink` (toast Undo) | 8.0:1 |
| `--control-line` on `--paper` (borders) | 3.3:1 |
| Category dots on `--paper` | 3.3–10.4:1, plus a 1px outline |

- Gold, tan and `--tan-surface` are never used for text on paper.
- Record slices are told apart by the cream gaps and the legend text, not by colour alone.
- Every tap target ≥ 44×44 (tabs, legend rows, pennant, chips, motto, close).
- Decorative pieces (patch rings, cigar bands, poker chip, record, tape, Breton stripe, disco) are `aria-hidden`; their meaning is already in text.
- Reduce Motion: no patch/chip pop, no record spin, no toast spin, recap as today.

---

## 9. Phases (one commit each; bump the version every time)

1. **Tokens and global re-skin:** §2, §3, §4, plus the colour swaps everywhere (rows, tabs, sheets, buttons, toast) using the mapping table. No new components yet. The app should work exactly as before, in the new colours and fonts, with the light status bar.
2. **Home components:** §5.1 patch + pennant, §5.2 ticket + cigar band + poker chip, §5.3 the record (replaces the cones), §5.4 tabs and rows, §5.5 taped note, §5.7 Add button. Remove the now-unused speaker/cone CSS.
3. **Sheets and toast:** §6 (felt tabs, ticket amount with band, felt chips, underline note, Breton stripe, settings/opening styles, toast and vinyl colours).
4. **Recap and QA:** §7 recap restyle with the club disco ball. Then run `break-ui` (huge balance with the poker chip, 1 category, 8 categories, long notes, negative balance, past month) and `review-animations`, and test on the phone: install, status bar colour, keyboard over the sheet, swipe-to-delete, drag-to-close.

Suggested skills: `emil-design-eng` (all phases), `mobile-native` (phases 1 and 4), `animate` (poker chip pop, record turn), `break-ui` and `review-animations` (phase 4), `learn-taste` (end: record decisions back into this file).
