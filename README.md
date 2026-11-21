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

## Files

| File | What it's for |
|---|---|
| `index.html` | **Structure**: the header, the form, and the empty list. |
| `style.css` | **Look**: colors, spacing, the phone/desktop layouts, and dark mode. |
| `app.js` | **Behavior**: saving, loading, drawing the list, and reacting to clicks. |
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
3. **Redraw** the page (`renderList`).

### `app.js`, section by section

1. **Find elements**: grabs the form, inputs and list by their `id`.
2. **Storage**: `loadExpenses()` and `saveExpenses()` use `localStorage`. It only stores text, so the array is converted to and from **JSON**. Both are wrapped in `try/catch`, so broken data can't crash the app.
3. **State**: `expenses` (the data) and `editingId` (`null` = adding, an id = editing).
4. **Helpers**:
   - `todayString()` gives today's date in your local time.
   - `makeId()` creates a unique id.
   - `formatPeso()` formats amounts, e.g. `₱10,000.00`.
   - `formatDate()` formats dates, e.g. `Nov 21, 2026`.
   - `updateNoteCount()` updates the note character counter.
   - `makeElement()` and `makeRowButton()` build pieces of the page.
5. **Render**: `renderList()` sorts a copy newest first, rebuilds the list, and updates the total and the "No expenses yet" message.
6. **Actions**:
   - `addExpense()`, `updateExpense()` and `deleteExpense()` change the data.
   - `startEdit()` and `resetForm()` switch the form between add and edit mode.
7. **Events**:
   - The form's `submit` handler validates the input, then adds or updates.
   - **One** click listener on the whole list handles every Edit/Delete button. This is called *event delegation*.
8. **Start-up**: puts the form in add mode and draws the list.

### Good habits used in this project

- **`textContent`, not `innerHTML`**, for anything the user typed. A note like `<b>hi</b>` shows as text instead of turning into HTML.
- **Validate twice**: HTML attributes (`required`, `min`, `maxlength`) give instant feedback, and JavaScript checks again, because HTML checks can be bypassed.
- **Dates stored as `YYYY-MM-DD`**: this sorts correctly as plain text and is what `<input type="date">` uses. They're only shown as `Nov 21, 2026` on screen.
- **Mobile-first CSS**: phone styles first, then `@media (min-width: 768px)` adds the two-column layout.
- **CSS variables** (`--primary`, `--bg`, …): dark mode just redefines the colors.

## Where is my data?

In your browser's **localStorage**, under the key `expenses`, for the address you opened the app from.

- To **see** it: press **Ctrl + Shift + I**, then go to **Application → Local Storage**.
- It stays on **this browser on this device only**. A different browser, a different device, or a different address (opening the file directly vs. through a local server) each has its own separate list.
- **Clearing your browser's site data deletes it.** There's no backup yet.
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
