# Matt's Club (₱)

A personal money tracker that runs entirely in your browser: log what you spend and what you earn in Philippine pesos, and always see your balance. Everything is saved on your own device, so there's no account, no server, and no internet needed once it's installed.

The look is **Matt's Club**: a members' club with a varsity-jacket streak. Cream paper, forest green, burgundy and a little gold, with money set in a classic serif like a ledger.

Built step by step as a learning project for working with AI coding agents. The design spec it was built from is [`DESIGN.md`](DESIGN.md).

**▶ Try it live: https://mattsio872.github.io/expense-tracker/**. It's made for phones. Use *Add to Home Screen* to open it like an app. Each device keeps its own data.

## Features

**Home screen**
- **The ticket** shows your **balance** (opening balance + all income − all expenses), then this month's **earned** and **spent**, and with a monthly budget, a bar with **"₱7,151 left of ₱10,000"**. An **"UNDER BUDGET" poker chip** sits on the ticket while you're under budget (when there's room beside the number).
- **The pennant** (top right, e.g. "NOV ’26") picks the month the whole screen shows. Earlier months turn it grey, and the ticket then shows the balance at the end of that month.
- **"Now spinning"**: a record whose label is a pie of the month's biggest spending categories (top 3 + Rest), with a legend. Tap a category to show only that category in the list.
- **The list** is grouped by day ("Today", "Yesterday", "Wednesday", "Nov 12"), with each day's "+₱… earned / −₱… spent". Tabs switch between **All / Expenses / Income**.
- **A motto** on a taped note: a different one each day, tap it for another.

**Adding and editing**
- **"★ Add to the books"** opens a sheet that slides up. Switch between **Expense** and **Income**, type the amount, tap a **category chip** and **Today / Yesterday / Pick a date**, and add an optional **note** (up to 200 characters).
- Expense categories: Food, Transport, Bills, Shopping, Health, Nights out, School, Other. Income: Allowance, Salary, Gift, Sold something, Other.
- **Tap any row to edit it.** Delete from the edit sheet ("Delete this expense?"), or **swipe a row to the left**. Either way, a toast offers **Undo** for 5 seconds.
- Sheets can be **dragged down to close**, or closed with ×, Esc, or a tap outside. Nothing is saved unless you tap Save.

**Balance and budget**
- On first use the app asks **"How much money do you have right now?"** so the balance starts right.
- **Backup & settings** has an optional **monthly budget** and **Actual balance**: type what you really have, and the difference is logged as a "Balance adjusted" entry (it counts in the balance, but not in spending, the budget or the record).

**Backup (CSV)**
- **Export** everything (or one month) to a CSV file that opens in Excel or Google Sheets. A full export also carries your opening balance.
- **Import** a CSV to restore a backup or add entries from a spreadsheet. Every row is checked first, and a preview lets you **add only new ones** or **replace all**.
- A **backup reminder** appears under the list when it's been 14+ days since your last full export and you've added entries since.

**Monthly recap**
- The first time you open the app in a new month, a full-screen recap shows how last month went: what you kept, spent vs. budget, earned and spent. When the month went well, **a disco ball drops in**.

**App**
- **Installable** on phones and computers, with its own icon (a PWA).
- **Works offline**: once opened online, the app loads with no internet.
- **Saved automatically** on your device. The app also asks the browser to keep its storage when the phone runs low on space.
- **Feels native on a phone**: no tap flash or zoom on inputs, safe-area padding for the notch, press feedback, and **Reduce Motion** turns the animations off.
- **Light theme only**, with a cream status bar.

## How to run it

No installation needed.

1. Open the `expense-tracker` folder.
2. Double-click **`index.html`**. It opens in your default browser.

That's it. If you change the code, refresh the page (**Ctrl + F5** forces the browser to reload CSS and JS).

> **Optional:** in VS Code, the *Live Server* extension serves the app at an address like `http://127.0.0.1:5500` and refreshes it automatically when you save a file. Offline mode (the service worker) only works when the app is served from an address like this, not when opened by double-clicking.

### Online (GitHub Pages)

The live version at **https://mattsio872.github.io/expense-tracker/** is served by GitHub Pages straight from the `main` branch. Every `git push` to `main` updates the live site automatically, usually within 1–2 minutes.

> **When you change any app file (`style.css`, `app.js`, images…):** raise the version number in **three** places, all to the same number: the `?v=` on the `style.css` and `app.js` links in `index.html`, and `VERSION` at the top of `sw.js` (e.g. 18 → 19). Browsers and the service worker keep saved copies of the files; a new number makes the new versions download instead of mixing new and old files.

### Installable app and offline use (PWA)

- `manifest.webmanifest` gives the app its name ("Matt's Club"), icon and colors, so it can be installed (Chrome: **Install** in the address bar; Android: **⋮ → Install app**; iPhone Safari: **Share → Add to Home Screen**).
- `sw.js` is a **service worker**: it saves the app's files so it opens with no internet. The page is fetched **network-first** (newest version when online, saved copy when offline); CSS, JS and images are **cache-first** (they have version numbers, so a new version is a new address). The Google Fonts are fetched from the internet; offline, the fonts' built-in fallbacks are used.
- **How updates reach your phone:** the next time you open the app online, it gets the new page, which asks for the new `?v=` files. The browser also notices `sw.js` changed, installs the new version, and deletes the old saved files. If the app was already open, close and reopen it.
- **The name and status-bar color under the home-screen icon** are taken when you add the app. If they look old after an update, remove the app from the home screen and add it again (your data stays).
- **Check it's ready:** the bottom of the page says **"✓ Ready to use offline"** once the files are saved (or "✓ Offline: using the saved app" with no internet).
- Use the address **with the final slash**: `https://mattsio872.github.io/expense-tracker/`. Without it, the page is redirected and sits outside the service worker's area, so it won't open offline.

## Files

| File | What it's for |
|---|---|
| `index.html` | **Structure**: the header (patch + pennant), the ticket, the record, the list, the motto, the Add button, and the sheets (add/edit, Backup & settings, opening balance) and the monthly recap, as `<dialog>`s. |
| `style.css` | **Look**: the Matt's Club tokens at the top (colours, fonts, radii, shadows), then each part of the page. Hover styles only apply with a mouse; Reduce Motion is respected at the end. |
| `app.js` | **Behavior**: saving and loading, drawing the page, the sheets and gestures, CSV export/import, the recap, and reacting to taps. |
| `sw.js` | **Offline support**: the service worker that saves the app's files so it opens with no internet. |
| `manifest.webmanifest` | **Install info**: the app's name, icons and colors. |
| `images/` | The monkey (`monkey-icon.png`) and the app icons (192px, 512px, maskable, and the iPhone `apple-touch-icon.png`). |
| `DESIGN.md` | The design spec (Matt's Club) the look was built from, phase by phase. |
| `README.md` | This file. |

## How the code works

### The main idea

```
expenses array  ──►  renderList()  ──►  what you see on the page
      ▲                                        │
      └──── add / edit / delete ◄──── you tap ─┘
```

The `expenses` array in `app.js` is the **single source of truth** (it holds income too; the name is from before income existed). The page is just a drawing of it. Every change follows the same three steps:

1. **Change** the array (`push`, `map`, or `filter`).
2. **Save** it (`saveExpenses`).
3. **Redraw** the page (`renderList`, which also redraws the ticket and the record).

Each entry looks like `{ id, type, amount, category, date, note }`. `type` is `'expense'` or `'income'`, and `amount` is always positive. Filters, sorting and the record **change the view, not the data**: they work on copies, so the saved array is never reordered or trimmed by them.

### `app.js`, section by section

1. **Find elements**: grabs everything the code needs by its `id`.
2. **Categories**: `CATEGORIES` and `INCOME_CATEGORIES`, the one place each list lives (the chips, the record and CSV import all use them). `ADJUSTMENT` is the category for balance adjustments.
   - **2b. Storage**: `loadExpenses()` / `saveExpenses()` use `localStorage` (as **JSON**, inside `try/catch`). Loading also updates old data once: entries without a `type` become expenses, and "Entertainment" becomes "Nights out". The same file stores the `filters`, `budget`, `openingBalance` and `lastBackup`.
3. **State**: `expenses`, `editingId` (which entry the sheet is editing), `filters` (month, category, type), `budget` and `opening`.
4. **Helpers**: dates in your local time (`todayString()`, `dayLabel()` for "Today"/"Wednesday"), money (`formatPeso()`, `formatRowPeso()` drops ".00", `formatBalance()` uses a real minus sign), `balanceAt()`, the month pickers (`monthsWithExpenses()`, `fillMonthSelect()`), and `makeElement()`.
5. **Render**: `renderList()` takes the month's entries newest first, keeps those that pass the filters, groups them by day, and builds each row with `makeExpenseRow()`.
   - **5a. The ticket** (`renderLightbox()`): the balance (with a count-up when you switch months), earned/spent, the budget bar, and the poker chip (`updatePokerChip()` / `chipFits()` keep it off the number). `fitTotal()` shrinks a very long balance.
   - **5b. The record** (`renderSpeakerPanel()`): `sumBy()` totals the month's spending by category, `percentsSummingTo100()` rounds the percents so they add up to exactly 100, and `recordGradient()` paints the label's pie by rank.
   - **5c. Export**: `csvCell()` makes each value safe (quotes, and a `'` before `= + - @` to block spreadsheet formulas), `expensesToCsv()` builds the file (`date,type,category,amount,note,id`, plus an `opening` row for a full backup), and `downloadTextFile()` saves it without a server.
   - **5d. Import**: `parseCsv()` follows the CSV quoting rules; `readImportFile()` finds columns by name and checks every row; `showImportPreview()` and `applyImport()` add only new entries (by `id`) or replace everything. Nothing is saved until you choose.
   - **5e. Backup reminder**: `backupState()` / `renderBackupStatus()` work out whether a backup is overdue.
6. **Actions**: `addExpense()`, `updateExpense()`, `deleteExpense()` and `undoDelete()`.
   - **6b. The add/edit sheet**: `openSheet()`, `setSheetType()` (Expense/Income swaps the chips and labels), `setWhen()`, and the amount and note checks.
   - **6c. Toasts**: `showToast()`, including the spinning record for "saved".
   - **6d. Sheets**: `showSheet()` / `dismissSheet()` slide them in and out; `setupSheet()` adds drag-down-to-close with touch events (the sheet follows the finger, a flick closes it, and it can be caught mid-slide).
   - **6e. Swipe to delete**: `setupSwipeToDelete()`; up-and-down still scrolls, and a swipe never opens the editor.
   - **6f. Mottos**: the `MOTTOS` list (add your own) and one per day.
   - **6g. Monthly recap**: `maybeShowRecap()` shows it once per month (`recapSeen`); `showRecap()` fills it in, and `throwFlecks()` adds the disco ball's specks of light.
7. **Events**: the form's `submit`, **one** tap listener on the whole list (*event delegation*), the pennant, the record's legend, the tabs, and the Add button.
   - **7b. Backup & settings**: the budget (saved as you type) and **Actual balance**.
   - **7c. Opening balance**: "How much money do you have right now?" (worked out backwards for existing entries).
8. **Start-up**: registers the service worker, sets up the sheets and swipes, asks the browser to keep the storage, draws everything, and asks for the opening balance or shows the recap if it's due.

### `sw.js`, the service worker

A script the browser runs in the background, between the app and the internet. It saves the app's **files** (not your data, which stays in localStorage).

- **install**: saves all the app files in a cache named after the version (`expense-tracker-v18`).
- **activate**: deletes caches from older versions.
- **fetch**: the page is **network-first**, CSS/JS/images are **cache-first** (safe because they have `?v=18` in their address). Requests to other sites (like Google Fonts) are left alone.

### Good habits used in this project

- **`textContent`, not `innerHTML`**, for anything the user typed. A note like `<b>hi</b>` shows as text instead of turning into HTML.
- **No `confirm()` or `alert()`**: some in-app browsers block them. Deleting asks inside the sheet, and messages are toasts.
- **Dates stored as `YYYY-MM-DD`** and always read in local time, never with `new Date("2026-11-21")` (that's UTC and can show the wrong day).
- **Design tokens** (`--paper`, `--green`, `--burgundy`, `--cat-food`, …) at the top of `style.css`, so the whole look changes in one place.
- **Phone first**: inputs are at least 16px (no zoom on iPhone), taps fire instantly, hover styles only apply with a mouse, and everything sits clear of the notch and home bar.
- **Only `transform` and `opacity` animate**, and **Reduce Motion** turns the movement off.
- **Never trust a file**: imported CSVs are checked row by row and previewed; exported CSVs are protected against formula injection.
- **Version numbers on files** (`?v=18`) so phones never mix new and old code.
- **Accessibility**: real radio buttons under the chips and tabs, labels on every input, screen-reader labels on rows and the record's legend, a visible focus ring, live regions for messages, and decorative pieces (patch, cigar bands, poker chip, record, tape, disco ball) hidden from screen readers.

## Where is my data?

In your browser's **localStorage**, for the address you opened the app from:

| Key | What's in it |
|---|---|
| `expenses` | Every entry (expenses and income). |
| `openingBalance` | What you had when you started, `{ amount, date }`. |
| `budget` | The monthly budget, if you set one. |
| `filters` | The month, category and tab you last picked. |
| `lastBackup` | When you last exported "All months". |
| `recapSeen` | The month the last recap was shown in. |

- To **see** it: press **Ctrl + Shift + I**, then go to **Application → Local Storage**.
- It stays on **this browser on this device only**. A different browser, device or address each has its own data.
- **On iPhone, the Home Screen app has its own storage**, separate from Safari. To move your data over, export a CSV in one and import it in the other.
- **Clearing your browser's site data deletes it.** Back up now and then with **Backup & settings → Export CSV (All months)**, keep the file somewhere off the phone, and restore it with **Import CSV**.

## Ideas for next steps

- [x] Filter by month, category, and expense/income.
- [x] Totals per category (the record).
- [x] Export to and import from CSV, with the opening balance.
- [x] Income, a running balance and a monthly budget.
- [x] Installable app with offline support (PWA).
- [x] Monthly recap.
- [ ] Suggest past notes while typing, so repeat expenses take one tap.
- [ ] Search across months.
- [ ] Separate wallets (cash, GCash, bank).
- [ ] Sync across devices (needs a backend server and a database).
