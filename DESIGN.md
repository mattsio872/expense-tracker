# DESIGN.md: After Hours redesign

Handoff spec for Matt's Expense Tracker (`index.html`, `style.css`, `app.js`, `sw.js`, `manifest.webmanifest`).
Put this file in the repo root and ask Claude Code to implement it phase by phase.

- **Mockups (canvas):** https://claude.ai/artifact/BRR1RXLQEYWsinVTmF5bCM
  - Phases 1–5: row 3, "After hours: home" and "After hours: add expense"
  - Phase 6: row 5, "Balance: home" and "Balance: add expense or income"
  - Phase 7: row 4, "After hours v3 clean" (amber cones, mottos, vinyl toast) and "Month closed under budget (disco ball)"
  - Ignore the other rows (earlier explorations, v2's red glow, day mode).
- **Design system:** https://claude.ai/artifact/FBH7ejWgr9SrKCKa73yr9H (tokens, component rules, logo)

If this file and the mockups disagree, this file wins: it includes accessibility fixes made after the mockups.

---

## 1. Overview

**What it is:** a phone-first PWA Matt opens several times a day to (a) see how much he has spent this month and (b) log an expense in a few taps.

**What changes:**
1. **Look:** dark "listening bar after closing" style. A dark room, one glowing white lightbox (the monthly total), walnut speaker panel (categories), one gold accent, a hand-sprayed motto.
2. **Layout:** summary first, the list grouped by day, and adding moved into a bottom sheet opened by a big button in thumb reach. Today the form fills the whole first screen; it should be one tap away instead.
3. **Speed of adding:** category and date become tappable chips instead of dropdowns.

**What must keep working (do not break):** localStorage data (`expenses` key) and the existing data shape `{id, amount, category, date, note}`, edit, delete (no `confirm()`: it's blocked in some in-app browsers, which is why the app doesn't use it), month and category filtering, CSV export and import with preview/merge/replace, the note's 200-character limit, the local-timezone date handling, the screen-reader labels and `aria-live` summaries, and the service worker/offline.

**Theme:** night only. The app is always dark; remove the light theme.

---

## 2. Design tokens

Replace the `:root` block and the `@media (prefers-color-scheme: dark)` block in `style.css` with this single block. Keep using `var(--name)` everywhere.

```css
:root {
  color-scheme: dark;

  /* Room */
  --ground: #1b1411;          /* page background */
  --surface: #241a16;         /* sheets, Live badge */
  --surface-raised: #2f231e;  /* round icon buttons */
  --line: #3a2c25;            /* day-header rule (decorative) */
  --line-soft: #2a201c;       /* row dividers */
  --control-line: #7a6658;    /* chip + input borders, 3.1:1 on surface */

  /* Text */
  --ink: #efe6d8;             /* 14.7:1 on ground */
  --ink-muted: #bfb2a3;       /* 8.8:1 */
  --ink-faint: #8c7f74;       /* motto + placeholders only, 4.7:1 */

  /* The lit sign */
  --lightbox: #f6f1e7;
  --lightbox-ink: #1b1411;
  --lightbox-muted: #5b4a40;  /* 7.5:1 on lightbox */
  --lightbox-track: #e3dacb;

  /* Accent + wood */
  --gold: #d9b35e;            /* the ONLY accent; dark text on it */
  --cone-track: #2a1f1a;
  --walnut-light: #7a5236;
  --walnut: #5e3d27;
  --walnut-ink: #f6e8d6;
  --cone: #141110;
  --cone-cap: #3a3330;
  --signal: #ff6a4d;          /* Live dot only */
  --live-ink: #ffe9c2;
  --danger: #f2877d;          /* delete text, errors (8:1 on ground) */

  /* Category dots: names must match app.js ("--cat-" + slug) */
  --cat-food: #e0904a;
  --cat-transport: #8fb3d9;
  --cat-bills: #b79ae8;
  --cat-shopping: #e98ba8;
  --cat-health: #7fc8a0;
  --cat-nights-out: #e8d27a;
  --cat-school: #6fc6cf;
  --cat-other: #a79c92;

  /* Type */
  --font-sans: Outfit, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-hand: "Caveat Brush", cursive;

  /* Space */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;

  /* Radius */
  --radius-sm: 4px;   /* Live badge */
  --radius-md: 14px;  /* inputs */
  --radius-lg: 18px;  /* walnut panel, amount field */
  --radius-xl: 22px;  /* lightbox */
  --radius-sheet: 28px;
  --radius-pill: 999px;

  /* Light */
  --glow-lightbox: 0 0 0 1px #fff8ea, 0 0 46px rgba(255,236,200,.28), 0 18px 40px rgba(0,0,0,.45);
  --glow-button: 0 0 30px rgba(255,236,200,.3);
  --glow-field: 0 0 36px rgba(255,236,200,.22);
  --walnut-edge: inset 0 1px 0 rgba(255,220,180,.18);

  --tap: 44px;
}
```

### Type scale (all Outfit unless noted)

| Name | Size / line | Weight | Extra | Used for |
|---|---|---|---|---|
| total | 72 / 72 | 800 | letter-spacing -2.5px, tabular nums | Monthly total on the lightbox |
| amount-input | 56 / 64 | 800 | -2px | Amount field in the sheet |
| title | 22 / 28 | 700 | | Sheet titles |
| heading | 18 / 24 | 700 | | Day headers, app name (19px) |
| row-amount | 17 / 24 | 700 | tabular nums | Row amounts |
| row-title | 16 / 22 | 600 | one line, ellipsis | Expense note |
| body | 16 / 24 | 400 | never below 16px in inputs | Inputs, text |
| label | 15 / 20 | 600 | | Field labels, chips |
| meta | 13 / 18 | 400 | | Category under a row, badges |
| motto | 22 / 28 | 400 | **Caveat Brush**, rotate(-2deg), `--ink-faint` | The motto line only |

Fonts: add to `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Caveat+Brush&display=swap" rel="stylesheet">
```

Offline: the system-font fallback in `--font-sans` must look fine. `sw.js` already ignores cross-origin requests, so Google Fonts simply load from the network when online. Leave that as is, and don't add the font URLs to `APP_FILES`.

---

## 3. Layout: home screen (one column, 390px reference width)

```
┌──────────────────────────────────────┐  padding: 52px (top, + safe-area) 20px 0
│ (monkey) Matt's Expenses  [• Live: Nov]│  header, 44px tall
│                                      │  24px
│ ┌──────────── LIGHTBOX ─────────────┐ │
│ │ Spent this month                  │ │
│ │ ₱2,849                            │ │
│ │ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░       │ │  budget bar (only if a budget is set)
│ │ of ₱10,000            ₱7,151 left │ │
│ └───────────────────────────────────┘ │
│                                      │  22px
│ ┌──────── WALNUT SPEAKER PANEL ─────┐ │
│ │  (44%)  (32%)  (11%)  (13%)       │ │  top 3 categories + Rest
│ │  Bills Shopping Nights out Rest   │ │
│ └───────────────────────────────────┘ │
│                                      │  22px
│ Today                          ₱230  │  day header + rule
│ • Jollibee lunch with classmates ₱185│  rows, 62px
│   Food                               │
│ • Jeep + tricycle               ₱45  │
│ Wednesday                    ₱1,250  │
│ • Globe postpaid             ₱1,250  │
│   …                                  │
│   focus on improving, not proving    │  motto, centred
│   Backup & settings                  │  text link (opens settings sheet)
│                                      │  padding-bottom: 120px so the last row clears the button
│ [ (+)  Add expense ]                 │  fixed, bottom: 34px + safe-area
└──────────────────────────────────────┘
```

- Content max-width 480px, centred. On tablets/desktop it stays a centred phone column; the old 2-column grid layout is removed.
- Order in the DOM = visual order (header, lightbox, panel, list, motto, settings link, then the fixed Add button).

### What happens to each existing section

| Today | After |
|---|---|
| Header "Matt's Expense Tracker" + all-time total | Header: logo + "Matt's Expenses" + LiveBadge. The total moves into the Lightbox and becomes **the selected month's** total. |
| "Add expense" form card | Moves into the **Add expense sheet** (§5). Opened by the fixed GlowButton. |
| Expenses card with Month + Category dropdowns | Month: chosen with the **LiveBadge**. Category: tap a speaker cone to filter the list by it (tap again, or the "Showing Bills · Clear" line, to clear). Remove both dropdowns from the page. |
| Filter summary "Showing 2 of 3" | Only shown when a category filter is on: "Showing Bills · Clear" above the list, `aria-live="polite"`. |
| Spending chart (by month + by category) | Replaced by the **SpeakerPanel** for the selected month. Month-over-month moves into the lightbox when no budget is set ("₱149 more than October"). |
| Backup card | Moves into the **Settings sheet** (§7), opened by the "Backup & settings" link. All CSV behaviour stays the same. |

---

## 4. Components

### LiveBadge (month switcher), top-right

- Visual: `--surface` background, 1px `--line` border, `--radius-sm`, padding 6px 10px; 6px `--signal` dot with `box-shadow: 0 0 8px var(--signal)`; text "Live: Nov", 13px/700, `--live-ink`, `text-shadow: 0 0 8px rgba(255,214,150,.8)`.
- Past month selected: the dot becomes `--ink-faint` with no glow, the text `--ink-muted` with no shadow, and the label "Oct 2026".
- **Implementation (simplest, fully accessible):** keep the existing `#filter-month` `<select>`, but place it inside the badge, `position:absolute; inset:0; opacity:0; font-size:16px` so tapping the badge opens the phone's native picker. The visible label is updated from the select's value. Options = months that have expenses, newest first (existing `monthsWithExpenses()`). Remove the "All months" option: the home screen always shows one month. Default = the current month (even when it has no expenses yet), and add the current month to the options even when it has no expenses. A saved filter of `month: 'all'` (from the old `filters` localStorage key) falls back to the current month. The **Export** month picker in Settings keeps its "All months" option.
- Hit area ≥ 44×44px (pad with a transparent `::before` if needed). `aria-label="Month: November 2026"`.

### Lightbox (monthly total)

- `--lightbox` background, `--radius-xl`, `--glow-lightbox`, padding 22px 22px 20px.
- "Spent this month" (label, `--lightbox-muted`). For a past month: "Spent in October".
- Total: `total` style, `--lightbox-ink`, **whole pesos** (use `Intl.NumberFormat('en-PH', {style:'currency', currency:'PHP', maximumFractionDigits:0})` here only; rows keep centavos when non-zero).
- **With a budget** (§7): 6px bar, `--lightbox-track` with a `--lightbox-ink` fill at `min(spent/budget, 1)`; under it "of ₱10,000" (left, muted) and "₱7,151 left" (right). Over budget: full bar, right label "₱420 over".
- **Without a budget:** no bar; one line under the total in `--lightbox-muted`: "₱149 more than October" / "₱300 less than October" / "Same as October" / nothing if the previous month has no expenses.
- When the selected month changes, the total counts up from 0 to the new value (§9).

### SpeakerPanel (categories)

- Panel: `background: linear-gradient(135deg, var(--walnut-light), var(--walnut) 55%, #6e4a31)`, `--radius-lg`, `--walnut-edge`, padding 16px 14px 14px.
- Grid: `repeat(4, minmax(0,1fr))`, gap 6px. Each cone is a **button** (it filters the list).
- Cone: a 64px circle, `background: conic-gradient(var(--gold) 0 P%, var(--cone-track) P% 100%)`; inside it a 52px circle, `radial-gradient(circle at 50% 45%, var(--cone-cap) 0 18%, var(--cone) 19% 60%, #1f1a18 61%)`, with "44%" 13px/700 `--lightbox`. Label under it: 12px/600 `--walnut-ink`, one line, ellipsis.
- Data: the top 3 categories of the selected month by amount, plus "Rest" (the sum of the others). Fewer than 4 categories: show only those, no Rest. Percents rounded so they sum to 100 (largest-remainder). "Rest" is not tappable.
- Selected (filtering): the cone gets a 2px `--gold` outline with 3px offset, `aria-pressed="true"`.
- `aria-label` on each cone button: "Bills, 44 percent. Show only Bills".
- No expenses this month: hide the panel.

### ExpenseRow + day header

- Group the visible expenses (newest first, existing sort) by date.
- Header: day label in `heading`, the day's total in 15px/600 `--ink-muted` on the right, padding-bottom 6px, 1px `--line` bottom border; 22px space above each header except the first.
  - Labels: "Today", "Yesterday", the weekday name for the last 6 days ("Wednesday"), otherwise "Nov 12". Use the existing local-date helpers, never `new Date("YYYY-MM-DD")`.
- Row (`<li>`, containing one `<button>` that fills it): 62px min height, flex, gap 12px, `--line-soft` top border between rows.
  - 10px dot `background: var(--cat-<slug>)` (slug = lowercase, spaces → `-`, e.g. `nights-out`).
  - Title = note (`row-title`, ellipsis); second line = category (`meta`, `--ink-muted`). **No note:** title = category, no second line.
  - Amount (`row-amount`) on the right.
- Tap the row: opens the sheet in **edit** mode (§5). The Edit/Delete buttons are removed from rows. Delete lives in the edit sheet.
- Row button `aria-label`: "Food, ₱185, Jollibee lunch with classmates, today. Edit".

### GlowButton (Add expense / Save expense)

- Height 58px, `--radius-pill`, `--lightbox` bg, `--lightbox-ink` text 18px/700, `--glow-button`.
- Add expense: fixed, `left/right: 20px`, `bottom: calc(34px + env(safe-area-inset-bottom))`, 20px plus icon. Behind it, a fixed 120px gradient from transparent to `--ground` (`pointer-events:none`).
- Pressed: `transform: scale(.97)`, 100ms. Disabled: `opacity:.4; box-shadow:none`.

### Chip

- Built as **radio buttons** so the form keeps working with no extra state: `<input type="radio" name="category" class="visually-hidden">` + `<label class="chip">`.
- 40px tall (44px hit area via 2px vertical margin), padding 0 14px, `--radius-pill`, label style.
- Unselected: 1px `--control-line` border, `--ink` text. Checked: `--gold` bg and border, `--lightbox-ink` text. Focus-visible (on the input): 3px `--gold` outline, offset 2px, on the label.
- Wrap, gap 8px.

### Motto

- "focus on improving, not proving": Caveat Brush 22px, `--ink-faint`, centred, `rotate(-2deg)`, margin-top 14px, `aria-hidden="true"` (decorative).

### Logo

- `images/monkey-icon.png` at 44×44, `border-radius:50%`, background `#2b201b`, `box-shadow: 0 0 0 1.5px var(--gold)`, `alt=""`. Next to it: "Matt's Expenses" 19px/700 in the `<h1>`.

---

## 5. Add / edit expense sheet

Use a native `<dialog id="expense-sheet">` opened with `showModal()`. It traps focus, closes on Esc, and the existing `<form id="expense-form">` moves inside it unchanged in purpose.

```
┌──────────────────────────────────────┐  dialog: fixed, bottom 0, width 100% (max 480), top ≥ 110px
│              ───                     │  drag handle 40×5, #4a3a32
│ New expense                     (×)  │  title + close (44px round, --surface-raised)
│ ┌─────────── amount (lit) ─────────┐ │  --lightbox, --radius-lg, --glow-field
│ │ Amount                           │ │
│ │ ₱ 185                            │ │  input: type=text inputmode=decimal, amount-input style
│ └──────────────────────────────────┘ │
│ Category                             │  20px above
│ (Food)(Transport)(Bills)(Shopping)   │  chips, Food preselected for a new expense
│ (Health)(Nights out)(School)(Other)  │
│ When                                 │
│ (Today)(Yesterday)(📅 Pick a date)   │  Today preselected
│ Note (optional)                      │
│ [ Jollibee lunch with classmates   ] │  50px, --radius-md, --control-line border, bg --ground
│                         180 / 200    │  counter: only shown from 180 chars on, --danger at 190+
│ [        Save expense         ]      │  GlowButton, pinned to sheet bottom + safe area
│        Delete expense                │  edit mode only: text button, --danger, 44px
└──────────────────────────────────────┘
```

- Sheet: `--surface` bg, top corners `--radius-sheet`, `box-shadow: 0 -1px 0 var(--line)`, padding 10px 20px. `::backdrop { background: rgba(12,9,8,.7); }`. The content scrolls inside the sheet if the keyboard pushes it.
- **Amount:** autofocus on open (new mode) so the decimal keyboard comes up. Keep the existing validation (min 0.01, 2 decimals). Invalid → 1px `--danger` border on the amount field + message under it in `--danger` 13px: "Enter an amount, like 185 or 49.50". `aria-invalid` + `aria-describedby`.
- **Date chips:** Today / Yesterday set the hidden `date` value. "Pick a date" reveals the existing native `<input type="date">` (16px) under the chips and selects that chip. Editing an expense whose date isn't today or yesterday: "Pick a date" is selected and the input shows its date.
- **New mode:** title "New expense", button "Save expense", after saving: close the sheet, show toast "Expense saved".
- **Edit mode:** title "Edit expense", fields prefilled, button "Save changes", plus "Delete expense". Delete → the button turns into an inline confirm (keep the current no-`confirm()` pattern): "Delete this expense?" [Yes, delete] (solid `--danger`, dark text) [Cancel]. After deleting: close the sheet, toast "Expense deleted · Undo" for 5s; Undo restores it.
- Close (×), Esc, backdrop tap, or dragging the handle down: close without saving. If the amount or note was changed, closing via backdrop/drag asks nothing (data is small), but keep it simple and predictable: **never lose a save silently**. Only the Save button saves.

### Toast

- Fixed above the Add button (bottom: 34px + 58px + 12px + safe area), centred, `--surface` bg, 1px `--line` border, `--radius-pill`, 14px/600 `--ink`, padding 10px 16px. `role="status"`. Disappears after 3s (5s when it has Undo). Undo is a gold text button.

---

## 6. Categories: rename Entertainment → Nights out

- Category list: Food, Transport, Bills, Shopping, Health, **Nights out**, School, Other.
- **Migration on load:** in `loadExpenses()`, map `category === 'Entertainment'` → `'Nights out'`, then save once.
- **CSV import:** in the parser (where it does `categories.find(...)`, ~line 632 of app.js), map "entertainment" to "Nights out" *before* matching. Otherwise old backups file those rows under Other.
- **CSV export:** writes "Nights out".
- **Single source of categories:** `categoryOrder()` and `fillCategoryFilter()` currently read the options of the `<select id="category">`. When the select becomes radio chips, read the radios instead (or one `CATEGORIES` array in app.js that builds the chips), so the list still lives in one place.
- **Colors:** `categoryColor()` builds `--cat-` + `category.toLowerCase()`, which gives `--cat-nights out` (invalid). Change it to `category.toLowerCase().replace(/\s+/g, '-')` → `--cat-nights-out`.

---

## 7. Settings sheet (new), with Budget and Backup

Opened by the "Backup & settings" text link under the motto (15px/600, `--ink-muted`, underlined, 44px tall). Same `<dialog>` sheet style as §5.

- **Monthly budget:** a field "Monthly budget (optional)" with ₱ prefix, `inputmode="decimal"`, saved to localStorage key `budget` (number, or removed when empty). Hint under it, 13px muted: "Shows how much you have left each month." Saving updates the lightbox immediately.
- **Backup:** move the existing Backup card's content here unchanged (month to export, Export CSV, Import CSV, the import preview with Add new / Replace all / Cancel, the status line). Restyle only: buttons become secondary pills (1px `--control-line`, `--ink`, 44px), "Replace all" keeps `--danger` text, "Add new expenses" uses gold (`--gold` bg, `--lightbox-ink`).

---

## 8. States and edge cases

| Situation | What to show |
|---|---|
| First launch, no expenses at all | Lightbox "₱0", no bar line unless a budget is set; panel hidden; in place of the list, centred 16px `--ink-muted`: "Nothing logged yet. Tap Add expense to start." Motto stays. |
| Selected month has no expenses (e.g. a new month) | Same empty line, but: "No expenses in November yet." |
| Category filter matches nothing | Can't happen (a cone only exists for a category with spending). |
| Very long note | One line with ellipsis in the row; full note in the edit sheet. Max 200 chars (existing). |
| Huge amounts (₱1,250,000) | The total must fit: if the text is wider than the lightbox, step the font down 72 → 56 → 44px (measure once after rendering). Rows: amount never wraps (`white-space:nowrap`), the title shrinks. |
| Over budget | Bar full, "₱420 over" on the right in `--lightbox-ink` (no red: the lightbox stays calm). |
| localStorage blocked | Keep the existing fallback (start empty, warn on save) but show it as a toast "Can't save on this browser" instead of `alert()`. |
| Fonts fail (offline first run) | System font fallback; layout must not depend on Outfit metrics. |
| 300+ expenses | Fine, the list is per month; no virtualisation needed. |

---

## 9. Motion

Respect `prefers-reduced-motion: reduce`: turn everything below off (instant changes, no count-up).

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Sheet | open | translateY(100%) → 0; backdrop opacity 0 → 1 | 280ms | cubic-bezier(.32,.72,0,1) |
| Sheet | close | → translateY(100%) | 200ms | ease-in |
| Total | month change / load | count up from 0 (requestAnimationFrame, whole pesos) | 500ms | ease-out |
| GlowButton | press | scale .97 | 100ms | ease-out |
| Toast | show / hide | translateY(8px)+opacity 0 → 0/1 | 180ms | ease-out |
| Cone ring | month change | none (instant). Don't animate data. | | |

Later polish (Phase 4) with the motion skills: drag-to-dismiss on the sheet handle and swipe-to-delete on rows (gestures skill).

---

## 10. Mobile and PWA details

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `<meta name="theme-color" content="#1b1411">`; `<meta name="color-scheme" content="dark">`
- `manifest.webmanifest`: `"background_color": "#1b1411"`, `"theme_color": "#1b1411"`.
- Safe areas: header padding-top `calc(52px + env(safe-area-inset-top))`-style logic (52px total on notch phones, at least 16px + inset elsewhere); bottom button and sheet use `env(safe-area-inset-bottom)`.
- `html { -webkit-tap-highlight-color: transparent; }`, `button, label.chip { touch-action: manipulation; user-select: none; }`.
- Use `100dvh` (not `100vh`) for anything full-height.
- Hover styles only inside `@media (hover: hover)`.
- **Cache busting (required, every phase that changes CSS/JS):** raise the number by one in all three places together: `?v=` on `style.css` and on `app.js` in `index.html`, and `VERSION` in `sw.js` (currently 4 → 5 for phase 1). See the comment in `index.html`.
- Test on a real phone: install to the home screen and check the status bar color, the notch, the keyboard over the sheet, and that the amount field doesn't zoom.

---

## 11. Accessibility

- Focus order: header (month badge) → lightbox (read-only) → cones (buttons) → rows (buttons) → settings link → Add expense.
- `:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }` everywhere.
- Sheet: `<dialog aria-labelledby="sheet-title">`; on close, focus returns to the button that opened it (Add expense or the row).
- Chips are radios, so the arrow keys move between them; the group has a `<fieldset>` + `<legend>` ("Category", "When").
- Keep `aria-live="polite"` on the filter line and the backup status; toasts are `role="status"`.
- Contrast: all text pairs listed in §2 pass 4.5:1; control borders 3:1. Don't put `--ink-faint` on anything informative.

---

## 12. Implementation order (one commit per phase)

1. **Tokens and reskin:** §2 tokens, fonts, dark-only, logo/header, Lightbox, row restyle, motto, §10 meta/PWA, cache bump. The app should look new but work exactly as before.
2. **Layout:** LiveBadge month switcher, SpeakerPanel with cone filtering, day grouping, remove the old chart and filter dropdowns, the fixed Add button.
3. **Sheet:** `<dialog>` add/edit sheet with amount field, radio chips, date chips, delete-in-sheet, toasts. Category rename + migration (§6).
4. **Settings and budget:** settings sheet, budget, move Backup into it.
5. **Polish:** motion (§9), then gestures (drag to close, swipe to delete) and a final review.
6. **Balance and income:** §13. Turns the expense tracker into a money tracker: income entries, a running balance, and the Expenses / Income filter.
7. **Extras:** §14. Amber speaker glow, rotating mottos, the vinyl "saved" toast, and the monthly recap with the disco ball.

Suggested skills in Claude Code: `mobile-native` (phase 1 and 5), `emil-design-eng` (all phases), `find-animation-opportunities` + `animate` (phase 5), `gestures` (phase 5), `break-ui` (after phase 3: long notes, huge amounts, empty months), `review-animations` (end), `learn-taste` (end: record decisions back into this file).

---

## 13. Phase 6: Balance and income

**Why:** Matt wants to see how much money he actually has, not only what he spent. Every expense takes money out, every income puts money in, and the app always shows the balance.

**Mockups:** canvas row 5, "Balance: home (tap Add)" and "Balance: add expense or income". Both are clickable.

**This phase changes some earlier parts:** the Lightbox content (§4), the Add button label (§4 GlowButton), the sheet header (§5) and the CSV columns (§7). Where this section and the earlier ones disagree, this section wins.

### 13.1 Data

- Every entry gets a `type`: `'expense'` or `'income'`. Shape: `{ id, type, amount, category, date, note }`. `amount` stays positive; `type` says which way it goes.
- **Migration on load:** an entry with no `type` is an expense. Save once after migrating (together with §6's Entertainment rename).
- **Income categories:** Allowance, Salary, Gift, Sold something, Other. Keep them in one `INCOME_CATEGORIES` array next to the expense list.
- **Opening balance:** localStorage key `openingBalance` = `{ amount, date }`.
  - First launch (no key, no entries): a small sheet asks *"How much money do you have right now?"* with a ₱ amount field, **Save** and **Skip** (Skip saves 0). Existing users with entries see the same sheet once, worded *"How much money do you have right now? Your past entries stay as they are."*, and the opening amount is back-calculated so the balance equals what they type (opening = typed − all income + all expenses).
- **Balance** = opening amount + all income − all expenses (all time, every month).
- **Adjust balance** (Settings, below Monthly budget): *"Actual balance"* field. Saving creates an entry `{ type: 'income' or 'expense', category: 'Adjustment', note: 'Balance adjusted' }` for the difference, so the history stays honest. Adjustment rows show in the list with the note and an `--ink-muted` amount, and are left out of the speaker panel and the budget.

### 13.2 Home: the Lightbox becomes the balance

```
┌───────────────── LIGHTBOX ─────────────────┐
│ Balance                                     │  label, --lightbox-muted
│ ₱20,651                                     │  64px / 800 / -2.2px (was 72px)
│ ─────────────────────────────────────────── │  1px #e3dacb rule, 16px above, 14px padding below
│ Earned this month    Spent this month       │  2 columns, 13px --lightbox-muted labels
│ +₱16,200             −₱2,849                │  18px / 700 values
│ ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░           │  4px budget bar, 12px above (expenses only)
│ Budget ₱10,000                 ₱7,151 left  │  14px / 600; left label muted
└─────────────────────────────────────────────┘
```

- Budget text is **always pesos, never a percent.** Over budget: right side reads "₱420 over". No budget set: hide the bar and the budget line.
- Viewing a past month (LiveBadge): label becomes "Balance at end of October" and shows the balance as of that month's last day; the two columns read "Earned in October" / "Spent in October".
- Balance below zero: shown as "−₱1,250" in `--lightbox-ink` (no red; the lightbox stays calm).
- The count-up animation (§9) runs on the balance.
- The **speaker panel shows expenses only.** Tapping a cone also sets the list filter to Expenses.

### 13.3 Home: list filter and rows

- **Filter**, between the speaker panel and the first day header (18px above, 14px below): a segmented control **All | Expenses | Income**.
  - Track: 4px padding, `--radius-pill`, background #150f0d, 1px `--line` border, 3 equal columns, 4px gap.
  - Options: 36px tall, 14px / 700. Selected: `--lightbox` background, `--lightbox-ink` text. Unselected: transparent, `--ink-muted`.
  - Real radios (`role="radiogroup"` + `role="radio"` + `aria-checked`, or hidden radio inputs like the chips). Saved in the `filters` localStorage key as `type: 'all' | 'expense' | 'income'`, default `all`.
  - The filter only changes the list. The lightbox and the speaker panel always show everything.
- **Day header totals** (right side, 15px / 600, 10px gap), showing only what's non-zero and allowed by the filter:
  - Income: "+₱1,200 in" in `--gold`
  - Expenses: "−₱230 out" in `--ink-muted`
- **Rows:**
  - Expense: dot `--cat-*` (as before), amount "−₱185" in `--ink`.
  - Income: 10px **hollow** dot (2px `--gold` border, `--ground` fill), amount "+₱1,200" in `--gold`, second line "Income: sold something".
  - Screen-reader label starts with the type: "Income, ₱1,200, sold old sneakers, today. Edit".
- **Empty states:** Income filter with nothing this month: "No income logged in November." Expenses: "No expenses in November yet."

### 13.4 The Add button and sheet

- The home GlowButton label becomes **"Add"** (plus icon kept). It opens the sheet.
- **Type switch**, directly under the sheet title (12px above the amount field): segmented control **Expense | Income**, same style as the list filter but 40px tall, `--radius-pill`, background `--ground`.
  - Default **Expense** for a new entry (most common). When opened while the list filter is on Income, default to Income.
  - Switching swaps the category chips (expense list ↔ income list) and keeps the amount, date and note. Each type remembers its last picked chip (expense default Food, income default Allowance).
- Per type:

| | Expense | Income |
|---|---|---|
| Title | New expense | New income |
| Amount prefix | ₱ | +₱ (no line break: `white-space: nowrap`) |
| Chips | Food … Other | Allowance, Salary, Gift, Sold something, Other |
| Button | Save expense | Save income |
| Toast | Expense saved | Income saved |

- Edit mode: title "Edit expense" / "Edit income", button "Save changes"; the type switch still works (to fix an entry saved as the wrong type).

### 13.5 CSV backup

- Columns become `date,type,category,amount,note,id`.
- Import: a missing `type` column, or an empty cell, means `expense`. Accept `expense`/`income` in any case. Income categories match the income list; unknown ones become "Other" of that type.
- Export the opening balance as its own row: `type = opening`, category empty, so a backup restores the balance too. Import reads it back into `openingBalance`.

---

## 14. Phase 7: Extras

**Mockups:** canvas row 4, "After hours v3 clean" (press Play: tap Add, tap the motto) and "Month closed under budget (disco ball)" (press Play, tap Replay). **Not** v3's red glow at the top of the screen: that was dropped.

### 14.1 Amber speaker glow

- Add tokens: `--amber: #ff9a45` (lit ring), `--amber-track: #3a2018` (unlit ring), `--glow-cone: 0 0 8px rgba(255,130,50,.5)`.
- Cone ring: `conic-gradient(var(--amber) 0 P%, var(--amber-track) P% 100%)`, plus `box-shadow: var(--glow-cone), inset 0 0 0 1px rgba(0,0,0,.45)`.
- Cone centre: `radial-gradient(circle at 50% 45%, #4a2a1e 0 16%, #1a0f0b 17% 58%, #2a1710 59% 63%, #140c09 64%)`.
- **The percentage text has no glow:** 13px / 700, `--lightbox` (#f6f1e7), no text-shadow.
- `--gold` stays the UI accent (chips, logo ring, income). Amber is only for the lit rings.
- Logo ring becomes 1.5px #e0a458 (warm, between gold and amber), no glow.

### 14.2 Rotating mottos

- List: "focus on improving, not proving", "change is scary, staying is scarier", "tell people you love them". Keep it as one `MOTTOS` array so Matt can add his own.
- One per day: `MOTTOS[dayOfYear % MOTTOS.length]` (local date).
- The motto is a `<button>` (44px min height, `aria-label="Show another motto"`, same Caveat Brush styling as §4). Tapping shows the next one for the rest of the session.

### 14.3 Vinyl "saved" toast

- After Save: the §5 toast, 44px tall, 192px wide, with a 30px record on its left (8px from the edge, 10px gap to the text):
  - Record: `repeating-radial-gradient(circle, #0e0908 0 1.5px, #1e1512 1.5px 3px)`, `box-shadow: 0 0 10px rgba(255,130,50,.35)`.
  - Label: 11px circle in `--amber` with a 3px `--ground` spindle hole.
  - Spins **once**, 900ms, `cubic-bezier(.3,.6,.4,1)`. Reduced motion: no spin.
- Toast visible about 2.6s (fade/slide in 180ms, out at the end).
- Same toast for Expense saved, Income saved and Changes saved.

### 14.4 Monthly recap (disco ball)

**When:** the first time the app opens in a new month, if the previous month has at least one entry. Remember it in localStorage `recapSeen: 'YYYY-MM'` so it shows once. It's a full-screen `<dialog>` over the home screen.

**Content** (390-wide reference, everything centred):
- Title, 28px / 700: "October, done."
- Subtitle, 16px `--ink-muted`:
  - Budget set and expenses ≤ budget: "You stayed under budget."
  - Budget set and over: "₱420 over budget."
  - No budget: "Here's how it went."
- A Lightbox (same style as home):
  - Label "Kept" with the month's income − expenses ("₱7,300"; "−₱1,250" if negative), 64px.
  - Bar and line: "Spent ₱2,700" left, "of ₱10,000" right (hidden with no budget).
  - Under the bar, 13px muted: "Earned ₱10,000 · Spent ₱2,700".
- The motto of the day under it.
- GlowButton: "Start November" closes it. A small text button "Replay" is **not** in the app (mockup only).

**The disco ball only appears in the good case** (budget set and expenses ≤ budget; with no budget, when Kept > 0). Otherwise the recap shows calmly, with no ball and no flecks.

Disco ball (from the mockup):
- Hangs from the top: 2px cord (gradient `--ground` → #6b5a4e, 96px), 8×6px cap, then a 96px ball.
- Ball: `radial-gradient(circle at 34% 30%, #fff1d6 0 5%, #cdb08a 14%, #6e5a48 38%, #2a201b 72%, #140e0c 100%)` with a tile grid on top: two `repeating-linear-gradient`s (0deg and 90deg, rgba(10,6,5,.55) 1.5px lines every 9px). Shadow `0 0 40px rgba(224,164,88,.35)`.
- Motion: drops in from −220px with a small bounce (900ms, `cubic-bezier(.3,.7,.3,1)`). The tiles "turn" by animating the vertical grid's background-position 0 → 72px over 4s, looping. Three small square glints (#fff4de, #f2c46e, `--amber`) twinkle, 1.4s, staggered.
- Light flecks: 14 small squares (4–7px, colours #f2c46e #ffe2b0 #ff9a45 #e0a458, each with a matching 10px glow) drift ~100–300px and fade, 2.6s, starting 0.6–1.1s after open. They play once.
- Text and lightbox rise in (16px, fade) at 0.5s.
- **Reduced motion:** the ball appears in place, no flecks, no rise. Everything else the same.
- The flecks and the ball are `aria-hidden`. The dialog is labelled by the title.

### 14.5 Skills for this phase

`animate` and `choreograph` (the recap entrance), `review-animations` and `animation-performance` (keep the disco at 60fps on a phone: animate only transform and opacity, plus the tile background-position on one small element), `break-ui` (negative balance, huge income, a month with only income).
