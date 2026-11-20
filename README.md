# Expense Tracker (₱)

A small expense tracker that runs entirely in your browser. You can add, edit and delete expenses in Philippine pesos. Everything is saved on your own device, so there's no account, no server, and no internet needed.

Built step by step as a learning project for working with AI coding agents.

## Features

- Add an expense with an **amount (₱)**, **category**, **date**, and an optional **note** (up to 200 characters, with a counter).
- Expenses are listed **newest first**, with the **total spent** at the top.
- **Edit** an expense in place, or **delete** it (you'll be asked to confirm).
- Data is **saved automatically** and survives a page refresh.
- **Mobile-friendly**: one column on phones, two columns on wider screens.
- **Dark mode** follows your device setting.

## How to run it

No installation needed.

1. Open the `expense-tracker` folder.
2. Double-click **`index.html`**. It opens in your default browser.

That's it. If you change the code, refresh the page (**Ctrl + F5** forces the browser to reload CSS and JS).

> **Optional:** in VS Code, the *Live Server* extension serves the app at an address like `http://127.0.0.1:5500` and refreshes it automatically when you save a file.

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

- Filter the list by category or by month.
- Show a total per category.
- Export expenses to a CSV file (opens in Excel or Google Sheets).
- Import from CSV, to restore a backup.
- A simple chart of spending by category.
- Sync across devices (needs a backend server and a database).
