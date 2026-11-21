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
const list = document.getElementById('expense-list');
const totalEl = document.getElementById('total');
const totalCompare = document.getElementById('total-compare');
const totalLabel = document.getElementById('total-label');
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

// ===== 2. The categories: the ONE list (the chips, the cones and CSV import all use it) =====
// Each one needs a color in style.css: "--cat-" + the name in lowercase, spaces -> "-".
const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Nights out', 'School', 'Other'];

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

    // One-time update: "Entertainment" is now "Nights out". Rename, then save once.
    let renamed = false;
    for (const expense of data) {
      if (RENAMED_CATEGORIES[expense.category]) {
        expense.category = RENAMED_CATEGORIES[expense.category];
        renamed = true;
      }
    }
    if (renamed) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
const FILTERS_KEY = 'filters';
const NO_FILTERS = { month: 'all', category: 'all' };

function loadFilters() {
  try {
    const data = JSON.parse(localStorage.getItem(FILTERS_KEY));
    if (data && typeof data.month === 'string' && typeof data.category === 'string') {
      data.category = RENAMED_CATEGORIES[data.category] || data.category;
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
// Every expense looks like: { id, amount, category, date, note }
// We start with whatever was saved last time.
let expenses = loadExpenses();

// Which expense the sheet is editing right now. null = it's adding a new one (or closed).
let editingId = null;

// What the screen shows. month looks like "2026-11" (the first 7 characters of a date),
// category like "Food" ("all" = every category).
let filters = loadFilters();

// The monthly budget in pesos, or null
let budget = loadBudget();

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

// "2026-11-21" -> "2026-11". Because dates are YYYY-MM-DD, the month is just the first 7 characters.
function monthOf(expense) {
  return expense.date.slice(0, 7);
}

// "2026-11" -> "Nov 2026" (short names, so they fit in the dropdown on a phone)
function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
}

// The month before, e.g. "2026-01" -> "2025-12". Built from parts (local time), like the dates above.
function previousMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 2, 1); // month - 1 is this month (0-based), so - 2 is last month
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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

// "1 expense" / "3 expenses"
function countLabel(n) {
  return n === 1 ? '1 expense' : `${n} expenses`;
}

// Does this expense pass BOTH filters? ("all" lets everything through)
function matchesFilters(expense) {
  const monthOk = filters.month === 'all' || monthOf(expense) === filters.month;
  const categoryOk = filters.category === 'all' || expense.category === filters.category;
  return monthOk && categoryOk;
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

  // This month's expenses, newest first. We sort a COPY ([...expenses]) so the saved data isn't reordered.
  // Dates are "YYYY-MM-DD" text, which sorts correctly as plain text.
  // Same date? The id starts with the time it was created, so newer ids win.
  const monthExpenses = [...expenses]
    .filter((e) => monthOf(e) === filters.month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  // The cones are built first, because they decide whether the picked category still exists
  renderSpeakerPanel(monthExpenses);
  renderLightbox();

  // Keep only the expenses that pass the category filter. The saved data is untouched.
  const visible = monthExpenses.filter(matchesFilters);

  // Group by day: one <li class="day"> per date, with a header and that day's rows.
  //   <li class="day">
  //     <h3 class="day-header"> Today ............ ₱230.00 </h3>
  //     <ul class="day-rows"> <li class="expense">...</li> ... </ul>
  //   </li>
  let dayRows = null;
  let lastDate = null;
  for (const expense of visible) {
    if (expense.date !== lastDate) {
      lastDate = expense.date;
      const dayTotal = visible
        .filter((e) => e.date === expense.date)
        .reduce((sum, e) => sum + e.amount, 0);

      const day = makeElement('li', 'day', '');
      const header = makeElement('h3', 'day-header', '');
      header.append(
        makeElement('span', 'day-label', dayLabel(expense.date)),
        makeElement('span', 'day-total', formatPeso(dayTotal))
      );
      dayRows = makeElement('ul', 'day-rows', '');
      day.append(header, dayRows);
      list.append(day);
    }
    dayRows.append(makeExpenseRow(expense));
  }

  // Nothing to show: say why
  if (expenses.length === 0) {
    emptyMessage.textContent = 'Nothing logged yet. Tap Add expense to start.';
  } else {
    emptyMessage.textContent = `No expenses in ${monthName(filters.month)} yet.`;
  }
  emptyMessage.hidden = visible.length > 0;

  // "Showing Bills · Clear", only while a cone is picked
  const filtered = filters.category !== 'all';
  filterText.textContent = filtered ? `Showing ${filters.category} ·` : '';
  filterClear.hidden = !filtered;

  // Nothing to export yet? Grey out the button.
  exportBtn.disabled = expenses.length === 0;
}

// One expense row. The whole row is one button: tap it to edit (or delete) in the sheet.
//   <li class="expense">
//     <button class="expense-button" data-id="...">
//       <span class="expense-dot">            (the category's color)
//       <span class="expense-info"> title (the note, or the category), and the category under a note </span>
//       <span class="expense-amount">
//     </button>
//   </li>
function makeExpenseRow(expense) {
  const item = makeElement('li', 'expense', '');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'expense-button';
  button.dataset.id = expense.id;

  const dot = makeElement('span', 'expense-dot', '');
  dot.style.background = categoryColor(expense.category);

  // With a note: the note is the title, the category goes on the line under it.
  // Without one: the category is the title, and there's no second line (the day header has the date).
  // textContent (inside makeElement) shows the note exactly as typed,
  // so a note like "<b>hi</b>" can't turn into real HTML.
  const info = makeElement('span', 'expense-info', '');
  info.append(makeElement('span', 'expense-title', expense.note || expense.category));
  if (expense.note) info.append(makeElement('span', 'expense-meta', expense.category));

  const amount = makeElement('span', 'expense-amount', formatPeso(expense.amount));

  // What a screen reader says for the row: "Food, ₱185.00, Jollibee lunch, today. Edit"
  const day = dayLabel(expense.date);
  const when = day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day;
  const parts = [expense.category, formatPeso(expense.amount)];
  if (expense.note) parts.push(expense.note);
  parts.push(when);
  button.setAttribute('aria-label', `${parts.join(', ')}. Edit`);

  button.append(dot, info, amount);
  item.append(button);
  return item;
}

// ===== 5a. The lightbox: the chosen month's total =====
// Under the total: with a budget, a bar and what's left of it;
// without one, how the month compares with the month before (if that month has expenses).
function renderLightbox() {
  const month = filters.month;
  const lastMonth = previousMonth(month);
  const sumOf = (m) => expenses.filter((e) => monthOf(e) === m).reduce((sum, e) => sum + e.amount, 0);

  totalLabel.textContent = month === currentMonth() ? 'Spent this month' : `Spent in ${monthName(month)}`;

  const spent = sumOf(month);
  totalEl.textContent = formatWholePeso(spent);
  fitTotal();

  budgetBox.hidden = budget === null;
  if (budget !== null) {
    totalCompare.hidden = true;
    // The bar: how much of the budget is used, never past full
    const used = Math.min(spent / budget, 1);
    budgetFill.style.width = `${used * 100}%`;
    budgetOf.textContent = `of ${formatWholePeso(budget)}`;
    // Whole pesos, like the total. Over budget stays calm: same dark ink, no red.
    const left = Math.round(budget) - Math.round(spent);
    budgetLeft.textContent = left >= 0 ? `${formatWholePeso(left)} left` : `${formatWholePeso(-left)} over`;
    return;
  }

  const before = sumOf(lastMonth);
  if (before === 0) {
    totalCompare.hidden = true; // nothing to compare with
    return;
  }
  // Compare in whole pesos, so "₱0 more" can't happen
  const difference = Math.round(spent) - Math.round(before);
  const name = monthName(lastMonth);
  if (difference > 0) totalCompare.textContent = `${formatWholePeso(difference)} more than ${name}`;
  else if (difference < 0) totalCompare.textContent = `${formatWholePeso(-difference)} less than ${name}`;
  else totalCompare.textContent = `Same as ${name}`;
  totalCompare.hidden = false;
}

// A huge total (₱1,250,000) must still fit on the lightbox: if it's wider than the box,
// step the font down 72 -> 56 -> 44px. Measured after the text is set.
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

// Up to 4 cones: with 4 or fewer categories, one cone each; with more, the top 3 + "Rest".
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

    const cone = document.createElement(slot.category ? 'button' : 'div');
    cone.className = 'cone';
    if (slot.category) {
      const picked = filters.category === slot.category;
      cone.type = 'button';
      cone.dataset.category = slot.category;
      cone.setAttribute('aria-pressed', String(picked));
      cone.setAttribute('aria-label', picked
        ? `${name}, ${percent} percent. Showing only ${name}`
        : `${name}, ${percent} percent. Show only ${name}`);
    } else {
      cone.setAttribute('role', 'img');
      cone.setAttribute('aria-label', `Rest, ${percent} percent`);
    }

    // The gold ring is a conic-gradient: gold from 0 to the percent, dark track after it.
    // The --p variable carries the percent into the CSS.
    const ring = makeElement('span', 'cone-ring', '');
    ring.style.setProperty('--p', `${percent}%`);
    const cap = makeElement('span', 'cone-cap', `${percent}%`);
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
//   date,category,amount,note,id
//   2026-10-15,Food,850.00,davids teahouse,1795202170826-wxrf
// The id column lets the import step (next) recognise expenses it already has.

const CSV_COLUMNS = ['date', 'category', 'amount', 'note', 'id'];

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

function expensesToCsv(list) {
  // Oldest first: spreadsheets usually read top-to-bottom in time order
  const rows = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const lines = [CSV_COLUMNS.join(',')]; // the header row
  for (const e of rows) {
    // amount as a plain number with 2 decimals (no ₱, no commas) so spreadsheets can add it up
    lines.push([e.date, e.category, e.amount.toFixed(2), e.note, e.id].map(csvCell).join(','));
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
  downloadTextFile(fileName, expensesToCsv(toExport), 'text/csv;charset=utf-8');

  const which = month === 'all' ? 'all months' : formatMonth(month);
  backupStatus.textContent = `Exported ${countLabel(toExport.length)} (${which}) to ${fileName}.`;
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
      problems: [`Missing column(s): ${missing.join(', ')}. The first row must name the columns: date, category, amount, note.`],
    };
  }

  const categories = categoryOrder();
  const items = [];
  const problems = [];
  const seenIds = new Set();
  let otherCount = 0;

  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2; // +2 because the header is row 1, like in a spreadsheet
    const cell = (name) => (col[name] === -1 ? '' : cells[col[name]] ?? '');

    const date = parseImportDate(cell('date'));
    const amount = parseImportAmount(cell('amount'));
    if (!date) { problems.push(`Row ${rowNumber}: "${cell('date')}" is not a valid date.`); return; }
    if (amount === null) { problems.push(`Row ${rowNumber}: "${cell('amount')}" is not a valid amount.`); return; }

    // Match the category ignoring upper/lower case; unknown ones go under "Other"
    // Old backups say "Entertainment": use its new name first, so it isn't filed under Other
    let wanted = cell('category').trim().toLowerCase();
    for (const [oldName, newName] of Object.entries(RENAMED_CATEGORIES)) {
      if (wanted === oldName.toLowerCase()) wanted = newName.toLowerCase();
    }
    let category = categories.find((c) => c.toLowerCase() === wanted);
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

    items.push({ id, amount, category, date, note });
  });

  return { fileName: file.name, items, problems, otherCount };
}

// Shows what was found in the file and the choices
function showImportPreview(result) {
  pendingImport = result;
  importPreview.hidden = false;
  backupStatus.textContent = '';

  const existingIds = new Set(expenses.map((e) => e.id));
  const newCount = result.items.filter((e) => !existingIds.has(e.id)).length;
  const alreadyCount = result.items.length - newCount;

  if (result.items.length === 0) {
    importSummary.textContent = `Couldn't import anything from ${result.fileName}.`;
  } else {
    let summary = `${result.fileName}: found ${countLabel(result.items.length)} ` +
      `(${newCount} new, ${alreadyCount} already in the app).`;
    if (result.otherCount > 0) summary += ` ${result.otherCount} with an unknown category will be filed under Other.`;
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
  importReplaceBtn.hidden = result.items.length === 0;
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

// mode: "merge" = keep everything you have and add the expenses that are new;
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
    message = `Replaced your expenses with the ${countLabel(items.length)} from the file.`;
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
  lastDeleted = null;
  showToast('Expense restored');
}

// ===== 6b. The add / edit sheet =====

// Today and yesterday as "YYYY-MM-DD", in your time zone (like todayString)
function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1); // setDate handles month and year changes (Mar 1 -> Feb 28)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Builds the category chips from CATEGORIES (once, at start-up):
//   <input type="radio" name="category" id="cat-food" value="Food" class="visually-hidden">
//   <label for="cat-food" class="chip">Food</label>
function buildCategoryChips() {
  for (const category of CATEGORIES) {
    const id = `cat-${category.toLowerCase().replace(/\s+/g, '-')}`;
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

// Opens the sheet. With an id: edit that expense. Without: a new expense.
function openSheet(id) {
  const expense = id ? expenses.find((e) => e.id === id) : null;
  editingId = expense ? expense.id : null;
  sheetOpener = expense ? { rowId: expense.id } : { button: addBtn };

  form.reset();
  showAmountError(false);
  deleteConfirm.hidden = true;
  deleteBtn.hidden = false;
  deleteArea.hidden = !expense;

  if (expense) {
    sheetTitle.textContent = 'Edit expense';
    submitBtn.textContent = 'Save changes';
    amountInput.value = String(expense.amount);
    // An old category that isn't a chip any more falls back to Other
    form.elements.category.value = CATEGORIES.includes(expense.category) ? expense.category : 'Other';
    setWhen(expense.date);
    noteInput.value = expense.note;
  } else {
    sheetTitle.textContent = 'New expense';
    submitBtn.textContent = 'Save expense';
    form.elements.category.value = 'Food';
    setWhen(todayString());
  }
  updateNoteCount();

  sheet.showModal();
  sheet.querySelector('.sheet-scroll').scrollTop = 0;
  // A new expense starts with the number keyboard up. (Editing doesn't: you may only
  // want to change the category, and the keyboard would cover the sheet.)
  // Editing focuses the sheet itself: screen readers start at its title, and no focus ring
  // appears on the × (which is what the browser would pick on its own).
  if (expense) sheet.focus();
  else amountInput.focus();
}

function closeSheet() {
  if (sheet.open) sheet.close(); // the "close" listener below does the tidying up
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
    amount,
    category: form.elements.category.value || 'Other',
    date: dateInput.value,
    note: noteInput.value.trim(),
  };

  // The screen shows one month. If this expense is in another month (or a category that isn't
  // picked), switch the screen to it, so the expense you just saved is always visible.
  if (values.date.slice(0, 7) !== filters.month) filters.month = values.date.slice(0, 7);
  if (filters.category !== 'all' && filters.category !== values.category) filters.category = 'all';
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
  showToast(wasEditing ? 'Changes saved' : 'Expense saved');
});

// Typing in the amount clears the error as soon as it's fixed
amountInput.addEventListener('input', function () {
  if (!amountError.hidden && parseAmount(amountInput.value) !== null) showAmountError(false);
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

// A tap on the dark backdrop closes the sheet (without saving). The backdrop counts as the
// <dialog> itself, while taps inside the sheet land on its contents.
sheet.addEventListener('click', function (event) {
  if (event.target === sheet) closeSheet();
});

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
  sheetOpener = { button: addBtn }; // the row is gone, so focus goes to Add expense
  deleteExpense(id);
  closeSheet();
  showToast('Expense deleted', { undo: true });
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

// The floating Add expense button opens the sheet for a new expense
addBtn.addEventListener('click', () => openSheet(null));

// ===== 7b. Backup & settings sheet =====
// "Backup & settings" (under the motto) opens it, with the budget filled in
settingsBtn.addEventListener('click', function () {
  // Plain digits in the field (10000, 2500.5), so it's easy to edit
  budgetInput.value = budget === null ? '' : String(budget);
  showBudgetError(false);
  settingsSheet.showModal();
  settingsSheet.focus(); // start at the sheet, not with a focus ring on the ×
  settingsSheet.querySelector('.sheet-scroll').scrollTop = 0;
});

settingsClose.addEventListener('click', () => settingsSheet.close());

// A tap on the dark backdrop closes it, like the expense sheet
settingsSheet.addEventListener('click', function (event) {
  if (event.target === settingsSheet) settingsSheet.close();
});

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

buildCategoryChips();
renderList();

// Outfit is a bit wider than the phone's own font, so measure the big total again once it has
// loaded (and when the phone is turned), in case it now needs a smaller size.
document.fonts?.ready.then(fitTotal);
window.addEventListener('resize', fitTotal);
