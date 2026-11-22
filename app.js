// ===== 1. Find the HTML elements we need (using their id "name tags") =====
const sheet = document.getElementById('expense-sheet');
const sheetTitle = document.getElementById('sheet-title');
const sheetClose = document.getElementById('sheet-close');
const form = document.getElementById('expense-form');
const amountField = document.getElementById('amount-field');
const amountInput = document.getElementById('amount');
const amountError = document.getElementById('amount-error');
const categoryChips = document.getElementById('category-chips');
const dateInput = document.getElementById('date');
const noteInput = document.getElementById('note');
const noteCount = document.getElementById('note-count');
const submitBtn = document.getElementById('submit-btn');
const deleteArea = document.getElementById('delete-area');
const deleteBtn = document.getElementById('delete-btn');
const deleteConfirm = document.getElementById('delete-confirm');
const deleteYes = document.getElementById('delete-yes');
const deleteNo = document.getElementById('delete-no');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const toastUndo = document.getElementById('toast-undo');
const budgetBox = document.getElementById('budget-box');
const budgetFill = document.getElementById('budget-fill');
const budgetOf = document.getElementById('budget-of');
const budgetLeft = document.getElementById('budget-left');
const settingsSheet = document.getElementById('settings-sheet');
const settingsBtn = document.getElementById('settings-btn');
const settingsClose = document.getElementById('settings-close');
const budgetInput = document.getElementById('budget');
const budgetField = document.getElementById('budget-field');
const budgetError = document.getElementById('budget-error');
const backupReminder = document.getElementById('backup-reminder');
const backupLast = document.getElementById('backup-last');
const list = document.getElementById('expense-list');
const totalEl = document.getElementById('total');
const totalLabel = document.getElementById('total-label');
const earnedLabel = document.getElementById('earned-label');
const earnedEl = document.getElementById('earned');
const spentLabel = document.getElementById('spent-label');
const spentEl = document.getElementById('spent');
const listFilter = document.getElementById('list-filter');
const amountPrefix = document.getElementById('amount-prefix');
const deleteQuestion = document.getElementById('delete-question');
const openingSheet = document.getElementById('opening-sheet');
const openingForm = document.getElementById('opening-form');
const openingText = document.getElementById('opening-text');
const openingField = document.getElementById('opening-field');
const openingAmount = document.getElementById('opening-amount');
const openingError = document.getElementById('opening-error');
const openingSkip = document.getElementById('opening-skip');
const actualBalanceInput = document.getElementById('actual-balance');
const balanceField = document.getElementById('balance-field');
const balanceError = document.getElementById('balance-error');
const balanceStatus = document.getElementById('balance-status');
const balanceSaveBtn = document.getElementById('balance-save');
const emptyMessage = document.getElementById('empty-message');
const liveBadge = document.getElementById('live-badge');
const liveLabel = document.getElementById('live-label');
const filterMonth = document.getElementById('filter-month');
const filterText = document.getElementById('filter-text');
const filterClear = document.getElementById('filter-clear');
const speakerPanel = document.getElementById('speaker-panel');
const cones = document.getElementById('cones');
const addBtn = document.getElementById('add-btn');
const exportMonth = document.getElementById('export-month');
const exportBtn = document.getElementById('export-btn');
const backupStatus = document.getElementById('backup-status');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const importPreview = document.getElementById('import-preview');
const importSummary = document.getElementById('import-summary');
const importProblems = document.getElementById('import-problems');
const importMergeBtn = document.getElementById('import-merge');
const importReplaceBtn = document.getElementById('import-replace');
const importCancelBtn = document.getElementById('import-cancel');

// ===== 2. The categories: ONE list per type (the chips, the cones and CSV import all use them) =====
// Expense categories each need a color in style.css: "--cat-" + the name in lowercase, spaces -> "-".
const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Nights out', 'School', 'Other'];
const INCOME_CATEGORIES = ['Allowance', 'Salary', 'Gift', 'Sold something', 'Other'];

// "Adjust balance" (in settings) logs the difference under this category, as income or expense.
// Adjustments count in the balance, but not in the cones, the budget or "Earned / Spent".
const ADJUSTMENT = 'Adjustment';

// The chips for a type: 'expense' or 'income'
function categoriesFor(type) {
  return type === 'income' ? INCOME_CATEGORIES : CATEGORIES;
}

function isAdjustment(entry) {
  return entry.category === ADJUSTMENT;
}

// Old names that were renamed. Saved expenses, saved filters and imported CSVs are updated.
const RENAMED_CATEGORIES = { Entertainment: 'Nights out' };

// ===== 2b. Storage: save and load with localStorage =====
// localStorage is a small storage area in the browser. It only stores TEXT,
// so we turn our array into JSON text to save it, and back into an array to load it.
const STORAGE_KEY = 'expenses';

function loadExpenses() {
  try {
    const text = localStorage.getItem(STORAGE_KEY); // null if nothing saved yet
    const data = JSON.parse(text);
    // Only trust it if it really is an array. Otherwise start fresh.
    if (!Array.isArray(data)) return [];

    // One-time updates, then save once:
    // - "Entertainment" is now "Nights out";
    // - every entry has a type ('expense' or 'income'). Entries from before income existed are expenses.
    let changed = false;
    for (const entry of data) {
      if (RENAMED_CATEGORIES[entry.category]) {
        entry.category = RENAMED_CATEGORIES[entry.category];
        changed = true;
      }
      if (entry.type !== 'expense' && entry.type !== 'income') {
        entry.type = 'expense';
        changed = true;
      }
    }
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    // Broken JSON, or storage blocked (e.g. some private windows):
    // don't crash, just start with an empty list.
    console.warn('Could not load saved expenses:', error);
    return [];
  }
}

function saveExpenses(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    // A toast instead of alert(): some in-app browsers block alert(), and it stops everything
    showToast("Can't save on this browser");
    console.warn('Could not save expenses:', error);
  }
}

// The filter choice is saved too, so the app opens the way you left it.
// It's only a convenience, so if anything goes wrong we quietly fall back to the defaults.
// month: which month the screen shows ("all" from older versions becomes the current month,
// see updateMonthOptions). category: the speaker cone that's picked, or "all".
// type: the All | Expenses | Income switch above the list ('all', 'expense' or 'income').
const FILTERS_KEY = 'filters';
const NO_FILTERS = { month: 'all', category: 'all', type: 'all' };

function loadFilters() {
  try {
    const data = JSON.parse(localStorage.getItem(FILTERS_KEY));
    if (data && typeof data.month === 'string' && typeof data.category === 'string') {
      data.category = RENAMED_CATEGORIES[data.category] || data.category;
      if (!['all', 'expense', 'income'].includes(data.type)) data.type = 'all'; // saved before income existed
      return data;
    }
  } catch (error) {
    // ignore: we'll just show everything
  }
  return { ...NO_FILTERS };
}

function saveFilters(value) {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(value));
  } catch (error) {
    // ignore: not being able to remember a filter isn't worth an alert
  }
}

// When "All months" was last exported (a full backup), as milliseconds since 1970. null = never.
const LAST_BACKUP_KEY = 'lastBackup';

function loadLastBackup() {
  try {
    const value = Number(localStorage.getItem(LAST_BACKUP_KEY));
    return value > 0 ? value : null;
  } catch (error) {
    return null;
  }
}

function saveLastBackup(time) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(time));
  } catch (error) {
    // not being able to remember this only means the reminder may show again
  }
}

// Asks the browser to keep this app's storage even when the phone runs low on space.
// Without it, a browser may clear "unimportant" site data, and your expenses with it.
// Some browsers grant it straight away (often for installed apps), some decide by how much
// you use the app, some don't support it; in every case the app works the same.
async function askToKeepStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch (error) {
    // not supported here: nothing to do
  }
}

// The opening balance: what you had before the first entry, { amount, date }. null = not asked yet.
// Balance = opening amount + all income - all expenses.
const OPENING_KEY = 'openingBalance';

function loadOpening() {
  try {
    const data = JSON.parse(localStorage.getItem(OPENING_KEY));
    if (data && Number.isFinite(data.amount)) return { amount: data.amount, date: String(data.date || '') };
  } catch (error) {
    // broken or blocked: treat as not set
  }
  return null;
}

function saveOpening(value) {
  try {
    localStorage.setItem(OPENING_KEY, JSON.stringify(value));
  } catch (error) {
    showToast("Can't save on this browser");
  }
}

// The monthly budget: a number of pesos, or null when there's none (the key is then removed).
const BUDGET_KEY = 'budget';

function loadBudget() {
  try {
    const value = Number(localStorage.getItem(BUDGET_KEY));
    return value > 0 ? value : null; // missing, 0 or rubbish = no budget
  } catch (error) {
    return null;
  }
}

// Returns false if the browser wouldn't save it
function saveBudget(value) {
  try {
    if (value === null) localStorage.removeItem(BUDGET_KEY);
    else localStorage.setItem(BUDGET_KEY, String(value));
    return true;
  } catch (error) {
    return false;
  }
}

// ===== 3. State: the app's data =====
// Every entry looks like: { id, type, amount, category, date, note }
// type is 'expense' (money out) or 'income' (money in); amount is always positive.
// (The array is still called "expenses", and saved under the "expenses" key, from before income existed.)
// We start with whatever was saved last time.
let expenses = loadExpenses();

// Which expense the sheet is editing right now. null = it's adding a new one (or closed).
let editingId = null;

// What the screen shows. month looks like "2026-11" (the first 7 characters of a date),
// category like "Food" ("all" = every category).
let filters = loadFilters();

// The monthly budget in pesos, or null
let budget = loadBudget();

// The opening balance { amount, date }, or null when it hasn't been asked yet
let opening = loadOpening();

// ===== 4. Helpers =====

// Today's date as "YYYY-MM-DD" in YOUR time zone.
// (toISOString() uses UTC time, which could give yesterday's date in the Philippines before 8 AM.)
function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // months start at 0 in JS
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// A unique id, so we can later find the exact expense to edit or delete.
function makeId() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

// Formats a number as Philippine pesos, e.g. 10000 -> "₱10,000.00".
// Intl.NumberFormat is built into the browser, so we don't write this by hand.
const pesoFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
function formatPeso(amount) {
  return pesoFormatter.format(amount);
}

// Whole pesos, e.g. 2849.5 -> "₱2,850". Only for the big total on the lightbox;
// everywhere else keeps the centavos.
const wholePesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', maximumFractionDigits: 0,
});
function formatWholePeso(amount) {
  return wholePesoFormatter.format(amount);
}

// Rows: centavos only when there are some. 185 -> "₱185", 49.5 -> "₱49.50".
function formatRowPeso(amount) {
  return Math.round(amount * 100) % 100 === 0 ? formatWholePeso(amount) : formatPeso(amount);
}

// A money amount that can be below zero, in whole pesos: -1250 -> "−₱1,250" (a real minus sign).
// Under ₱1 keeps the centavos, so a tiny amount doesn't show as "₱0".
function formatBalance(amount) {
  const size = Math.abs(amount);
  const text = size > 0 && size < 1 ? formatPeso(size) : formatWholePeso(size);
  return amount < 0 && text !== formatWholePeso(0) ? `−${text}` : text;
}

// Money in / out with its sign: "+₱16,200", "−₱2,849", or "₱0"
function formatIn(amount) {
  return amount > 0 ? `+${formatWholePeso(amount)}` : formatWholePeso(0);
}
function formatOut(amount) {
  return amount > 0 ? `−${formatWholePeso(amount)}` : formatWholePeso(0);
}

// + for income, - for an expense
function signedAmount(entry) {
  return entry.type === 'income' ? entry.amount : -entry.amount;
}

// The balance: the opening amount plus every entry. With a month ("2026-10"): the balance at
// the end of that month (entries up to and including it). Dates are text, so "<=" compares them.
function balanceAt(monthKey) {
  const start = opening ? opening.amount : 0;
  return expenses
    .filter((e) => !monthKey || monthOf(e) <= monthKey)
    .reduce((sum, e) => sum + signedAmount(e), start);
}

// "Expense" / "Income", for labels
function typeName(entry) {
  return entry?.type === 'income' ? 'Income' : 'Expense';
}

// "Sold something" -> "sold something" (for "Income: sold something")
function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

// "2026-11-21" -> "2026-11". Because dates are YYYY-MM-DD, the month is just the first 7 characters.
function monthOf(expense) {
  return expense.date.slice(0, 7);
}

// "2026-11" -> "Nov 2026" (short names, so they fit in the dropdown on a phone)
function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
}

// "2026-10" -> "October". A month from another year than now gets the year too: "October 2025".
function monthName(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const sameYear = year === new Date().getFullYear();
  return new Date(year, month - 1, 1).toLocaleDateString('en-PH', {
    month: 'long', year: sameYear ? undefined : 'numeric',
  });
}

// "2026-10" -> "October 2026" (always with the year, for screen readers)
function monthNameWithYear(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

// The month you're in right now, e.g. "2026-11"
function currentMonth() {
  return todayString().slice(0, 7);
}

// The header over each day in the list: "Today", "Yesterday", a weekday for the rest of the
// last week ("Wednesday"), otherwise "Nov 12" (plus the year if it isn't this year).
// Built from the date's parts in local time, never new Date("YYYY-MM-DD") (that's UTC).
function dayLabel(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Math.round, because a day with a daylight-saving change isn't exactly 24 hours
  const daysAgo = Math.round((today - date) / 86400000);
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo > 1 && daysAgo < 7) return date.toLocaleDateString('en-PH', { weekday: 'long' });
  return date.toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: year === now.getFullYear() ? undefined : 'numeric',
  });
}

// "1 entry" / "3 entries"
function countLabel(n) {
  return n === 1 ? '1 entry' : `${n} entries`;
}

// Does this entry pass the filters? ("all" lets everything through)
// A picked cone is an expense category, so it only lets expenses of that category through.
function matchesFilters(entry) {
  const monthOk = filters.month === 'all' || monthOf(entry) === filters.month;
  const typeOk = filters.type === 'all' || entry.type === filters.type;
  const categoryOk = filters.category === 'all' || (entry.type === 'expense' && entry.category === filters.category);
  return monthOk && typeOk && categoryOk;
}

// The months that have at least one expense, newest first, e.g. ["2026-11", "2026-10"]
function monthsWithExpenses() {
  // A Set keeps only unique values: ["2026-11", "2026-11", "2026-10"] -> {"2026-11", "2026-10"}
  return [...new Set(expenses.map(monthOf))].sort().reverse();
}

// Fills a month dropdown with each month (and "All months" first if includeAll), and selects `selected`.
function fillMonthSelect(select, months, selected, includeAll) {
  select.innerHTML = '';
  if (includeAll) select.add(new Option('All months', 'all'));
  for (const month of months) {
    select.add(new Option(formatMonth(month), month));
  }
  select.value = selected;
}

// Rebuilds both month pickers. Runs on every render, because adding/editing/deleting can
// create or remove a month.
function updateMonthOptions() {
  const months = monthsWithExpenses();

  // The Live badge: the months with expenses, plus the current month even when it's still
  // empty (a new month starts with nothing logged). No "All months": the screen shows one month.
  const badgeMonths = months.includes(currentMonth())
    ? months
    : [currentMonth(), ...months].sort().reverse();
  // "all" (saved by an older version) or a month that's now empty: go to the current month
  if (!badgeMonths.includes(filters.month)) {
    filters.month = currentMonth();
    saveFilters(filters);
  }
  fillMonthSelect(filterMonth, badgeMonths, filters.month, false);

  // The export picker keeps "All months": keep its choice if that month still has expenses
  const exportChoice = months.includes(exportMonth.value) ? exportMonth.value : 'all';
  fillMonthSelect(exportMonth, months, exportChoice, true);
}

// The badge's visible text and look. The current month is "live" (glowing red dot);
// an earlier month is shown plainly as "Oct 2026".
function renderLiveBadge() {
  const isLive = filters.month === currentMonth();
  liveLabel.textContent = isLive ? `Live: ${formatMonthShort(filters.month)}` : formatMonth(filters.month);
  liveBadge.classList.toggle('is-past', !isLive);
  filterMonth.setAttribute('aria-label', `Month: ${monthNameWithYear(filters.month)}`);
}

// "2026-11" -> "Nov"
function formatMonthShort(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'short' });
}

// Creates an element with a CSS class and text in one line.
// It uses textContent, so user text can never become HTML.
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

// ===== 5. Render: draw the expenses array onto the page =====
function renderList() {
  list.innerHTML = ''; // clear the old list, then rebuild it from the array
  updateMonthOptions();
  renderLiveBadge();

  // This month's entries, newest first. We sort a COPY ([...expenses]) so the saved data isn't reordered.
  // Dates are "YYYY-MM-DD" text, which sorts correctly as plain text.
  // Same date? The id starts with the time it was created, so newer ids win.
  const monthEntries = [...expenses]
    .filter((e) => monthOf(e) === filters.month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  // The cones show this month's spending only (no income, no balance adjustments).
  // They're built first, because they decide whether the picked category still exists.
  renderSpeakerPanel(monthEntries.filter((e) => e.type === 'expense' && !isAdjustment(e)));
  renderLightbox();

  // The All | Expenses | Income switch shows the saved choice. (Each radio is ticked directly:
  // a <fieldset>'s .elements['list-type'] is only the FIRST radio, not the group a <form> gives.)
  for (const radio of listFilter.querySelectorAll('input[name="list-type"]')) {
    radio.checked = radio.value === filters.type;
  }

  // Keep only the entries that pass the filters. The saved data is untouched.
  const visible = monthEntries.filter(matchesFilters);

  // Group by day: one <li class="day"> per date, with a header and that day's rows.
  //   <li class="day">
  //     <h3 class="day-header"> Today ...... +₱1,200 in  −₱230 out </h3>
  //     <ul class="day-rows"> <li class="expense">...</li> ... </ul>
  //   </li>
  let dayRows = null;
  let lastDate = null;
  for (const entry of visible) {
    if (entry.date !== lastDate) {
      lastDate = entry.date;
      const sameDay = visible.filter((e) => e.date === entry.date);
      const moneyIn = sameDay.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const moneyOut = sameDay.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

      // The day's totals: only what isn't zero (the filter already hides the other type)
      const totals = makeElement('span', 'day-totals', '');
      if (moneyIn > 0) totals.append(makeElement('span', 'day-in', `+${formatRowPeso(moneyIn)} in`));
      if (moneyOut > 0) totals.append(makeElement('span', 'day-out', `−${formatRowPeso(moneyOut)} out`));

      const day = makeElement('li', 'day', '');
      const header = makeElement('h3', 'day-header', '');
      header.append(makeElement('span', 'day-label', dayLabel(entry.date)), totals);
      dayRows = makeElement('ul', 'day-rows', '');
      day.append(header, dayRows);
      list.append(day);
    }
    dayRows.append(makeExpenseRow(entry));
  }

  // Nothing to show: say why
  const name = monthName(filters.month);
  if (expenses.length === 0) {
    emptyMessage.textContent = 'Nothing logged yet. Tap Add to start.';
  } else if (filters.type === 'income') {
    emptyMessage.textContent = `No income logged in ${name}.`;
  } else if (filters.type === 'expense') {
    emptyMessage.textContent = `No expenses in ${name} yet.`;
  } else {
    emptyMessage.textContent = `Nothing logged in ${name} yet.`;
  }
  emptyMessage.hidden = visible.length > 0;

  // "Showing Bills · Clear", only while a cone is picked
  const filtered = filters.category !== 'all';
  filterText.textContent = filtered ? `Showing ${filters.category} ·` : '';
  filterClear.hidden = !filtered;

  // Nothing to export yet? Grey out the button.
  exportBtn.disabled = expenses.length === 0;

  // Adding, deleting or importing can change whether a backup is overdue
  renderBackupStatus();
}

// One row (an expense or income). The whole row is one button: tap it to edit (or delete) in the sheet.
//   <li class="expense">
//     <button class="expense-button" data-id="...">
//       <span class="expense-dot">        (expense: the category's color; income: a hollow gold ring)
//       <span class="expense-info"> title, and a second line </span>
//       <span class="expense-amount">     ("−₱185" or "+₱1,200")
//     </button>
//   </li>
function makeExpenseRow(entry) {
  const income = entry.type === 'income';
  const adjustment = isAdjustment(entry);

  const item = makeElement('li', 'expense', '');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'expense-button';
  button.dataset.id = entry.id;

  const dot = makeElement('span', 'expense-dot', '');
  if (adjustment) dot.classList.add('is-adjustment');
  else if (income) dot.classList.add('is-income');
  else dot.style.background = categoryColor(entry.category);

  // Title: the note, or (without one) the category.
  // Second line: an expense's category (under a note); "Income: salary" for income; "Adjustment".
  // textContent (inside makeElement) shows the note exactly as typed,
  // so a note like "<b>hi</b>" can't turn into real HTML.
  let second = '';
  if (adjustment) second = ADJUSTMENT;
  else if (income) second = entry.note ? `Income: ${lowerFirst(entry.category)}` : 'Income';
  else if (entry.note) second = entry.category;
  const info = makeElement('span', 'expense-info', '');
  info.append(makeElement('span', 'expense-title', entry.note || entry.category));
  if (second) info.append(makeElement('span', 'expense-meta', second));

  const amountText = `${income ? '+' : '−'}${formatRowPeso(entry.amount)}`;
  const amount = makeElement('span', 'expense-amount', amountText);
  if (adjustment) amount.classList.add('is-adjustment');
  else if (income) amount.classList.add('is-income');

  // What a screen reader says: "Income, Salary, ₱1,200, sold old sneakers, today. Edit"
  const day = dayLabel(entry.date);
  const when = day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day;
  const parts = [typeName(entry), entry.category, formatRowPeso(entry.amount)];
  if (entry.note) parts.push(entry.note);
  parts.push(when);
  button.setAttribute('aria-label', `${parts.join(', ')}. Edit`);

  button.append(dot, info, amount);

  // Behind the row: the red "Delete" that shows as you swipe the row to the left
  const swipeDelete = makeElement('span', 'swipe-delete', 'Delete');
  swipeDelete.setAttribute('aria-hidden', 'true'); // screen readers delete from the edit sheet
  item.append(swipeDelete, button);
  return item;
}

// ===== 5a. The lightbox: the balance, and the chosen month's money in and out =====

// The month the lightbox showed last time (null = not drawn yet), to spot a month switch
let lightboxMonth = null;
// The count-up in progress (an id from requestAnimationFrame), so a new one can stop it
let countUpFrame = 0;

// The balance rolls from ₱0 to `target` in half a second, fast at first and easing into place.
// requestAnimationFrame runs the step once per screen refresh.
function countUp(target) {
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / 500, 1);
    const eased = 1 - (1 - progress) ** 3; // ease-out: quick start, gentle landing
    totalEl.textContent = progress < 1 ? formatBalance(Math.round(target * eased)) : formatBalance(target);
    if (progress < 1) countUpFrame = requestAnimationFrame(step);
  };
  totalEl.textContent = formatWholePeso(0);
  countUpFrame = requestAnimationFrame(step);
}

// The big number is the balance (all time; for an earlier month, at the end of that month).
// Under it: the month's money in and out, and with a budget, a bar and what's left of it.
// Adjustments are left out of "Earned / Spent" and the budget (they aren't real spending).
function renderLightbox() {
  const month = filters.month;
  const isCurrent = month === currentMonth();
  const name = monthName(month);
  const monthEntries = expenses.filter((e) => monthOf(e) === month && !isAdjustment(e));
  const earned = monthEntries.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const spent = monthEntries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const balance = isCurrent ? balanceAt(null) : balanceAt(month);

  totalLabel.textContent = isCurrent ? 'Balance' : `Balance at end of ${name}`;
  earnedLabel.textContent = isCurrent ? 'Earned this month' : `Earned in ${name}`;
  spentLabel.textContent = isCurrent ? 'Spent this month' : `Spent in ${name}`;
  earnedEl.textContent = formatIn(earned);
  spentEl.textContent = formatOut(spent);

  // The final number first, so fitTotal() picks the font size for it (the count-up then
  // never changes the size mid-way)
  cancelAnimationFrame(countUpFrame);
  totalEl.textContent = formatBalance(balance);
  fitTotal();
  // Switched to another month: the balance counts up to its new value. Not when the app
  // opens (you want the number straight away) and not with Reduce Motion on.
  const switched = lightboxMonth !== null && lightboxMonth !== month;
  lightboxMonth = month;
  if (switched && Math.abs(balance) >= 1 && !prefersReducedMotion()) countUp(balance);

  // Budget: always in pesos. Over budget stays calm: same dark ink, no red.
  budgetBox.hidden = budget === null;
  if (budget !== null) {
    const used = Math.min(spent / budget, 1); // the bar never goes past full
    budgetFill.style.width = `${used * 100}%`;
    budgetOf.textContent = `Budget ${formatWholePeso(budget)}`;
    const left = Math.round(budget) - Math.round(spent);
    budgetLeft.textContent = left >= 0 ? `${formatWholePeso(left)} left` : `${formatWholePeso(-left)} over`;
  }
}

// A huge total (₱1,250,000) must still fit on the lightbox: if it's wider than the box,
// step the font down 64 -> 52 -> 40px. Measured after the text is set.
function fitTotal() {
  const box = totalEl.parentElement;
  for (const size of ['', 'is-medium', 'is-small']) {
    box.classList.remove('is-medium', 'is-small');
    if (size) box.classList.add(size);
    if (box.scrollWidth <= box.clientWidth) return;
  }
}

// ===== 5b. The speaker panel: the month's biggest categories as "speaker cones" =====

// Each category's color lives in style.css as a variable, e.g. --cat-food.
// This turns "Food" into "var(--cat-food)" and "Nights out" into "var(--cat-nights-out)"
// (spaces become dashes, because a CSS name can't contain a space).
// Unknown categories fall back to the "Other" color.
function categoryColor(category) {
  return `var(--cat-${category.toLowerCase().replace(/\s+/g, '-')}, var(--cat-other))`;
}

// The categories in their usual order (the order of the chips)
function categoryOrder() {
  return CATEGORIES;
}

// Adds up amounts into groups. Example: sumBy(expenses, (e) => e.category)
//   -> Map { "Food" => 850, "Bills" => 1250 }
// A Map is like an object made for "key -> value" lookups.
function sumBy(items, getKey) {
  const totals = new Map();
  for (const item of items) {
    const key = getKey(item);
    totals.set(key, (totals.get(key) || 0) + item.amount);
  }
  return totals;
}

// Whole percents that always add up to exactly 100 ("largest remainder"):
// round everything down, then give the leftover points to the biggest fractions.
// [44.4, 32.3, 23.3] -> [44, 32, 24]
function percentsSummingTo100(amounts) {
  const total = amounts.reduce((sum, a) => sum + a, 0);
  const exact = amounts.map((a) => (a / total) * 100);
  const result = exact.map(Math.floor);
  let leftover = 100 - result.reduce((sum, p) => sum + p, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (leftover === 0) break;
    result[index]++;
    leftover--;
  }
  return result;
}

// Up to 4 cones (expenses only): with 4 or fewer categories, one cone each; with more, the top 3 + "Rest".
// A cone is a button that shows only that category in the list ("Rest" isn't a button).
function renderSpeakerPanel(monthExpenses) {
  cones.innerHTML = '';
  speakerPanel.hidden = monthExpenses.length === 0;

  const totals = sumBy(monthExpenses, (e) => e.category);
  // Biggest first; equal amounts keep the form's order, so the cones don't jump around
  const order = categoryOrder();
  const sorted = [...totals.keys()].sort(
    (a, b) => totals.get(b) - totals.get(a) || order.indexOf(a) - order.indexOf(b)
  );

  let slots = sorted.map((category) => ({ category, amount: totals.get(category) }));
  if (slots.length > 4) {
    const rest = slots.slice(3).reduce((sum, s) => sum + s.amount, 0);
    slots = [...slots.slice(0, 3), { category: null, amount: rest }];
  }

  // The picked category has no cone in this month (e.g. you switched months): show everything
  if (filters.category !== 'all' && !slots.some((s) => s.category === filters.category)) {
    filters.category = 'all';
    saveFilters(filters);
  }

  const percents = slots.length ? percentsSummingTo100(slots.map((s) => s.amount)) : [];
  slots.forEach((slot, i) => {
    const percent = percents[i];
    const name = slot.category ?? 'Rest';
    // A real but tiny share would round to "0%", which looks like nothing was spent
    const percentText = percent === 0 ? '<1%' : `${percent}%`;
    const percentSpoken = percent === 0 ? 'less than 1 percent' : `${percent} percent`;

    const cone = document.createElement(slot.category ? 'button' : 'div');
    cone.className = 'cone';
    if (slot.category) {
      const picked = filters.category === slot.category;
      cone.type = 'button';
      cone.dataset.category = slot.category;
      cone.setAttribute('aria-pressed', String(picked));
      cone.setAttribute('aria-label', picked
        ? `${name}, ${percentSpoken}. Showing only ${name}`
        : `${name}, ${percentSpoken}. Show only ${name}`);
    } else {
      cone.setAttribute('role', 'img');
      cone.setAttribute('aria-label', `Rest, ${percentSpoken}`);
    }

    // The gold ring is a conic-gradient: gold from 0 to the percent, dark track after it.
    // The --p variable carries the percent into the CSS.
    const ring = makeElement('span', 'cone-ring', '');
    ring.style.setProperty('--p', `${percent}%`);
    const cap = makeElement('span', 'cone-cap', percentText);
    ring.append(cap);
    ring.setAttribute('aria-hidden', 'true');

    const label = makeElement('span', 'cone-label', name);
    label.setAttribute('aria-hidden', 'true');

    cone.append(ring, label);
    cones.append(cone);
  });
}

// ===== 5c. Backup: export to a CSV file =====
// CSV = "comma-separated values": a plain text table, one row per line, cells split by commas.
// Excel and Google Sheets open it as a spreadsheet. Our file looks like:
//   date,type,category,amount,note,id
//   2026-10-01,opening,,2500.00,,
//   2026-10-15,expense,Food,850.00,davids teahouse,1795202170826-wxrf
//   2026-10-16,income,Salary,16200.00,,1795202170900-abcd
// The id column lets the import step (next) recognise entries it already has.
// The "opening" row (full backups only) carries the opening balance, so a backup restores it too.

const CSV_COLUMNS = ['date', 'type', 'category', 'amount', 'note', 'id'];

// Makes one value safe to put in a CSV cell.
function csvCell(value) {
  let text = String(value);

  // Spreadsheet safety: a cell starting with = + - or @ is treated as a FORMULA by Excel,
  // so a note like "=HYPERLINK(...)" could run when the file is opened ("CSV injection").
  // A leading ' tells the spreadsheet "this is just text". Import will remove it again.
  if (/^[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  // A comma, quote or line break inside the text would break the columns,
  // so wrap the cell in quotes and double any quotes inside: He said "hi" -> "He said ""hi"""
  if (/[",\r\n]/.test(text)) {
    text = '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

// withOpening: add the opening-balance row first (for a full backup)
function expensesToCsv(list, withOpening) {
  // Oldest first: spreadsheets usually read top-to-bottom in time order
  const rows = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const lines = [CSV_COLUMNS.join(',')]; // the header row
  // The amount is a plain number with 2 decimals (no ₱, no commas) so spreadsheets can add it up.
  // It skips csvCell: it's a number we wrote ourselves, and csvCell would put a ' before a minus.
  if (withOpening && opening) {
    lines.push([csvCell(opening.date), 'opening', '', opening.amount.toFixed(2), '', ''].join(','));
  }
  for (const e of rows) {
    lines.push([csvCell(e.date), csvCell(e.type), csvCell(e.category), e.amount.toFixed(2),
      csvCell(e.note), csvCell(e.id)].join(','));
  }
  // \r\n line endings are what Excel expects
  return lines.join('\r\n') + '\r\n';
}

// Hands a text file to the browser as a download, without any server:
// 1. wrap the text in a Blob (a file that only exists in memory),
// 2. give it a temporary URL, 3. "click" an invisible link to it, 4. clean up.
function downloadTextFile(fileName, text, mimeType) {
  // ﻿ (a "byte order mark") at the start tells Excel the file is UTF-8,
  // so characters like ñ or ₱ in notes don't turn into gibberish.
  const blob = new Blob(['﻿' + text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName; // the "download" attribute = save it instead of opening it
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // free the memory a moment later
}

function exportCsv() {
  const month = exportMonth.value; // "all" or e.g. "2026-11"
  const toExport = month === 'all' ? expenses : expenses.filter((e) => monthOf(e) === month);
  if (toExport.length === 0) return;

  // File name says what's inside: a full backup is dated today, a single month is named after the month
  const fileName = month === 'all' ? `expenses-${todayString()}.csv` : `expenses-${month}.csv`;
  downloadTextFile(fileName, expensesToCsv(toExport, month === 'all'), 'text/csv;charset=utf-8');

  const which = month === 'all' ? 'all months' : formatMonth(month);
  backupStatus.textContent = `Exported ${countLabel(toExport.length)} (${which}) to ${fileName}.`;

  // Only a full export counts as a backup (one month alone wouldn't bring everything back)
  if (month === 'all') {
    saveLastBackup(Date.now());
    renderBackupStatus();
  }
}

// ===== 5e. Backup reminder =====
// A backup is "overdue" when there are expenses the last full export doesn't have, and it's
// been 14 days or more: since that export, or (never backed up) since the first expense.
// An expense's id starts with the time it was created (see makeId), which tells us which
// expenses are newer than the backup.
const BACKUP_REMINDER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function createdTime(expense) {
  const time = parseInt(expense.id, 10);
  return Number.isFinite(time) && time > 0 ? time : null; // ids from some imports aren't times
}

// "today", "yesterday", "5 days ago"
function daysAgoText(time) {
  const days = Math.floor((Date.now() - time) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function backupState() {
  const last = loadLastBackup();
  // Expenses the last backup doesn't have (all of them if there's never been one)
  const unsaved = expenses.filter((e) => {
    const time = createdTime(e);
    return last === null || (time !== null && time > last);
  }).length;
  // Since when: the last backup, or else the oldest expense
  const times = expenses.map(createdTime).filter((t) => t !== null);
  const since = last ?? (times.length ? Math.min(...times) : Date.now());
  const overdue = unsaved > 0 && Date.now() - since >= BACKUP_REMINDER_DAYS * DAY_MS;
  return { last, unsaved, overdue };
}

// Draws both places that talk about backups: the reminder above "Backup & settings"
// (only when overdue) and the "Last backup" line in the settings sheet (always)
function renderBackupStatus() {
  const { last, unsaved, overdue } = backupState();

  backupReminder.hidden = !overdue;
  if (overdue) {
    const newOnes = unsaved === 1 ? '1 new entry' : `${unsaved} new entries`;
    backupReminder.textContent = last === null
      ? `Not backed up yet · ${countLabel(expenses.length)}`
      : `Last backup ${daysAgoText(last)} · ${newOnes}`;
  }

  if (last === null) {
    backupLastLine('Not backed up yet', overdue);
  } else {
    const date = new Date(last).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    backupLastLine(`Last backup: ${date} (${daysAgoText(last)})`, overdue);
  }
}

function backupLastLine(text, overdue) {
  backupLast.textContent = text;
  backupLast.classList.toggle('overdue', overdue);
}

// ===== 5d. Backup: import from a CSV file =====
// The file could come from anywhere (an old backup, a sheet you edited by hand),
// so every row is CHECKED before anything is saved. Nothing changes until you choose
// "Add new expenses" or "Replace all" in the preview.

const MAX_IMPORT_BYTES = 1_000_000; // 1 MB is many thousands of expenses; anything bigger is probably the wrong file

// What was read from the chosen file, waiting for your decision. null = nothing pending.
let pendingImport = null;

// Splits CSV text into rows of cells, following the same quoting rules the export uses:
// a cell in "quotes" may contain commas and line breaks, and "" inside quotes means one ".
// We go through the text one character at a time, remembering whether we're inside quotes.
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // drop the byte order mark

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } // "" -> "
      else if (ch === '"') inQuotes = false;                       // closing quote
      else cell += ch;                                             // anything else, even , or a line break
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell); cell = '';                                   // end of a cell
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;                // treat \r\n as one line break
      row.push(cell); rows.push(row); row = []; cell = '';         // end of a row
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); } // last row without a final line break
  return rows;
}

// Accepts "2026-10-15" (our export) and "10/15/2026" (how Excel often re-saves dates: month/day/year).
// Returns "YYYY-MM-DD", or null if it isn't a real date (e.g. 2026-02-30).
function parseImportDate(value) {
  const text = value.trim();
  let year, month, day, match;
  if ((match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
    [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    return null;
  }
  // new Date() quietly "fixes" impossible dates (Feb 30 -> Mar 2), so check it didn't change
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// The opening-balance row's amount: like below, but 0 and below zero are fine ("-350.00")
function parseImportSignedAmount(value) {
  const text = value.trim().replace(/^'/, '');
  const negative = /^[-−]/.test(text);
  const cleaned = text.replace(/^[-−]/, '').replace(/^\s*PHP/i, '').replace(/[₱,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const amount = Math.round(Number(cleaned) * 100) / 100;
  return negative ? -amount : amount;
}

// Accepts "1200.50", "1,200.50", "₱1,200.50" or "PHP 1200". Returns a number > 0, or null.
function parseImportAmount(value) {
  const cleaned = value.replace(/^\s*PHP/i, '').replace(/[₱,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const amount = Math.round(Number(cleaned) * 100) / 100;
  return amount > 0 ? amount : null;
}

// Reads the chosen file and checks every row. Never saves anything itself.
async function readImportFile(file) {
  if (file.size > MAX_IMPORT_BYTES) {
    return { fileName: file.name, items: [], problems: ['This file is too big (over 1 MB). Is it the right file?'] };
  }

  const text = await file.text();
  const rows = parseCsv(text).filter((cells) => cells.some((c) => c.trim() !== '')); // skip blank lines
  if (rows.length === 0) {
    return { fileName: file.name, items: [], problems: ['The file is empty.'] };
  }

  // Find columns by their NAME in the first row, so a sheet with columns moved around still works
  const header = rows[0].map((name) => name.trim().toLowerCase());
  const col = {};
  for (const name of CSV_COLUMNS) col[name] = header.indexOf(name); // -1 = column not there
  const missing = ['date', 'category', 'amount'].filter((name) => col[name] === -1);
  if (missing.length > 0) {
    return {
      fileName: file.name,
      items: [],
      problems: [`Missing column(s): ${missing.join(', ')}. The first row must name the columns: date, type, category, amount, note.`],
    };
  }

  const items = [];
  const problems = [];
  const seenIds = new Set();
  let otherCount = 0;
  let fileOpening = null; // the "opening" row, if the file has one

  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2; // +2 because the header is row 1, like in a spreadsheet
    const cell = (name) => (col[name] === -1 ? '' : cells[col[name]] ?? '');

    const date = parseImportDate(cell('date'));
    if (!date) { problems.push(`Row ${rowNumber}: "${cell('date')}" is not a valid date.`); return; }

    // The type: no column, or an empty cell, means expense (older backups). Any upper/lower case.
    const typeText = cell('type').trim().toLowerCase();
    if (typeText === 'opening') {
      const value = parseImportSignedAmount(cell('amount'));
      if (value === null) { problems.push(`Row ${rowNumber}: "${cell('amount')}" is not a valid opening balance.`); return; }
      fileOpening = { amount: value, date };
      return;
    }
    const type = typeText === '' ? 'expense' : typeText;
    if (type !== 'expense' && type !== 'income') {
      problems.push(`Row ${rowNumber}: "${cell('type')}" should be expense or income.`);
      return;
    }

    const amount = parseImportAmount(cell('amount'));
    if (amount === null) { problems.push(`Row ${rowNumber}: "${cell('amount')}" is not a valid amount.`); return; }

    // Match the category of that type, ignoring upper/lower case; unknown ones go under "Other".
    // Old backups say "Entertainment": use its new name first, so it isn't filed under Other.
    let wanted = cell('category').trim().toLowerCase();
    for (const [oldName, newName] of Object.entries(RENAMED_CATEGORIES)) {
      if (wanted === oldName.toLowerCase()) wanted = newName.toLowerCase();
    }
    let category = [...categoriesFor(type), ADJUSTMENT].find((c) => c.toLowerCase() === wanted);
    if (!category) { category = 'Other'; otherCount++; }

    // Undo the export's formula protection ('=... -> =...), tidy up, and respect the 200-character limit
    let note = cell('note');
    if (/^'[=+\-@]/.test(note)) note = note.slice(1);
    note = note.trim().slice(0, noteInput.maxLength);

    // Keep the id from the file if it looks like one of ours, otherwise make a new one
    let id = cell('id').trim();
    if (!/^[\w-]{1,40}$/.test(id)) id = makeId();
    if (seenIds.has(id)) { problems.push(`Row ${rowNumber}: same id as an earlier row, skipped.`); return; }
    seenIds.add(id);

    items.push({ id, type, amount, category, date, note });
  });

  return { fileName: file.name, items, problems, otherCount, opening: fileOpening };
}

// Shows what was found in the file and the choices
function showImportPreview(result) {
  pendingImport = result;
  importPreview.hidden = false;
  backupStatus.textContent = '';

  const existingIds = new Set(expenses.map((e) => e.id));
  const newCount = result.items.filter((e) => !existingIds.has(e.id)).length;
  const alreadyCount = result.items.length - newCount;

  if (result.items.length === 0 && !result.opening) {
    importSummary.textContent = `Couldn't import anything from ${result.fileName}.`;
  } else {
    let summary = `${result.fileName}: found ${countLabel(result.items.length)} ` +
      `(${newCount} new, ${alreadyCount} already in the app).`;
    if (result.otherCount > 0) summary += ` ${result.otherCount} with an unknown category will be filed under Other.`;
    if (result.opening) summary += ' It also has an opening balance, which "Replace all" restores.';
    if (expenses.length > 0) summary += ` "Replace all" deletes your current ${countLabel(expenses.length)} first.`;
    importSummary.textContent = summary;
  }

  // List the problems (at most 5, so a badly broken file doesn't fill the screen)
  importProblems.innerHTML = '';
  for (const problem of result.problems.slice(0, 5)) {
    importProblems.append(makeElement('li', '', problem));
  }
  if (result.problems.length > 5) {
    importProblems.append(makeElement('li', '', `…and ${result.problems.length - 5} more rows skipped.`));
  }

  // Only offer the choices that make sense
  importMergeBtn.hidden = result.items.length === 0;
  importMergeBtn.disabled = newCount === 0;
  importMergeBtn.textContent = newCount === 0 ? 'Nothing new to add' : `Add ${newCount} new`;
  importReplaceBtn.hidden = result.items.length === 0 && !result.opening;
  importReplaceBtn.textContent = 'Replace all';
  importReplaceBtn.className = 'btn btn-danger';
  replaceArmed = false;
  importCancelBtn.textContent = result.items.length === 0 ? 'Close' : 'Cancel';
}

// "Replace all" deletes your current expenses, so (like Delete) it needs a second click
let replaceArmed = false;

function onReplaceClick() {
  if (!replaceArmed && expenses.length > 0) {
    replaceArmed = true;
    importReplaceBtn.textContent = `Yes, replace my ${countLabel(expenses.length)}`;
    importReplaceBtn.className = 'btn btn-danger-solid';
    return;
  }
  applyImport('replace');
}

function closeImportPreview() {
  pendingImport = null;
  importPreview.hidden = true;
  importFile.value = ''; // so picking the same file again still triggers "change"
}

// mode: "merge" = keep everything you have and add the entries that are new;
//       "replace" = throw away what you have and use exactly what's in the file.
function applyImport(mode) {
  if (!pendingImport) return;
  const { items } = pendingImport;
  let message;

  if (mode === 'merge') {
    const existingIds = new Set(expenses.map((e) => e.id));
    const newOnes = items.filter((e) => !existingIds.has(e.id));
    expenses = expenses.concat(newOnes);
    message = `Added ${countLabel(newOnes.length)} from the file.`;
  } else {
    expenses = items;
    message = `Replaced your entries with the ${countLabel(items.length)} from the file.`;
    // A full backup brings its opening balance back too
    if (pendingImport.opening) {
      opening = pendingImport.opening;
      saveOpening(opening);
    }
  }

  saveExpenses(expenses); // same pattern as always: change, save, redraw
  renderList();
  closeImportPreview();
  backupStatus.textContent = message;
}

// ===== 6. Actions =====
function addExpense(expense) {
  expenses.push(expense);
  saveExpenses(expenses); // save every time the data changes
  renderList();
}

function updateExpense(id, changes) {
  // map() makes a NEW array: the matching expense is replaced by an updated
  // copy ({...old, ...changes} = old fields, overwritten by the changed ones)
  expenses = expenses.map((e) => (e.id === id ? { ...e, ...changes } : e));
  saveExpenses(expenses); // same pattern: change, save, redraw
  renderList();
}

// The expense deleted most recently, so the toast's Undo can bring it back. null = nothing to undo.
let lastDeleted = null;

function deleteExpense(id) {
  lastDeleted = expenses.find((e) => e.id === id) || null;
  // filter() makes a NEW array that keeps every expense EXCEPT this one
  expenses = expenses.filter((e) => e.id !== id);
  saveExpenses(expenses);
  renderList();
}

function undoDelete() {
  if (!lastDeleted) return;
  // Only put it back if it isn't there already (e.g. Undo tapped twice)
  if (!expenses.some((e) => e.id === lastDeleted.id)) {
    expenses.push(lastDeleted);
    // Show the month it belongs to, so you can see it came back
    filters.month = monthOf(lastDeleted);
    saveFilters(filters);
    saveExpenses(expenses);
    renderList();
  }
  const restored = typeName(lastDeleted);
  lastDeleted = null;
  showToast(`${restored} restored`);
}

// ===== 6b. The add / edit sheet =====

// Today and yesterday as "YYYY-MM-DD", in your time zone (like todayString)
function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1); // setDate handles month and year changes (Mar 1 -> Feb 28)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The type the sheet is set to ('expense' or 'income'), and each type's last picked chip
let sheetType = 'expense';
const lastPicked = { expense: 'Food', income: 'Allowance' };
// Editing an "Adjustment" entry: there's no chip for it, so it keeps that category unless you pick one
let editingAdjustment = false;

// Builds the category chips for a type (again every time the type changes):
//   <input type="radio" name="category" id="cat-expense-food" value="Food" class="visually-hidden">
//   <label for="cat-expense-food" class="chip">Food</label>
function buildCategoryChips(type) {
  categoryChips.innerHTML = '';
  for (const category of categoriesFor(type)) {
    const id = `cat-${type}-${category.toLowerCase().replace(/\s+/g, '-')}`;
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'category';
    radio.id = id;
    radio.value = category;
    radio.className = 'visually-hidden';
    const label = makeElement('label', 'chip', category);
    label.htmlFor = id;
    categoryChips.append(radio, label);
  }
}

// Sets the sheet to Expense or Income: the chips, the ₱ / +₱ in front of the amount, the title,
// the buttons. The amount, date and note stay as they are.
function setSheetType(type, category) {
  sheetType = type;
  form.elements.type.value = type;
  buildCategoryChips(type);
  const pick = category ?? lastPicked[type];
  if (pick && categoriesFor(type).includes(pick)) form.elements.category.value = pick;
  amountPrefix.textContent = type === 'income' ? '+₱' : '₱';
  updateSheetTexts();
  fitAmount();
}

function updateSheetTexts() {
  const income = sheetType === 'income';
  if (editingId) {
    sheetTitle.textContent = income ? 'Edit income' : 'Edit expense';
    submitBtn.textContent = 'Save changes';
  } else {
    sheetTitle.textContent = income ? 'New income' : 'New expense';
    submitBtn.textContent = income ? 'Save income' : 'Save expense';
  }
  deleteBtn.textContent = income ? 'Delete income' : 'Delete expense';
  deleteQuestion.textContent = income ? 'Delete this income?' : 'Delete this expense?';
}

// Ticks the When chip that matches a date: Today, Yesterday, or Pick a date (and shows the picker)
function setWhen(dateString) {
  dateInput.value = dateString;
  let which = 'pick';
  if (dateString === todayString()) which = 'today';
  else if (dateString === yesterdayString()) which = 'yesterday';
  form.elements.when.value = which;
  dateInput.hidden = which !== 'pick';
}

// "45 / 200" under the note: only shown from 180 characters on, red from 190.
// noteInput.maxLength reads the maxlength="200" from the HTML, so the number lives in one place.
function updateNoteCount() {
  const used = noteInput.value.length;
  const max = noteInput.maxLength;
  noteCount.textContent = `${used} / ${max}`;
  noteCount.hidden = used < max - 20;
  noteCount.classList.toggle('near-limit', used >= max - 10);
}

// Accepts "185", "49.50", "1,250" or ".5": a number above 0 with at most 2 decimals.
// Returns the amount, or null if it isn't one.
function parseAmount(text) {
  const cleaned = text.replace(/[₱,\s]/g, '');
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(cleaned)) return null;
  const amount = Math.round(Number(cleaned) * 100) / 100;
  return amount >= 0.01 ? amount : null;
}

function showAmountError(show) {
  amountError.hidden = !show;
  amountField.classList.toggle('invalid', show);
  amountInput.setAttribute('aria-invalid', String(show));
}

// Delete -> "Delete this expense? [Yes, delete] [Cancel]" (and back)
function showDeleteConfirm(show) {
  deleteBtn.hidden = show;
  deleteConfirm.hidden = !show;
  // Focus the safe choice, so pressing Enter by accident deletes nothing
  (show ? deleteNo : deleteBtn).focus();
}

// The button that opened the sheet, so focus can go back to it when the sheet closes
let sheetOpener = null;

// Opens the sheet. With an id: edit that entry. Without: a new one (an expense, or income
// when the list is showing Income).
function openSheet(id) {
  const expense = id ? expenses.find((e) => e.id === id) : null;
  editingId = expense ? expense.id : null;
  editingAdjustment = Boolean(expense && isAdjustment(expense));
  sheetOpener = expense ? { rowId: expense.id } : { button: addBtn };

  form.reset();
  showAmountError(false);
  deleteConfirm.hidden = true;
  deleteBtn.hidden = false;
  deleteArea.hidden = !expense;

  if (expense) {
    amountInput.value = String(expense.amount);
    // An adjustment has no chip (none is ticked); any other category that isn't a chip -> Other
    const known = categoriesFor(expense.type).includes(expense.category);
    setSheetType(expense.type, known ? expense.category : (editingAdjustment ? null : 'Other'));
    if (editingAdjustment) {
      for (const radio of categoryChips.querySelectorAll('input')) radio.checked = false;
    }
    setWhen(expense.date);
    noteInput.value = expense.note;
  } else {
    setSheetType(filters.type === 'income' ? 'income' : 'expense');
    setWhen(todayString());
  }
  updateNoteCount();

  showSheet(sheet);
  fitAmount(); // measured now that the sheet is on screen (a long amount when editing)
  sheet.querySelector('.sheet-scroll').scrollTop = 0;
  // A new expense starts with the number keyboard up. (Editing doesn't: you may only
  // want to change the category, and the keyboard would cover the sheet.)
  // Editing focuses the sheet itself: screen readers start at its title, and no focus ring
  // appears on the × (which is what the browser would pick on its own).
  if (expense) sheet.focus();
  else amountInput.focus();
}

function closeSheet() {
  dismissSheet(sheet); // slides down, then closes; the "close" listener below tidies up
}

// ===== 6c. Toast: a short message above the Add button =====
let toastTimer = null;

// showToast('Expense saved') or showToast('Expense deleted', { undo: true })
function showToast(message, { undo = false } = {}) {
  toastText.textContent = message;
  toastUndo.hidden = !undo;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  // 3 seconds to read it; 5 when there's an Undo to reach for
  toastTimer = setTimeout(hideToast, undo ? 5000 : 3000);
}

function hideToast() {
  toast.classList.remove('show');
  toastUndo.hidden = true;
}

// ===== 6d. Sheets: slide in, slide out, and drag down to close =====
// Both sheets (add / edit, and Backup & settings) work the same way:
// - they slide up when they open and slide down when they close;
// - you can drag one down to close it: by its top (the handle and title) any time, or by its
//   content when that's scrolled to the top. While your finger is down the sheet follows it
//   exactly, and the dimmed page behind fades with it. When you let go, a long enough drag
//   or a quick flick closes it; otherwise it slides back;
// - a sheet that's sliding can be caught with your finger mid-way.
// The animations use the Web Animations API (element.animate): smooth like CSS, controlled from JS.

// The iOS sheet curve: very steep at the start, then a gentle settle
const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SHEET_DIM = 0.7; // how dark the page behind gets (0 = not at all, 1 = black)

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function sheetPanel(dialog) {
  return dialog.querySelector('.sheet-panel');
}

// The darkness behind the sheet. amount: 1 = fully dimmed, 0 = not dimmed.
function dimColor(amount) {
  return `rgba(12, 9, 8, ${(SHEET_DIM * Math.min(Math.max(amount, 0), 1)).toFixed(3)})`;
}

// Where the panel is right now, in px below its resting place (works mid-animation too)
function currentSheetY(dialog) {
  const transform = getComputedStyle(sheetPanel(dialog)).transform;
  return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
}

// Puts the panel at y px below its resting place, with the dim to match (no animation)
function setSheetY(dialog, y) {
  const panel = sheetPanel(dialog);
  panel.style.transform = `translateY(${y}px)`;
  dialog.style.backgroundColor = dimColor(1 - y / panel.offsetHeight);
}

// Stops any slide in progress and holds the sheet exactly where it is. Returns that y.
function holdSheet(dialog) {
  const y = currentSheetY(dialog);
  for (const animation of [...sheetPanel(dialog).getAnimations(), ...dialog.getAnimations()]) {
    animation.cancel();
  }
  delete dialog.dataset.closing; // caught while closing: it isn't closing any more
  setSheetY(dialog, y);
  return y;
}

// Slides the sheet from wherever it is to y, then calls onDone (if it wasn't interrupted)
function slideSheet(dialog, y, duration, onDone) {
  const panel = sheetPanel(dialog);
  const fromY = currentSheetY(dialog);
  const fromColor = getComputedStyle(dialog).backgroundColor;
  holdSheet(dialog);
  setSheetY(dialog, y); // the end state; the animation below plays the way there
  if (prefersReducedMotion() || duration <= 0) {
    onDone?.();
    return;
  }
  const options = { duration, easing: SHEET_EASE };
  const slide = panel.animate(
    [{ transform: `translateY(${fromY}px)` }, { transform: `translateY(${y}px)` }], options
  );
  dialog.animate([{ backgroundColor: fromColor }, { backgroundColor: dialog.style.backgroundColor }], options);
  // onfinish doesn't run if the slide is cancelled (caught by a finger, or reopened)
  if (onDone) slide.onfinish = onDone;
}

// Opens a sheet: it slides up from below the screen
function showSheet(dialog) {
  if (!dialog.open) {
    dialog.showModal();
    setSheetY(dialog, sheetPanel(dialog).offsetHeight); // start just below the screen
  }
  slideSheet(dialog, 0, 280);
}

// Closes a sheet: it slides down, and THEN the dialog really closes. duration is shorter after
// a fast flick, so the sheet leaves at the speed your finger threw it.
function dismissSheet(dialog, duration = 200) {
  if (!dialog.open || dialog.dataset.closing) return;
  dialog.dataset.closing = 'true';
  slideSheet(dialog, sheetPanel(dialog).offsetHeight, duration, () => dialog.close());
}

// Dragging up past the top: the sheet moves less and less the further you pull (a rubber band),
// instead of stopping dead
function rubberBand(distance) {
  return 12 * Math.log1p(distance / 12);
}

function setupSheet(dialog) {
  const panel = sheetPanel(dialog);
  const scroller = dialog.querySelector('.sheet-scroll');
  let drag = null; // the touch in progress, or null

  // Esc: slide away instead of vanishing
  dialog.addEventListener('cancel', function (event) {
    event.preventDefault();
    dismissSheet(dialog);
  });

  // A tap on the dimmed area (the see-through part of the dialog) closes it
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dismissSheet(dialog);
  });

  // However it closed, clear the leftover position so it opens fresh next time
  dialog.addEventListener('close', function () {
    delete dialog.dataset.closing;
    panel.style.transform = '';
    dialog.style.backgroundColor = '';
  });

  // Touch events (not pointer events): they let us stop the content from scrolling
  // with preventDefault() once we decide the finger is dragging the sheet instead.
  panel.addEventListener('touchstart', function (event) {
    if (event.touches.length !== 1) {
      // A second finger: ignore it, keep following the first one (no jumping)
      if (drag && drag.mode !== 'dragging') drag = null;
      return;
    }
    const touch = event.touches[0];
    drag = {
      mode: 'deciding',              // 'deciding' -> 'dragging' or 'ignored'
      startX: touch.clientX,
      startY: touch.clientY,
      onContent: scroller.contains(event.target),
      contentAtTop: scroller.scrollTop <= 0,
      fromY: 0,
      samples: [{ y: touch.clientY, time: event.timeStamp }],
    };
    // A sheet caught mid-slide: hold it right where the finger landed
    if (panel.getAnimations().length) {
      drag.mode = 'dragging';
      drag.fromY = holdSheet(dialog);
    }
  }, { passive: true });

  panel.addEventListener('touchmove', function (event) {
    if (!drag || drag.mode === 'ignored') return;
    const touch = event.touches[0];
    const dy = touch.clientY - drag.startY;
    const dx = touch.clientX - drag.startX;

    if (drag.mode === 'deciding') {
      if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return; // too small to tell yet
      const downwards = Math.abs(dy) > Math.abs(dx) && dy > 0;
      // On the top part: any vertical drag moves the sheet. On the content: only a drag down
      // while it's scrolled to the top (otherwise the content scrolls, as normal).
      const vertical = Math.abs(dy) > Math.abs(dx);
      const takeIt = drag.onContent ? downwards && drag.contentAtTop && scroller.scrollTop <= 0 : vertical;
      if (!takeIt) {
        drag.mode = 'ignored';
        return;
      }
      drag.mode = 'dragging';
      drag.fromY = holdSheet(dialog);
      drag.startY = touch.clientY; // follow the finger from here, 1:1
    }

    // Dragging: the sheet IS the finger. preventDefault stops the content scrolling along.
    event.preventDefault();
    let y = drag.fromY + (touch.clientY - drag.startY);
    if (y < 0) y = -rubberBand(-y);
    setSheetY(dialog, y);

    // Remember the last 100ms of movement, to know how fast the finger was going at the end
    drag.samples.push({ y: touch.clientY, time: event.timeStamp });
    while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].time > 100) drag.samples.shift();
  }, { passive: false });

  function release() {
    if (!drag || drag.mode !== 'dragging') {
      drag = null;
      return;
    }
    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const velocity = (last.y - first.y) / Math.max(last.time - first.time, 1); // px per ms, + = down
    drag = null;

    const y = currentSheetY(dialog);
    const height = panel.offsetHeight;
    // Close on distance (a third of the way down) OR on a quick flick down
    if (y > height / 3 || (velocity > 0.3 && y > 0)) {
      // Leave at the finger's speed: a fast flick closes faster
      const duration = Math.min(Math.max((height - y) / Math.max(velocity, 0.8), 120), 260);
      dismissSheet(dialog, duration);
    } else {
      slideSheet(dialog, 0, 240); // not far enough: slide back up, quickly
    }
  }

  panel.addEventListener('touchend', release);
  panel.addEventListener('touchcancel', release);
}

// ===== 6e. Swipe a row to the left to delete it =====
// The row follows your finger sideways, uncovering a red "Delete" behind it. Let go past 40%
// of the row (or flick it left) and it slides away and is deleted, with the same Undo toast
// as deleting from the sheet. Otherwise it slides back. Up-and-down still scrolls the page:
// the swipe only starts when the finger clearly moves sideways, to the left.

// Where a row is right now, in px left (-) or right (+) of its place (works mid-animation)
function currentRowX(button) {
  const transform = getComputedStyle(button).transform;
  return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
}

// Stops a row's slide in progress and holds it where it is. Returns that x.
function holdRow(button) {
  const x = currentRowX(button);
  button.getAnimations().forEach((animation) => animation.cancel());
  button.style.transform = `translateX(${x}px)`;
  return x;
}

// Slides a row from where it is to x, then calls onDone (unless a finger catches it first)
function slideRow(button, x, duration, onDone) {
  const fromX = holdRow(button);
  button.style.transform = `translateX(${x}px)`;
  if (prefersReducedMotion()) {
    onDone?.();
    return;
  }
  const slide = button.animate(
    [{ transform: `translateX(${fromX}px)` }, { transform: `translateX(${x}px)` }],
    { duration, easing: SHEET_EASE }
  );
  if (onDone) slide.onfinish = onDone;
}

function setupSwipeToDelete() {
  let swipe = null;         // the touch in progress, or null
  let ignoreClicksUntil = 0; // a swipe must not also count as a tap (which opens the editor)

  list.addEventListener('touchstart', function (event) {
    const button = event.target.closest('.expense-button');
    if (!button || event.touches.length !== 1) {
      if (swipe && swipe.mode !== 'dragging') swipe = null; // a second finger: ignore it
      return;
    }
    const touch = event.touches[0];
    swipe = {
      button,
      mode: 'deciding', // 'deciding' -> 'dragging' or 'ignored'
      startX: touch.clientX,
      startY: touch.clientY,
      fromX: 0,
      samples: [{ x: touch.clientX, time: event.timeStamp }],
    };
    // A row caught while sliding back: hold it under the finger
    if (button.getAnimations().length) {
      swipe.mode = 'dragging';
      swipe.fromX = holdRow(button);
    }
  }, { passive: true });

  list.addEventListener('touchmove', function (event) {
    if (!swipe || swipe.mode === 'ignored') return;
    const touch = event.touches[0];
    const dx = touch.clientX - swipe.startX;
    const dy = touch.clientY - swipe.startY;

    if (swipe.mode === 'deciding') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // too small to tell yet
      // Mostly up/down = scrolling, and to the right = nothing to do: leave it to the browser
      if (Math.abs(dx) <= Math.abs(dy) || dx > 0) {
        swipe.mode = 'ignored';
        return;
      }
      swipe.mode = 'dragging';
      swipe.startX = touch.clientX; // follow the finger from here, 1:1
    }

    event.preventDefault(); // the page mustn't scroll while a row is being swiped
    let x = swipe.fromX + (touch.clientX - swipe.startX);
    if (x > 0) x = rubberBand(x); // past its place to the right: resist
    swipe.button.style.transform = `translateX(${x}px)`;

    swipe.samples.push({ x: touch.clientX, time: event.timeStamp });
    while (swipe.samples.length > 2 && event.timeStamp - swipe.samples[0].time > 100) swipe.samples.shift();
  }, { passive: false });

  function release() {
    if (!swipe || swipe.mode !== 'dragging') {
      swipe = null;
      return;
    }
    const { button, samples } = swipe;
    swipe = null;
    ignoreClicksUntil = performance.now() + 400;

    const first = samples[0];
    const last = samples[samples.length - 1];
    const velocity = (last.x - first.x) / Math.max(last.time - first.time, 1); // px per ms, - = left
    const x = currentRowX(button);
    const width = button.offsetWidth;

    if (-x > width * 0.4 || (velocity < -0.4 && x < -20)) {
      // Delete: slide the rest of the way out at the finger's speed, then remove it
      const duration = Math.min(Math.max((width + x) / Math.max(-velocity, 0.8), 120), 240);
      const id = button.dataset.id;
      slideRow(button, -width, duration, function () {
        deleteExpense(id);
        showToast(`${typeName(lastDeleted)} deleted`, { undo: true });
      });
    } else {
      slideRow(button, 0, 200); // not far enough: back into place
    }
  }

  list.addEventListener('touchend', release);
  list.addEventListener('touchcancel', release);

  // Right after a swipe the browser may still send a "click": don't open the editor for it.
  // (capture: true = this runs before the list's own click listener)
  list.addEventListener('click', function (event) {
    if (performance.now() < ignoreClicksUntil) {
      event.stopPropagation();
      event.preventDefault();
    }
  }, true);
}

// ===== 7. Events: react to what the user does =====
form.addEventListener('submit', function (event) {
  // By default a form reloads the page when submitted. We stop that.
  event.preventDefault();

  const amount = parseAmount(amountInput.value);
  if (amount === null) {
    showAmountError(true);
    amountInput.focus();
    return;
  }
  if (!dateInput.value) {
    // "Pick a date" with the date cleared: open the date field again
    setWhen(todayString());
  }

  const values = {
    type: sheetType,
    amount,
    // No chip ticked: only possible for an adjustment, which keeps its category
    category: form.elements.category.value || (editingAdjustment ? ADJUSTMENT : 'Other'),
    date: dateInput.value,
    note: noteInput.value.trim(),
  };

  // The screen shows one month. If this entry is in another month, or the list is filtered to
  // the other type or another category, switch so the entry you just saved is always visible.
  if (values.date.slice(0, 7) !== filters.month) filters.month = values.date.slice(0, 7);
  if (filters.type !== 'all' && filters.type !== values.type) filters.type = 'all';
  if (filters.category !== 'all' && (values.type !== 'expense' || filters.category !== values.category)) {
    filters.category = 'all';
  }
  saveFilters(filters);

  // Same sheet, two jobs: update if we're editing, otherwise add
  const wasEditing = Boolean(editingId);
  if (editingId) {
    updateExpense(editingId, values);
  } else {
    const id = makeId();
    addExpense({ id, ...values });
    sheetOpener = { button: addBtn };
  }

  closeSheet();
  showToast(wasEditing ? 'Changes saved' : `${values.type === 'income' ? 'Income' : 'Expense'} saved`);
});

// Typing in the amount clears the error as soon as it's fixed
amountInput.addEventListener('input', function () {
  if (!amountError.hidden && parseAmount(amountInput.value) !== null) showAmountError(false);
  fitAmount();
});

// A long amount (1250000.50) must stay readable in the field: step the font down
// 56 -> 44 -> 34px when the number is wider than the field. Same idea as fitTotal().
function fitAmount() {
  for (const size of ['', 'is-medium', 'is-small']) {
    amountField.classList.remove('is-medium', 'is-small');
    if (size) amountField.classList.add(size);
    if (amountInput.scrollWidth <= amountInput.clientWidth) return;
  }
}

// The Expense | Income switch, and remembering each type's last picked chip
form.addEventListener('change', function (event) {
  if (event.target.name === 'type') {
    setSheetType(event.target.value);
  } else if (event.target.name === 'category') {
    lastPicked[sheetType] = event.target.value;
  }
});

// The When chips: Today / Yesterday fill in the date; Pick a date shows the date field
form.addEventListener('change', function (event) {
  if (event.target.name !== 'when') return;
  if (event.target.value === 'today') setWhen(todayString());
  else if (event.target.value === 'yesterday') setWhen(yesterdayString());
  else {
    dateInput.hidden = false;
    dateInput.focus();
  }
});

// Picking a date that happens to be today or yesterday ticks that chip instead
dateInput.addEventListener('change', function () {
  if (dateInput.value) setWhen(dateInput.value);
});

// "input" fires on every keystroke, paste, or delete in the note box
noteInput.addEventListener('input', updateNoteCount);

sheetClose.addEventListener('click', closeSheet);

// However the sheet closed (×, Esc, backdrop, Save), tidy up and give focus back
sheet.addEventListener('close', function () {
  editingId = null;
  const opener = sheetOpener;
  sheetOpener = null;
  if (opener?.rowId) {
    // The list was redrawn, so find the row again (it may be gone, or in another month)
    const row = list.querySelector(`button[data-id="${CSS.escape(opener.rowId)}"]`);
    (row || addBtn).focus({ preventScroll: true });
  } else {
    addBtn.focus({ preventScroll: true });
  }
});

deleteBtn.addEventListener('click', () => showDeleteConfirm(true));
deleteNo.addEventListener('click', () => showDeleteConfirm(false));
deleteYes.addEventListener('click', function () {
  const id = editingId;
  sheetOpener = { button: addBtn }; // the row is gone, so focus goes to Add
  deleteExpense(id);
  closeSheet();
  showToast(`${typeName(lastDeleted)} deleted`, { undo: true });
});

toastUndo.addEventListener('click', function () {
  clearTimeout(toastTimer);
  undoDelete();
});

// ONE click listener on the whole list handles every row (this is called "event delegation").
// It still works for rows that are added later, because the list itself never gets replaced.
list.addEventListener('click', function (event) {
  // closest() finds the row button that was tapped (or null if you tapped between rows)
  const row = event.target.closest('button[data-id]');
  if (row) openSheet(row.dataset.id);
});

// Picking a month in the Live badge: remember the choice, save it, redraw.
// "change" fires when you pick a different option in the phone's month picker.
filterMonth.addEventListener('change', function () {
  filters.month = filterMonth.value;
  saveFilters(filters);
  renderList();
});

// Tapping a cone shows only that category; tapping the same cone again shows everything.
// One listener on the panel handles every cone (event delegation, like the list).
cones.addEventListener('click', function (event) {
  const cone = event.target.closest('button[data-category]');
  if (!cone) return;
  const category = cone.dataset.category;
  const hadFocus = document.activeElement === cone;
  filters.category = filters.category === category ? 'all' : category;
  // A cone is an expense category, so picking one switches the list to Expenses
  if (filters.category !== 'all') filters.type = 'expense';
  saveFilters(filters);
  renderList();
  // The panel was rebuilt, so if the cone had keyboard focus, put it back on the same cone
  if (hadFocus) cones.querySelector(`button[data-category="${CSS.escape(category)}"]`)?.focus();
});

// "Clear" next to "Showing Bills": back to every category
filterClear.addEventListener('click', function () {
  filters.category = 'all';
  saveFilters(filters);
  renderList();
});

// The All | Expenses | Income switch above the list. It also clears a picked cone,
// so the list shows exactly what the switch says.
listFilter.addEventListener('change', function (event) {
  filters.type = event.target.value;
  filters.category = 'all';
  saveFilters(filters);
  renderList();
});

// The floating Add button opens the sheet for a new entry
addBtn.addEventListener('click', () => openSheet(null));

// ===== 7b. Backup & settings sheet =====
// "Backup & settings" (under the motto) opens it, with the budget filled in
settingsBtn.addEventListener('click', function () {
  // Plain digits in the field (10000, 2500.5), so it's easy to edit
  budgetInput.value = budget === null ? '' : String(budget);
  showBudgetError(false);
  // The current balance as a hint in the Actual balance field
  actualBalanceInput.value = '';
  actualBalanceInput.placeholder = String(Math.round(balanceAt(null)));
  showFieldError(balanceField, actualBalanceInput, balanceError, false);
  balanceStatus.textContent = '';
  showSheet(settingsSheet);
  settingsSheet.focus(); // start at the sheet, not with a focus ring on the ×
  settingsSheet.querySelector('.sheet-scroll').scrollTop = 0;
});

settingsClose.addEventListener('click', () => dismissSheet(settingsSheet));

// Closed (×, Esc, backdrop): focus goes back to the link that opened it
settingsSheet.addEventListener('close', () => settingsBtn.focus({ preventScroll: true }));

function showBudgetError(show, message = 'Enter an amount, like 10000, or leave it empty') {
  budgetError.textContent = message;
  budgetError.hidden = !show;
  budgetField.classList.toggle('invalid', show);
  budgetInput.setAttribute('aria-invalid', String(show));
}

// The budget saves as you type, so closing the sheet any way never loses it.
// Empty = no budget. Something that isn't an amount shows the message and isn't saved.
budgetInput.addEventListener('input', function () {
  const text = budgetInput.value.trim();
  const value = text === '' ? null : parseAmount(text);
  if (text !== '' && value === null) {
    showBudgetError(true);
    return;
  }
  showBudgetError(false);
  if (!saveBudget(value)) {
    showBudgetError(true, "Can't save on this browser");
    return;
  }
  budget = value;
  renderLightbox(); // the lightbox behind the sheet updates straight away
});

// Accepts "12500", "12,500.50", "0" or "-350": like parseAmount, but 0 and below zero are allowed
// (for a balance). Returns the number, or null.
function parseBalance(text) {
  const trimmed = text.trim();
  const negative = /^[-−]/.test(trimmed);
  const cleaned = trimmed.replace(/^[-−]/, '').replace(/[₱,\s]/g, '');
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(cleaned)) return null;
  const amount = Math.round(Number(cleaned) * 100) / 100;
  return negative ? -amount : amount;
}

function showFieldError(field, input, error, show) {
  error.hidden = !show;
  field.classList.toggle('invalid', show);
  input.setAttribute('aria-invalid', String(show));
}

// "Update": log the difference between what you really have and the app's balance
// as an Adjustment entry (income if you have more, expense if less), dated today
function updateActualBalance() {
  const actual = parseBalance(actualBalanceInput.value);
  if (actual === null) {
    showFieldError(balanceField, actualBalanceInput, balanceError, true);
    actualBalanceInput.focus();
    return;
  }
  showFieldError(balanceField, actualBalanceInput, balanceError, false);
  const difference = Math.round((actual - balanceAt(null)) * 100) / 100;
  if (difference === 0) {
    balanceStatus.textContent = 'That already matches your balance.';
    return;
  }
  addExpense({
    id: makeId(),
    type: difference > 0 ? 'income' : 'expense',
    amount: Math.abs(difference),
    category: ADJUSTMENT,
    date: todayString(),
    note: 'Balance adjusted',
  });
  actualBalanceInput.value = '';
  actualBalanceInput.placeholder = String(Math.round(balanceAt(null)));
  balanceStatus.textContent = `Balance updated to ${formatBalance(actual)}.`;
}

balanceSaveBtn.addEventListener('click', updateActualBalance);
// The keyboard's "done" key does the same
actualBalanceInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') updateActualBalance();
});
actualBalanceInput.addEventListener('input', function () {
  if (!balanceError.hidden && parseBalance(actualBalanceInput.value) !== null) {
    showFieldError(balanceField, actualBalanceInput, balanceError, false);
  }
});

// ===== 7c. "How much money do you have right now?" =====
// Asked once (first launch, or the first time after income was added to the app), so the
// balance starts right. Existing entries stay; the opening amount is worked out backwards so the
// balance equals what you typed. Skip, or closing the sheet any other way, starts from ₱0.
let openingAnswered = false;

function askOpeningBalance() {
  openingText.textContent = expenses.length > 0
    ? 'Your past entries stay as they are.'
    : 'Your balance starts from this. You can change it any time in Backup & settings.';
  openingAmount.value = '';
  showFieldError(openingField, openingAmount, openingError, false);
  openingAnswered = false;
  showSheet(openingSheet);
  openingSheet.focus();
}

// typed: what you have now. raw: true = use it as the opening amount as is (Skip: ₱0)
function setOpening(typed, raw) {
  const net = expenses.reduce((sum, e) => sum + signedAmount(e), 0);
  const amount = raw ? typed : typed - net; // so that opening + all entries = typed
  opening = { amount: Math.round(amount * 100) / 100, date: todayString() };
  saveOpening(opening);
  openingAnswered = true;
  renderLightbox();
}

openingForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const typed = parseBalance(openingAmount.value);
  if (typed === null) {
    showFieldError(openingField, openingAmount, openingError, true);
    openingAmount.focus();
    return;
  }
  setOpening(typed, false);
  dismissSheet(openingSheet);
});

openingSkip.addEventListener('click', function () {
  setOpening(0, true);
  dismissSheet(openingSheet);
});

// Closed without Save or Skip (Esc, a tap outside, dragged down): counts as Skip
openingSheet.addEventListener('close', function () {
  if (!openingAnswered) setOpening(0, true);
  addBtn.focus({ preventScroll: true });
});

exportBtn.addEventListener('click', exportCsv);

// The Import button opens the hidden file picker
importBtn.addEventListener('click', () => importFile.click());

// "change" fires once a file has been picked. "async" lets us "await" reading the file.
importFile.addEventListener('change', async function () {
  const file = importFile.files[0];
  if (!file) return;
  try {
    showImportPreview(await readImportFile(file));
  } catch (error) {
    console.warn('Import failed:', error);
    showImportPreview({ fileName: file.name, items: [], problems: ['This file could not be read.'] });
  }
});

importMergeBtn.addEventListener('click', () => applyImport('merge'));
importReplaceBtn.addEventListener('click', onReplaceClick);
importCancelBtn.addEventListener('click', closeImportPreview);

// ===== 8. Start-up =====

// Register the service worker (sw.js), which saves the app's files so it opens offline.
// Older browsers without service workers simply skip this; the app still works online.
// It fails when you open index.html by double-clicking (file://), which is fine: it needs a web address.

const offlineStatus = document.getElementById('offline-status');

// Shows at the bottom of the page whether offline use is ready, so you can check on a phone
// (where there are no developer tools). "Ready" means BOTH: the service worker is in charge
// of this page, AND a saved copy of the page is in its cache.
async function showOfflineStatus() {
  let ready = false;
  try {
    ready = Boolean(navigator.serviceWorker.controller) && Boolean(await caches.match('./'));
  } catch (error) {
    ready = false; // caches can be unavailable (e.g. some private modes)
  }
  offlineStatus.classList.toggle('ready', ready);
  if (ready && !navigator.onLine) {
    offlineStatus.textContent = '✓ Offline: using the saved app';
  } else if (ready) {
    offlineStatus.textContent = '✓ Ready to use offline';
  } else {
    offlineStatus.textContent = 'Getting ready for offline use… keep the app open with internet for a few seconds.';
  }
}

if ('serviceWorker' in navigator) {
  showOfflineStatus();
  navigator.serviceWorker.register('sw.js')
    .then(() => navigator.serviceWorker.ready) // waits until it's installed (files saved) and active
    .then(showOfflineStatus)
    .catch((error) => {
      console.warn('Offline support not available here:', error.message);
      offlineStatus.textContent = 'Offline use is not available when the app is opened this way.';
    });
  // The worker takes charge of the page a moment after the first visit: check again then
  navigator.serviceWorker.addEventListener('controllerchange', showOfflineStatus);
  // Update the message when the internet goes away or comes back
  window.addEventListener('online', showOfflineStatus);
  window.addEventListener('offline', showOfflineStatus);
} else {
  offlineStatus.textContent = 'This browser can\'t save the app for offline use.';
}

setupSheet(sheet);
setupSheet(settingsSheet);
setupSheet(openingSheet);
setupSwipeToDelete();
askToKeepStorage();
renderList();
// No opening balance yet: ask for it once
if (opening === null) askOpeningBalance();

// Outfit is a bit wider than the phone's own font, so measure the big total again once it has
// loaded (and when the phone is turned), in case it now needs a smaller size.
document.fonts?.ready.then(fitTotal);
window.addEventListener('resize', fitTotal);
