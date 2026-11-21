# Matt's Expense Tracker (₱)

A small expense tracker that runs entirely in your browser. You can add, edit and delete expenses in Philippine pesos. Everything is saved on your own device, so there's no account, no server, and no internet needed.

Built step by step as a learning project for working with AI coding agents.

**▶ Try it live: https://mattsio872.github.io/expense-tracker/**. It works on phones too. Use *Add to Home Screen* to open it like an app. Each device keeps its own list.

## Features

**Expenses**
- Add an expense with an **amount (₱)**, **category**, **date**, and an optional **note** (up to 200 characters, with a counter).
- Expenses are listed **newest first**, with the all-time **total spent** at the top.
- **Edit** an expense in place, or **delete** it (the row asks "Delete this?" before anything is removed).

**Filters and totals**
- **Filter by month and category**. Your choice is remembered next time.
- The **total of the expenses shown** appears beside the "Expenses" heading, with a count like "Showing 2 of 5 expenses".

**Spending chart**
- **By month**: one bar per month, split into colored pieces by category, with a color legend.
- **By category**: one bar per category with its amount and share of the total (e.g. ₱10,000.00 · 59%).

**Backup (CSV)**
- **Export** all expenses, or a **single month**, to a CSV file that opens in Excel or Google Sheets.
- **Import** a CSV to restore a backup or add expenses from a spreadsheet. Every row is checked first, and a preview lets you **add only new ones** or **replace all**.

**App**
- **Installable** on phones and computers, with its own icon and window (a PWA).
- **Works offline**: once opened online, the app loads with no internet.
- Data is **saved automatically** on your device and survives a page refresh. No account, no server.
- **Mobile-friendly**: one column on phones, two columns on wider screens.
- **Dark mode** follows your device setting.

## How to run it

No installation needed.

1. Open the `expense-tracker` folder.
2. Double-click **`index.html`**. It opens in your default browser.

That's it. If you change the code, refresh the page (**Ctrl + F5** forces the browser to reload CSS and JS).

> **Optional:** in VS Code, the *Live Server* extension serves the app at an address like `http://127.0.0.1:5500` and refreshes it automatically when you save a file.

### Online (GitHub Pages)

The live version at **https://mattsio872.github.io/expense-tracker/** is served by GitHub Pages straight from the `main` branch. Every `git push` to `main` updates the live site automatically, usually within 1–2 minutes.

> **When you change any app file (`style.css`, `app.js`, images…):** raise the version number in **three** places, all to the same number: the `?v=` on the `style.css` and `app.js` links in `index.html`, and `VERSION` at the top of `sw.js` (e.g. 3 → 4). Browsers and the service worker keep saved copies of the files; a new number makes the new versions download instead of mixing new and old files.

### Installable app and offline use (PWA)

- `manifest.webmanifest` gives the app its name, icon and colors, so it can be installed (Chrome: **Install** in the address bar; Android: **⋮ → Install app**; iPhone Safari: **Share → Add to Home Screen**).
- `sw.js` is a **service worker**: it saves the app's files so it opens with no internet. The page is fetched **network-first** (newest version when online, saved copy when offline); CSS, JS and images are **cache-first** (they have version numbers, so a new version is a new address).
- **How updates reach your phone:** the next time you open the app online, it gets the new page straight from the internet, and the new page asks for the new `?v=` files, which are downloaded and saved. The browser also notices `sw.js` changed, installs the new version, and deletes the old saved files. If the app was already open, pull down to refresh (or close and reopen it).
- Offline mode does **not** need a server: your expenses are still in localStorage on the device.
- **Check it's ready:** the bottom of the page says **"✓ Ready to use offline"** once the files are saved (or "✓ Offline: using the saved app" when there's no internet). Open the app once with internet and wait for that message before relying on it offline.
- Use the address **with the final slash**: `https://mattsio872.github.io/expense-tracker/`. Without it (`…/expense-tracker`) the page is redirected and sits outside the service worker's area, so it won't open offline.

## Files

| File | What it's for |
|---|---|
| `index.html` | **Structure**: the header, the form, the list with its filters, the chart card, and the Backup card. Also links the manifest and icons. |
| `style.css` | **Look**: colors (including one per category for the chart), spacing, the phone/desktop layouts, and dark mode. |
| `app.js` | **Behavior**: saving and loading, drawing the list and chart, filters, CSV export/import, and reacting to clicks. |
| `sw.js` | **Offline support**: the service worker that saves the app's files so it opens with no internet. |
| `manifest.webmanifest` | **Install info**: the app's name, icons and colors, so phones and computers can install it. |
| `images/` | The header icon (`monkey-icon.png`) and the app icons (192px, 512px, maskable, and the iPhone `apple-touch-icon.png`). |
| `README.md` | This file. |

## How the code works

### The main idea

```
expenses array  ──►  renderList()  ──►  what you see on the page
      ▲                                        │
      └──── add / edit / delete ◄── you click ─┘
```

The `expenses` array in `app.js` is the **single source of truth**. The page is just a drawing of it. Every change follows the same three steps:

1. **Change** the array (`push`, `map`, or `filter`).
2. **Save** it (`saveExpenses`).
3. **Redraw** the page (`renderList`, which also redraws the chart).

Filters, sorting and the chart **change the view, not the data**: they work on copies or filtered lists, so the saved `expenses` array is never reordered or trimmed by them.

### `app.js`, section by section

1. **Find elements**: grabs the form, inputs, list, filters, chart and backup elements by their `id`.
2. **Storage**:
   - `loadExpenses()` and `saveExpenses()` use `localStorage`. It only stores text, so the array is converted to and from **JSON**. Both are wrapped in `try/catch`, so broken data can't crash the app.
   - `loadFilters()` and `saveFilters()` remember your filter choice the same way (quietly falling back to "show everything" if anything goes wrong).
3. **State**:
   - `expenses`: the data.
   - `editingId`: `null` = adding, an id = editing that expense.
   - `confirmingDeleteId`: which row is showing "Delete this?", or `null`.
   - `filters`: the chosen month and category (`'all'` = no filter).
4. **Helpers**:
   - **Dates and money**: `todayString()` (today in your local time), `formatPeso()` (`₱10,000.00`), `formatDate()` (`Nov 21, 2026`), `monthOf()` (`"2026-11-21"` → `"2026-11"`), `formatMonth()` (`"2026-11"` → `Nov 2026`), `countLabel()` (`1 expense` / `3 expenses`).
   - **Ids**: `makeId()` creates a unique id (it starts with the time, which is also used to sort same-day expenses).
   - **Filters**: `matchesFilters()` checks one expense against both filters. `fillCategoryFilter()` copies the categories from the form's dropdown. `monthsWithExpenses()` and `fillMonthSelect()` build the month dropdowns, shared by the list filter and the export picker. `updateMonthOptions()` refreshes both on every render.
   - **Building the page**: `updateNoteCount()` (the note counter), `makeElement()` and `makeRowButton()`.
5. **Render**: `renderList()` sorts a copy newest first, keeps the expenses that pass the filters, rebuilds the list (including any row's "Delete this?" question), and updates the totals, the summary line, the empty messages and the chart.
   - **5b. Chart**: `renderChart()` draws bars as `<div>`s with a width in %. `sumBy()` adds amounts up into groups (per month, per category). Each month bar is split into colored pieces whose `flex-grow` equals their amount, so they share the bar in proportion. `categoryColor()` turns `"Food"` into the CSS variable `var(--cat-food)`.
   - **5c. Export**: `csvCell()` makes each value safe (quotes cells containing commas, quotes or line breaks, and puts a `'` before cells starting with `= + - @` to block spreadsheet formulas). `expensesToCsv()` builds the file, and `downloadTextFile()` downloads it without a server (a Blob plus a temporary link). `exportCsv()` exports all months or the chosen one.
   - **5d. Import**: `parseCsv()` reads the file one character at a time, following the CSV quoting rules. `readImportFile()` finds columns by name and checks every row (`parseImportDate()` accepts `2026-10-15` and `10/15/2026`, `parseImportAmount()` accepts `₱1,200.50`). `showImportPreview()` shows what was found. `applyImport()` either adds only new expenses (matched by `id`) or replaces everything. Nothing is saved until you choose.
6. **Actions**:
   - `addExpense()` and `updateExpense()` change the data.
   - Deleting takes two clicks: `askToDelete()` shows "Delete this?" in the row, then `deleteExpense()` removes it (or `cancelDelete()` puts the row back). We don't use `confirm()` because some browsers block it, and it then silently answers "Cancel".
   - `startEdit()` and `resetForm()` switch the form between add and edit mode.
7. **Events**:
   - The form's `submit` handler validates the input, then adds or updates.
   - **One** click listener on the whole list handles every Edit, Delete, Yes and Cancel button. This is called *event delegation*.
   - The filter dropdowns save your choice and redraw. The Backup buttons run export and import (the Import button opens a hidden file picker).
8. **Start-up**: registers the service worker (`sw.js`), fills the category filter, puts the form in add mode, and draws everything.

### `sw.js`, the service worker

A script the browser runs in the background, between the app and the internet. It saves the app's **files** (not your expenses, which stay in localStorage).

- **install**: saves all the app files in a cache named after the version (`expense-tracker-v3`).
- **activate**: deletes caches from older versions.
- **fetch**: the page is **network-first** (the newest version when online, the saved copy when offline). CSS, JS and images are **cache-first**; that's safe because CSS and JS have a version in their address (`?v=3`), so a new version is a new address that gets downloaded.

### Good habits used in this project

- **`textContent`, not `innerHTML`**, for anything the user typed. A note like `<b>hi</b>` shows as text instead of turning into HTML.
- **Validate twice**: HTML attributes (`required`, `min`, `maxlength`) give instant feedback, and JavaScript checks again, because HTML checks can be bypassed.
- **Dates stored as `YYYY-MM-DD`**: this sorts correctly as plain text and is what `<input type="date">` uses. They're only shown as `Nov 21, 2026` on screen.
- **Mobile-first CSS**: phone styles first, then `@media (min-width: 768px)` adds the two-column layout.
- **CSS variables** (`--primary`, `--bg`, `--cat-food`, …): dark mode just redefines the colors.
- **Never trust a file**: imported CSVs are checked row by row and previewed before anything is saved; exported CSVs are protected against formula injection.
- **Share code instead of copying it**: helpers like `sumBy()`, `fillMonthSelect()` and `makeRowButton()` are used in several places, so they can't drift apart.
- **Version numbers on files** (`?v=3`) so phones never mix new and old code.
- **Accessibility**: labels on every input, a visible focus ring, hidden text that tells screen readers what the chart's colors mean, and keyboard focus moved to "Cancel" when asking "Delete this?".

## Where is my data?

In your browser's **localStorage**, under the key `expenses`, for the address you opened the app from.

- To **see** it: press **Ctrl + Shift + I**, then go to **Application → Local Storage**.
- It stays on **this browser on this device only**. A different browser, a different device, or a different address (opening the file directly vs. through a local server) each has its own separate list.
- **On iPhone, the Home Screen app has its own storage**, separate from Safari. To move your expenses over, export a CSV in Safari and import it in the Home Screen app.
- **Clearing your browser's site data deletes it.** Make a backup now and then with **Backup → Export CSV (All months)**, and restore it with **Import CSV**.
- To **start fresh**: delete the `expenses` key in DevTools and refresh.

## Ideas for next steps

Good practice exercises, roughly from easiest to hardest:

- [x] Filter the list by category or by month.
- [x] Show a total per category. *(The filtered total beside "Expenses", and the chart's "By category" breakdown.)*
- [x] Export expenses to a CSV file (opens in Excel or Google Sheets). *(Also by single month.)*
- [x] Import from CSV, to restore a backup.
- [x] A simple chart of spending by category. *(By month, split by category, plus by category.)*
- [ ] Sync across devices (needs a backend server and a database).

Also done along the way: installable app with offline support (PWA).
