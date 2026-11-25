# DESIGN.md: Matt's Club (Club monkey) re-theme

A **re-theme** of the working app (version 14, Phases 1–7 of the After Hours spec are done).
Every feature, function, stored value and behaviour stays. Only the look changes, plus five pieces that get a new form: the **monkey hero** (new), the ticket, the record, the pennant and the taped note.

- **Mockups (canvas):** https://claude.ai/artifact/BRR1RXLQEYWsinVTmF5bCM, **the last row, "18 · Club monkey v2 (final)"**: the home screen (press Play, tap the monkey, tap the navy button, try the All / Expenses / Income tabs) and the add sheet (try Expense / Income). Ignore every other row.
- The previous spec (After Hours) is in git history (commit `d3ad99a`). Older canvas rows and the old design-system artifact are **not** this design. This file is the only source.
- If this file and the mockup disagree, this file wins (it has the accessibility fixes and the real-data rules).

---

## 1. The idea

**Matt's Club**: a members' club with a varsity streak, hosted by Matt's monkey (spiky hair, shades, yellow tee). Pale off-white paper, deep navy and one bright yellow. Money is set in a classic serif, like a ledger. Personality comes from a few craft details: a chenille monkey patch that talks, a felt pennant, a cigar band, a poker chip, a spinning record, a taped handwritten note, and a disco ball when a month goes well.

**Rules of thumb**
- **Three base colours.** Paper/white, navy, yellow. The only other colours are the four deep record colours (brass, burgundy, teal, slate), which also colour the row dots, and the danger red. Matt rejected busier versions twice: don't add colour anywhere else.
- Calm base, loud details: the monkey is the one big moment; the numbers stay the easiest thing to read.
- Light theme only (the app was dark-only). No dark mode.
- Yellow is never text on paper (1.4:1). It's for stars, dots, the cigar band trim, tape, and text **on navy** only.

### What stays exactly as it is
All data and logic: `expenses` storage and its shape, `type` (expense/income), adjustments, opening balance, budget, `filters` (month, category, type), `recapSeen`, CSV export/import with preview, backup reminder, offline status, the service worker, the count-up, `fitTotal()` / `fitAmount()`, swipe-to-delete with undo, drag-to-close sheets, `MOTTOS` rotation, the monthly recap logic (`showRecap`, good-month rule, `throwFlecks`), `percentsSummingTo100`, focus handling, aria labels and live regions. Keep every `id` in `index.html` so `app.js` keeps finding its elements; class names may change where this spec says so.

---

## 2. Tokens

Replace the whole `:root` block in `style.css` with this, then update every `var(--old)` using the mapping table below. Delete tokens that end up unused (walnut, cone, amber, glow, lightbox tokens).

```css
:root {
  color-scheme: light;

  /* Paper and ink */
  --paper: #f8f6f1;          /* page background, sheets */
  --ticket: #ffffff;         /* ticket, amount ticket, note, money inputs */
  --tan-surface: #ece8e0;    /* close buttons, unselected felt tabs, bar track */
  --line: #e7e3db;           /* row dividers (decorative) */
  --line-strong: #cfc6b4;    /* dashed tear line, sheet handle (decorative) */
  --control-line: #8a8170;   /* chip + input borders, 3.6:1 on paper */
  --ink: #0c1f45;            /* = navy. All text, 15:1 on paper, 16.2:1 on white */
  --muted: #5e6170;          /* secondary text, 5.7:1 on paper, 6.1:1 on white */
  --scrim: rgba(12, 31, 69, 0.55);

  /* Club colours */
  --navy: #0c1f45;           /* buttons, felt, bubble, pennant, cigar band, record, rules */
  --navy-hi: #1a3566;        /* patch highlight */
  --navy-deep: #050e22;      /* shadows on navy pieces */
  --yellow: #fac92f;         /* stars, band trim, income dot, tape. Text only on navy (10.4:1) */
  --cream: #f3e9d2;          /* text and stitching on navy (13.4:1) */
  --danger: #9e2a2b;         /* delete text, errors, swipe-delete background (6.9:1 on paper) */

  /* Record */
  --groove-a: #08152f;
  --groove-b: #11264f;

  /* Record slices by rank (not by category). Palette "Brass & wine".
     Rows use the same colours (see 5.5), so a row's dot matches its slice. */
  --rank-1: #b8861b;         /* brass */
  --rank-2: #7a2233;         /* burgundy */
  --rank-3: #1f5e63;         /* deep teal */
  --rank-4: #3f5e99;         /* slate navy ("Rest" when there is one) */

  /* Note */
  --tape: rgba(250, 201, 47, 0.55);

  /* Type */
  --font-serif: Newsreader, Georgia, "Times New Roman", serif;
  --font-sans: "Hanken Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-varsity: Graduate, "Arial Black", sans-serif;
  --font-hand: "Caveat Brush", cursive;

  /* Space (unchanged) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;

  /* Radius */
  --radius-sm: 6px;     /* tickets */
  --radius-md: 8px;     /* chips, felt tabs, inputs with a box */
  --radius-sheet: 24px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-ticket: 0 0 0 4px var(--ticket), 0 0 0 5px var(--navy), 0 16px 26px rgba(12, 31, 69, 0.16);
  --shadow-patch: 0 10px 18px rgba(12, 31, 69, 0.3);
  --shadow-record: 0 10px 18px rgba(12, 31, 69, 0.3);
  --shadow-button: 0 10px 20px rgba(12, 31, 69, 0.25);
  --stitch: inset 0 0 0 4px var(--navy), inset 0 0 0 5.5px rgba(243, 233, 210, 0.55);

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1); /* unchanged */
  --tap: 44px;                                 /* unchanged */
}
```

**Old → new token mapping**

| Old | New |
|---|---|
| `--ground` | `--paper` |
| `--surface` | `--ticket` (cards) / `--paper` (sheets) / `--navy` (toast) |
| `--surface-raised` | `--tan-surface` |
| `--line`, `--line-soft` | `--line-strong`, `--line` |
| `--control-line` | `--control-line` (new value) |
| `--ink`, `--ink-muted`, `--ink-faint` | `--ink`, `--muted`, `--muted` |
| `--lightbox`, `--lightbox-ink`, `--lightbox-muted`, `--lightbox-track` | `--ticket`, `--ink`, `--muted`, `--tan-surface` |
| `--gold` (selected chips, income text, primary buttons) | `--navy` |
| `--gold` (decoration) | `--yellow` |
| `--signal`, `--live-ink` | removed (pennant) |
| `--amber`, `--amber-track`, `--glow-*`, `--walnut*`, `--cone*` | removed (record) |
| `--danger` | `--danger` (new value) |
| category colour tokens | removed: expense dots use the record's slot colours (see 5.5) |
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
| Balance | serif | 62px / 500, letter-spacing −2px, line-height 1, tabular nums | ticket. `fitTotal()` keeps its classes: `.lightbox-total.is-medium #total` 50px, `.is-small` 40px (same for `.recap-total`) |
| Amount input | serif | 58px / 500, −2px; prefix 38px / 500 | sheet. `fitAmount()` keeps `.is-medium` (44px) / `.is-small` (34px); prefix 32px at both |
| Money in rows | serif | 20px / 600 | row amounts |
| Month sums | serif | 22px / 600 | Earned / Spent this month |
| App name | serif italic | 24px / 600, −0.4px | header |
| Sheet titles | serif italic | 27px / 600, −0.4px | "New expense" |
| Section titles | serif italic | 20px / 600 | "Now spinning" |
| Day headers | serif | 20px / 500 | "Today" |
| Monkey bubble | sans | 15px / 600, line-height 1.3 | speech bubble |
| Body / row titles | sans | 16px / 600 | rows; chips 15px / 600 |
| Labels / meta | sans | 12–14px / 600–700 | "Balance", "Category", row second line |
| Varsity labels | Graduate | 8–14px | pennant, cigar band, bubble tag, felt tabs, poker chip |
| Motto | Caveat Brush | 22px, line-height 1.1 | taped note |

All money uses `font-variant-numeric: tabular-nums`. Inputs stay ≥ 16px. Sentence case everywhere; capitals only in Graduate labels (they're signage).

---

## 4. Global and PWA

- `index.html`: `<title>Matt's Club</title>`, `<meta name="color-scheme" content="light">`, `<meta name="theme-color" content="#f8f6f1">`, `apple-mobile-web-app-title` = "Matt's Club". Status bar style: default (dark text).
- `manifest.webmanifest`: `"name": "Matt's Club"`, `"short_name": "Matt's Club"`, `"background_color": "#f8f6f1"`, `"theme_color": "#f8f6f1"`. Icons unchanged.
- Body: `background: var(--paper); color: var(--ink); font-family: var(--font-sans);`.
- `:focus-visible { outline: 3px solid var(--navy); outline-offset: 2px; }`. On navy surfaces (buttons, felt, bubble) use `--yellow` via `.on-dark:focus-visible`.
- Keep all safe-area padding, `100dvh`, tap-highlight and hover rules from today.
- **Version bump every phase:** `?v=` on `style.css` and `app.js` in `index.html` and `VERSION` in `sw.js`, all three together (14 → 15 for the first phase).

---

## 5. Home screen

Order on the page: header → **monkey hero (new)** → ticket (`.lightbox`) → record (`.speaker-panel`) → entries (tabs, filter line, list) → motto note → footer → Add button.

### 5.1 Header (`.app-header`)

- **Title:** `<h1 class="app-title">Matt's Club</h1>` (serif italic 24/600). **Remove the 44px monkey `<img>` from the h1**: the monkey moves to the hero. Under it `<p class="tagline">Members only, est. 2026</p>` (sans 12/600 `--muted`, margin-top 4px).
- **Pennant** replaces the Live badge look (`#live-badge`; keep the invisible `#filter-month` select stretched over it, keep `renderLiveBadge()`):
  - 86×44 hit area. Inside: a navy triangle 84×36 (`clip-path: polygon(0 0, 100% 50%, 0 100%)`, top 4px), a 6px **white** strip on its left edge (the sleeve) with `box-shadow: inset 0 0 0 1px var(--line)`, and the label in Graduate 13px `--cream`, `rotate(-2deg)`, left 11px, top 14px.
  - Label text: `renderLiveBadge()` sets **"NOV ’26"** (uppercase short month + ’ + 2-digit year) for every month. Remove "Live:".
  - Past month (`.is-past`): the triangle becomes `--muted`, so it's clear you're not on the current month.
  - Remove `.live-dot`.

### 5.2 Monkey hero (new: `<section class="monkey-hero">` right after the header, inside `<main>`)

A flex row, gap 14px, `align-items: center`, margin-top 16px.

**The patch** (`<button type="button" class="monkey-patch" id="monkey-patch" aria-label="Monkey. Tap for another line">`), 132×132, no border, transparent:
- Disc: a span at `inset: 8px`, round, `background: radial-gradient(circle at 35% 30%, var(--navy-hi), var(--navy) 70%)`, `box-shadow: 0 0 0 4px var(--cream), 0 0 0 7px var(--navy), var(--shadow-patch)`, `rotate(-6deg)`.
- Stitching: a span at `inset: 15px`, round, `border: 2px dashed rgba(243,233,210,.7)`.
- Monkey: `images/monkey-icon.png` (already in the repo, transparent), 92×92, at left 20px / top 18px, `alt=""`. It's 160px wide, so it's soft on 3× screens; if Matt can supply a 300px+ transparent version, swap it in under the same name.
- Three yellow stars (the star path from 5.8), `aria-hidden`: 22px at left −2px / top 4px `rotate(-14deg)`; 16px at right −4px / top 18px `rotate(12deg)`; 20px at right 6px / bottom 0 `rotate(-8deg)`.

**The speech bubble** (`<div class="monkey-bubble" id="monkey-bubble" aria-live="polite">`), `flex: 1`:
- Navy background, `--cream` text sans 15/600, line-height 1.3, padding 12px 14px, `border-radius: 18px 18px 18px 4px`. A 14×14 navy tail on the bottom-left (`left: -7px; bottom: 0; clip-path: polygon(100% 0, 100% 100%, 0 100%)`).
- First line: the **tag** (`<span class="monkey-tag">`) Graduate 11px `--yellow` with an 11px yellow star before it, margin-bottom 4px. Then the **line** (`<span id="monkey-line">`).

**What the monkey says** (new `renderMonkey()`, called at the end of `renderLightbox()` so it updates after every save, delete, undo and month change). Build the list of moods that apply right now, in this order of priority, and show the first one:

| Tag | When | Line |
|---|---|---|
| `PAYDAY` | current month, an income dated today | `+₱16,200 just landed. Let’s gooo.` (today's income total) |
| `BIG ONE` | current month, an expense dated today ≥ ₱500 | `₱650 on nights out?! Okay… respect.` (the biggest one today; category name in lower case) |
| `OVER BUDGET` | budget set and spent > budget | `Whoa. ₱420 over. Easy now, boss.` |
| `UNDER BUDGET` | budget set and spent ≤ budget | `₱7,151 left this month. We chillin’.` |
| `THE BOOKS` | no budget, something logged this month | `₱13,351 kept this month. Smooth.` (earned − spent; if negative: `₱1,200 more out than in. Easy now.`) |
| `FRESH MONTH` | nothing logged in the shown month | `Nothing on the books yet. Log something.` |
| `LOOKING BACK` | a past month is shown (replaces all of the above) | `Back in October. You kept ₱2,300.` (or `… went ₱400 over.`) |

- Amounts use `formatWholePeso()`. Keep each line under ~45 characters so the bubble stays at 2–3 lines on a 360px phone.
- **Tap the monkey:** go to the next mood in the list of moods that apply (wraps). If only one applies, the patch does a small wiggle instead: `rotate(-6deg) → -12deg → 0deg → -6deg`, 400ms `--ease-out`. Reduce Motion: no wiggle; the line still changes.
- When the line changes, it cross-fades (opacity 150ms). Reduce Motion: instant.
- The bubble is `aria-live="polite"`, so screen readers hear the new line after a save. The stars and disc pieces are `aria-hidden`.

### 5.3 The ticket (`.lightbox`, keep every id inside)

```
╔═══════════════════════════════════════╗  2px --navy border, radius 6, --shadow-ticket (double frame)
║▓▓▓▓ ( ★ MATT’S CLUB · RESERVA ★ ) ▓▓▓▓║  cigar band, full width, 30px
║ Balance                    (poker     ║  sans 13/700 --muted
║ ₱20,651                      chip)    ║  serif 62/500
║ - - - - - - - - - - - - - - - - - - - ║  2px dashed --line-strong, 14px above / 12px below
║ Earned this month   Spent this month  ║  sans 12/600 --muted
║ +₱16,200            −₱2,849           ║  serif 22/600 --ink
║ ▬▬▬▬▬░░░░░░░░░░░░   ₱7,151 left of ₱10,000 ║
╚═══════════════════════════════════════╝
```

- Surface `--ticket` (white), padding `0 22px 16px`, `border: 2px solid var(--navy)`, `border-radius: 6px`, `box-shadow: var(--shadow-ticket)`, margin-top 24px.
- **Cigar band** (new first child, `aria-hidden`): 30px, `margin: 0 -22px`, `background: linear-gradient(var(--yellow) 0 2px, var(--navy) 2px 28px, var(--yellow) 28px)`. Centred pill: white, padding 2px 14px, radius 12px, `1.5px solid var(--yellow)`, Graduate 11px `--navy`, letter-spacing .5px: "★ MATT’S CLUB · RESERVA ★".
- "Balance" label 12px below the band. Past month: "Balance at end of October" (as today).
- **Budget row** (`#budget-box`): flex row, gap 10px. Track 6px, radius 3px, `--tan-surface`; fill `--navy`. Right side, no wrap: **"₱7,151 left"** (sans 13/700 `--ink`) + " of ₱10,000" (500 `--muted`). Over: "₱420 over" + " of ₱10,000". No budget: hidden (as today). Update `budgetOf` text from `Budget ₱…` to `of ₱…`.

**Poker chip** (new `<span class="poker-chip" id="poker-chip" aria-hidden="true" hidden>`), shown only when **a budget is set and the shown month's spending ≤ budget**. Set it in `renderLightbox()`.
- 66×66 circle, absolute, `right: 12px; top: 46px`, `rotate(12deg)`, shadow `0 6px 12px rgba(12,31,69,.3)`.
- Edge: `repeating-conic-gradient(var(--navy) 0 22.5deg, var(--cream) 22.5deg 45deg)`. Inner 50px navy disc; inside it a 42px circle with `1.5px dashed rgba(243,233,210,.7)` and "UNDER / BUDGET" in Graduate 8px `--cream`, two lines, centred.
- It must not cover the balance: if `#total` (after `fitTotal()`) is wider than the ticket's inner width minus 90px, hide the chip.
- First appearance in a session: scale .6 → 1 with a slight overshoot, 300ms (none with Reduce Motion).

### 5.4 The record (`.speaker-panel` → "Now spinning")

Replaces the cones. Keep `renderSpeakerPanel()`'s data work (slots, top 3 + Rest, `percentsSummingTo100`, `<1%`, the category filter, aria-pressed); change what it draws.

Layout: flex row, gap 16px, margin-top 22px, `align-items: center`.

**Record** (left, `aria-hidden`), 140×140, round:
- `background: radial-gradient(circle, transparent 30%, rgba(255,255,255,.06) 31%, transparent 32%), repeating-radial-gradient(circle, var(--groove-a) 0 1.5px, var(--groove-b) 1.5px 3px)`, `box-shadow: var(--shadow-record)`.
- Shine: `::after` overlay `linear-gradient(135deg, rgba(255,255,255,.14), transparent 40%, transparent 60%, rgba(255,255,255,.08))`.
- **Label** (centre), **74×74**: a pie of the slots in `--rank-1…4`, with **0.8% `--paper` gaps** between slices (and after the last). Ring: `box-shadow: 0 0 0 2px var(--paper), 0 0 0 3.5px var(--yellow)`. An 8px `--paper` spindle hole in the middle. Build the conic-gradient in JS from the percents, e.g. for 44/32/11/13: `conic-gradient(var(--rank-1) 0 43.4%, var(--paper) 43.4% 44.2%, var(--rank-2) 44.2% 75.4%, var(--paper) 75.4% 76.2%, var(--rank-3) 76.2% 86.4%, var(--paper) 86.4% 87.2%, var(--rank-4) 87.2% 99.2%, var(--paper) 99.2%)`. Skip gaps for a single slot.
- Category picked (filter on): the other slices drop to 35% opacity (use `color-mix(in srgb, var(--rank-n) 35%, var(--paper))`).
- Reduce Motion off: on first render the record turns once (360°, 1.2s, ease-out). Never loops.
- No spending this month: an empty navy record with a plain `--paper` label, and the legend shows the existing empty text.

**Legend** (right): "Now spinning" (serif italic 20/600, 8px below), then one row per slot (gap 6px):
- 10px dot in the slot's rank colour with `box-shadow: inset 0 0 0 1px rgba(12,31,69,.4)`, the name (sans 14/600), the percent right-aligned (serif 16/600).
- Category rows are **buttons** (min-height 44px). "Rest" is not a button (`role="img"`, as today).
- Picked row: 2px navy underline under the name; `aria-pressed="true"`.
- Legend dots and row dots come from the same map (5.5), so Bills is brass in both places.

### 5.5 Entries

**Tabs** (`#list-filter` / `.segmented-list`): plain text tabs, gap 18px, on a 1.5px `--navy` bottom rule. Labels sans 15/700, **min-height 44px, min-width 44px**, `--muted`; checked: `--ink` with a 3px `--navy` bottom border overlapping the rule (`margin-bottom: -1.5px`). Focus ring on the label when its radio has focus.

**Filter line** (`#filter-summary`): sans 14 `--muted`; "Clear" as a navy underlined text button (44px hit area).

**Day header**: label serif 20/500 `--ink`; totals sans 14/700 on the right: `.day-in` "+₱1,200 earned" in `--ink`, `.day-out` "−₱230 spent" in `--muted`. In `renderList()` change the strings from `… in` / `… out` to `… earned` / `… spent`.

**Rows** (`makeExpenseRow`):
- 54px min height, `border-top: 1px solid var(--line)`.
- Dot 9px with `box-shadow: inset 0 0 0 1px rgba(12,31,69,.4)`.
  - **Expense: the colour of the record slot its category is in, for the shown month.** If Bills is the top slot, every Bills row gets `--rank-1`; a category inside "Rest" gets `--rank-4`. So the dots always match the record and its legend.
  - Implementation: have `renderSpeakerPanel()` return (or store) a `Map` of category → rank colour, and make `categoryColor(category)` look it up, falling back to `--rank-4`. `renderList()` runs after the panel, so the map is ready.
  - Income = `--yellow`; adjustment = `--tan-surface`.
  - A category picked as a filter keeps its colour (the list only shows that category anyway).
- Title sans 16/600 (ellipsis), meta sans 13 `--muted`.
- Amount serif 20/600: expense and income `--ink` (income keeps its "+"), adjustment `--muted`.
- Swipe-delete background `--danger`, text `--cream`.

**Empty states**: serif italic 18 `--muted`, centred, same texts as today.

### 5.6 Motto as a taped note (`#motto`)

- 210px wide, centred, margin-top 14px, padding 14px 14px 10px, background `--ticket`, shadow `0 4px 10px rgba(0,0,0,.12)`, `rotate(-2.5deg)`, Caveat Brush 22px `--ink`, centred.
- Tape: `::before`, 64×18px, `--tape`, centred on the top edge (`top: -9px`), `rotate(3deg)`.
- Keep tap-to-cycle and the fade. Hit area ≥ 44px.

### 5.7 Footer
"Backup & settings" (`.settings-link`): sans 15/600 `--muted`, underlined, 44px tall. Backup reminder and offline status: sans 13 `--muted` (overdue reminder in `--danger`).

### 5.8 Add button (`#add-btn`)
- Fixed as today (20px sides, 34px + safe area from the bottom), 58px, `--radius-pill`, background `--navy`, text `--cream`, serif italic 21/600.
- `box-shadow: var(--stitch), var(--shadow-button)`.
- An 18px yellow star before the label via `::before` (a `mask` of the star path `m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z` filled `--yellow`), so `app.js` can keep setting `textContent`. Same rule for every primary pill (`.glow-button`).
- Label **"Add to the books"**.
- The fade behind it (`.add-fade`): `linear-gradient(rgba(248,246,241,0), var(--paper) 50%)`, 130px.

---

## 6. Sheets (add/edit, settings, opening)

Shared (`.sheet`, `.sheet-panel`; keep drag-to-close and slide):
- Panel `--paper`, top corners `--radius-sheet`, `box-shadow: 0 -10px 30px rgba(0,0,0,.25)`. Backdrop `--scrim`.
- **Breton stripe** along the top edge: 14px, `repeating-linear-gradient(180deg, var(--navy) 0 3px, var(--paper) 3px 7px)`, clipped to the top corners. Handle 12px below (40×5, `--line-strong`).
- Title serif italic 27/600. Close: 44px circle `--tan-surface`, icon `--ink`.
- Field labels: sans 14/700 `--muted`.

### 6.1 Add / edit sheet
- **Peeking monkey** (add and edit sheet only, `aria-hidden`, `pointer-events: none`): an 84px patch (same build as 5.2, scaled: rings 3px cream / 5px navy, stitch at `inset: 5px` 1.5px, monkey 62px, one 16px star top-right) sitting on the sheet's top edge at `right: 72px; top: -64px`. To its left, a navy bubble (sans 13/600 `--cream`, padding 8px 12px, `border-radius: 14px 14px 4px 14px`, tail bottom-right, `white-space: nowrap`): **"How much we talking?"** for an expense, **"Money in? Love that."** for income, **"Fixing the books."** when editing. Set it in `updateSheetTexts()`. On phones under 340px wide, hide the bubble.
- **Type tabs** (`.segmented-type`): two felt tabs, gap 8px, 44px tall, radius 8px, Graduate 14px:
  - Unselected: `--tan-surface`, `--muted` text.
  - Checked (both types): `--navy`, `--cream` text, `box-shadow: inset 0 0 0 3px var(--navy), inset 0 0 0 4.5px rgba(243,233,210,.6), 0 6px 12px rgba(12,31,69,.2)`.
  - Labels stay "Expense" / "Income" in the HTML; CSS `text-transform: uppercase`.
- **Amount** (`#amount-field`): a small ticket. `--ticket`, 2px `--navy` border, radius 6px, double frame (`0 0 0 4px #fff, 0 0 0 5px var(--navy), 0 12px 20px rgba(12,31,69,.14)`), padding `0 18px 12px`, margin-top 16px. On top a 26px navy cigar band (yellow 2px trim top and bottom) with the white pill "★ HOW MUCH ★" (Graduate 10px `--navy`). Amount serif 58/500 `--ink`, prefix "₱" / "+₱" serif 38/500 `white-space: nowrap`. Error: border → `--danger` + the existing message in `--danger`.
- **Category chips**: 40px tall (44px hit area via padding/margin), padding 0 14px, radius 8px, sans 15/600.
  - Unselected: transparent, `1.5px solid var(--control-line)`, `--ink`.
  - Checked: navy felt, `--cream` text, `border: 1.5px dashed rgba(243,233,210,.7)`, `box-shadow: 0 0 0 2px var(--navy)`.
- **When chips**: same chip style.
- **Note**: no box, a 1.5px `--navy` underline, 44px tall, serif italic 19px. Counter as today.
- **Save** (`#submit-btn`): the navy pill from 5.8 with the star. In `updateSheetTexts()`: "Add to the books" (new expense), "Add income to the books" (new income), "Save changes" (edit). Toasts stay "Expense saved" / "Income saved".
- **Delete**: `--danger` text button; confirm row as today, "Yes, delete" = `--danger` fill, `--cream` text.

### 6.2 Settings and opening sheets
- Same panel, no peeking monkey. Money inputs (`.money-input`): `--ticket`, 1.5px `--control-line`, radius 8px, 48px, prefix "₱" `--muted`.
- `.btn`: transparent, 1.5px `--control-line`, radius 8px, 44px, sans 15/600 `--ink`. `.btn-gold` → navy felt (`--navy`, `--cream`, stitch). `.btn-danger` → `--danger` text. `.btn-danger-solid` → `--danger` fill, `--cream` text.
- Opening sheet's amount field uses the 6.1 ticket with the band reading "★ YOU HAVE ★".

### 6.3 Toast (`#toast`)
- `--navy` background, `--cream` text, sans 14/600, pill, 44px, shadow `0 10px 20px rgba(12,31,69,.25)`. Undo: `--yellow` text button (10.4:1).
- The vinyl keeps its spin. Recolour to match the home record: grooves `--groove-a`/`--groove-b`, label `--rank-2` with a 2px `--paper` ring and a `--paper` spindle dot.

---

## 7. Monthly recap (disco ball stays)

Same logic (`showRecap`, `throwFlecks`, the good-month rule, Reduce Motion). New look: **the club after dark**.
- Dialog background `--navy` (full screen) with a soft spotlight: `radial-gradient(ellipse 70% 45% at 50% 0%, rgba(250,201,47,.12), transparent 70%)`.
- Title serif italic 30/600 `--cream`; subtitle sans 16 `rgba(243,233,210,.85)`.
- The monkey patch (5.2 build, 96px) sits above the title, centred. Good month: two extra yellow stars. Not a good month: no stars.
- The "Kept" box becomes a white **ticket** like 5.3 (band reading "★ MONTH CLOSED ★"), with "Kept" / the amount (serif 58/500), the budget row ("Spent ₱2,700" / "of ₱10,000") and the sums line ("Earned ₱10,000 · Spent ₱2,700", sans 13 `--muted`). Under budget: the poker chip on it.
- Motto: the taped note (5.6) under the ticket, not interactive.
- Button: a `--cream` pill with `--navy` serif italic text ("Start December") and a yellow star.
- **Disco ball:** keep the element, size, drop and tile spin. Ball gradient `radial-gradient(circle at 34% 30%, #ffffff 0 5%, #dfe6f5 14%, #8b9bc0 38%, #1a3566 72%, #050e22 100%)` (silver-blue, reads on navy), tile lines unchanged, glints `#ffffff`, `--yellow`, `--cream`, ball glow `0 0 40px rgba(250,201,47,.35)`. Cord `--cream` at 50%.
- **Flecks:** `['#fac92f', '#f3e9d2', '#ffffff', '#b8861b']` (update the array in `throwFlecks`).

---

## 8. Accessibility and contrast

| Pair | Ratio |
|---|---|
| `--ink` (navy) on `--paper` / white | 15.0 / 16.2:1 |
| `--muted` on `--paper` / white | 5.7 / 6.1:1 |
| `--cream` on `--navy` | 13.4:1 |
| `--yellow` on `--navy` (bubble tag, Undo, focus ring) | 10.4:1 |
| `--danger` on `--paper` | 6.9:1 |
| `--cream` on `--danger` | 6.2:1 |
| `--control-line` on `--paper` (borders) | 3.6:1 |
| Record and row dots on paper: burgundy / teal / slate / brass | 9.2 / 6.8 / 5.9 / 3.0:1, all with a 1px navy outline |

- Yellow, brass and `--tan-surface` are never text on paper. The record colours are only dots and slices, never text.
- Record slices are told apart by the paper gaps and the legend text, and rows by their category line ("Bills"), not colour alone.
- Every tap target ≥ 44×44 (tabs, legend rows, pennant, monkey, chips, motto, close, Clear).
- Decorative pieces (patch rings, stars, cigar bands, poker chip, record, tape, Breton stripe, disco, the sheet's peeking monkey) are `aria-hidden`; their meaning is in text. The home bubble is the exception: it's real text with `aria-live="polite"`.
- Reduce Motion: no monkey wiggle, no bubble fade, no chip pop, no record spin, no toast spin, recap as today.

---

## 9. Phases (one commit each; bump the version every time)

1. **Tokens and global re-skin:** §2, §3, §4, plus the colour swaps everywhere (rows, tabs, sheets, buttons, toast) using the mapping table. No new components yet. The app should work exactly as before in the new colours and fonts, with the light status bar.
2. **Home components:** §5.1 title + pennant, §5.2 monkey hero with `renderMonkey()`, §5.3 ticket + cigar band + poker chip, §5.4 the record (replaces the cones), §5.5 tabs and rows, §5.6 taped note, §5.8 Add button. Remove the now-unused speaker/cone CSS.
3. **Sheets and toast:** §6 (peeking monkey + bubble, felt tabs, ticket amount with band, felt chips, underline note, Breton stripe, settings/opening styles, toast and vinyl colours).
4. **Recap and QA:** §7 recap restyle with the monkey and disco ball. Then run `break-ui` (huge balance with the poker chip, 1 category, 8 categories, long notes, long monkey lines on a 320px screen, negative balance, past month, empty month) and `review-animations`, and test on the phone: install, status bar colour, keyboard over the sheet, swipe-to-delete, drag-to-close, the monkey line updating after a save.

Suggested skills: `emil-design-eng` (all phases), `mobile-native` (phases 1 and 4), `animate` (monkey wiggle, poker chip pop, record turn), `break-ui` and `review-animations` (phase 4).
