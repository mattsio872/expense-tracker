// ===== 1. Find the HTML elements we need (using their id "name tags") =====
const form = document.getElementById('expense-form');
const formTitle = document.getElementById('form-title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const noteInput = document.getElementById('note');
const noteCount = document.getElementById('note-count');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const list = document.getElementById('expense-list');
const totalEl = document.getElementById('total');
const emptyMessage = document.getElementById('empty-message');
const filtersBox = document.getElementById('filters');
const filterMonth = document.getElementById('filter-month');
const filterCategory = document.getElementById('filter-category');
const filterSummary = document.getElementById('filter-summary');
const listTotalBox = document.getElementById('list-total-box');
const listTotal = document.getElementById('list-total');
const chartEmpty = document.getElementById('chart-empty');
const chartContent = document.getElementById('chart-content');
const monthChart = document.getElementById('month-chart');
const chartLegend = document.getElementById('chart-legend');
const categoryChart = document.getElementById('category-chart');
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

// ===== 2. Storage: save and load with localStorage =====
// localStorage is a small storage area in the browser. It only stores TEXT,
// so we turn our array into JSON text to save it, and back into an array to load it.
const STORAGE_KEY = 'expenses';

function loadExpenses() {
  try {
    const text = localStorage.getItem(STORAGE_KEY); // null if nothing saved yet
    const data = JSON.parse(text);
    // Only trust it if it really is an array. Otherwise start fresh.
    return Array.isArray(data) ? data : [];
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
    alert('Could not save your expenses in this browser.');
    console.warn('Could not save expenses:', error);
  }
}

// The filter choice is saved too, so the app opens the way you left it.
// It's only a convenience, so if anything goes wrong we quietly fall back to "show everything".
const FILTERS_KEY = 'filters';
const NO_FILTERS = { month: 'all', category: 'all' };

function loadFilters() {
  try {
    const data = JSON.parse(localStorage.getItem(FILTERS_KEY));
    if (data && typeof data.month === 'string' && typeof data.category === 'string') {
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

// ===== 3. State: the app's data =====
// Every expense looks like: { id, amount, category, date, note }
// We start with whatever was saved last time.
let expenses = loadExpenses();

// Which expense is being edited right now. null = we're adding a new one.
let editingId = null;

// Which expense is showing "Delete this? [Yes, delete] [Cancel]" right now. null = none.
// We ask inside the row instead of using confirm(), because some browsers (in-app browsers,
// or after "prevent this page from creating dialogs") block confirm() and it silently answers "Cancel".
let confirmingDeleteId = null;

// What the list is filtered by. "all" means no filter.
// month looks like "2026-11" (the first 7 characters of a date), category like "Food".
let filters = loadFilters();

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

// Turns "2026-11-21" into "Nov 21, 2026" for display (we still SAVE the YYYY-MM-DD form).
// We build the date from its parts because new Date("2026-11-21") is read as UTC
// midnight, which can show the wrong day in some time zones.
function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
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

// Fill the category filter by COPYING the options from the form's category dropdown,
// so the list of categories lives in one place (index.html). Runs once at start-up.
function fillCategoryFilter() {
  for (const option of categoryInput.options) {
    filterCategory.add(new Option(option.text, option.value));
  }
  // A saved category that no longer exists? Fall back to "all".
  if (![...filterCategory.options].some((o) => o.value === filters.category)) {
    filters.category = 'all';
  }
  filterCategory.value = filters.category;
}

// Rebuild the month filter from the months that actually have expenses (newest first).
// Runs on every render, because adding/editing/deleting can create or remove a month.
// The months that have at least one expense, newest first, e.g. ["2026-11", "2026-10"]
function monthsWithExpenses() {
  // A Set keeps only unique values: ["2026-11", "2026-11", "2026-10"] -> {"2026-11", "2026-10"}
  return [...new Set(expenses.map(monthOf))].sort().reverse();
}

// Fills a month dropdown with "All months" + each month, and selects `selected`.
// Used by both the list filter and the export picker, so they always show the same months.
function fillMonthSelect(select, months, selected) {
  select.innerHTML = '';
  select.add(new Option('All months', 'all'));
  for (const month of months) {
    select.add(new Option(formatMonth(month), month));
  }
  select.value = selected;
}

function updateMonthOptions() {
  const months = monthsWithExpenses();

  // If the chosen month has no expenses any more (e.g. you deleted the last one), show all months
  if (filters.month !== 'all' && !months.includes(filters.month)) {
    filters.month = 'all';
    saveFilters(filters);
  }
  fillMonthSelect(filterMonth, months, filters.month);

  // The export picker: keep its choice if that month still has expenses, otherwise "All months"
  const exportChoice = months.includes(exportMonth.value) ? exportMonth.value : 'all';
  fillMonthSelect(exportMonth, months, exportChoice);
}

// Shows "45 / 200" under the note, so the limit is never a surprise.
// noteInput.maxLength reads the maxlength="200" from the HTML, so the number lives in one place.
function updateNoteCount() {
  const used = noteInput.value.length;
  const max = noteInput.maxLength;
  noteCount.textContent = `${used} / ${max}`;
  // Add the "near-limit" class when 20 or fewer characters are left (CSS turns it red)
  noteCount.classList.toggle('near-limit', max - used <= 20);
}

// Creates an element with a CSS class and text in one line.
// It uses textContent, so user text can never become HTML.
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

// Builds one row button. data-action says WHAT it does, data-id says WHICH expense.
// extraClass is optional: e.g. 'btn-danger' makes the button red.
function makeRowButton(label, action, expense, extraClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn btn-small ${extraClass}`;
  button.textContent = label;
  button.dataset.action = action;   // becomes data-action="edit" / "delete" / ...
  button.dataset.id = expense.id;   // becomes data-id="1795...-ab12"
  button.setAttribute('aria-label', `${label}: ${expense.category} expense of ${formatPeso(expense.amount)}`);
  return button;
}

// ===== 5. Render: draw the expenses array onto the page =====
function renderList() {
  list.innerHTML = ''; // clear the old list, then rebuild it from the array
  updateMonthOptions();

  // Newest first. We sort a COPY ([...expenses]) so the saved data isn't reordered.
  // Dates are "YYYY-MM-DD" text, which sorts correctly as plain text.
  // Same date? The id starts with the time it was created, so newer ids win.
  const sorted = [...expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );

  // Keep only the expenses that pass the filters. The saved data is untouched.
  const visible = sorted.filter(matchesFilters);

  for (const expense of visible) {
    // Each row is built from small pieces with their own CSS classes:
    //   <li class="expense">
    //     <div class="expense-info"> amount, category badge, date, note </div>
    //     <div class="expense-actions"> Edit, Delete </div>
    //   </li>
    const item = makeElement('li', 'expense', '');

    const info = makeElement('div', 'expense-info', '');
    const top = makeElement('div', 'expense-top', '');
    top.append(
      makeElement('span', 'expense-amount', formatPeso(expense.amount)),
      makeElement('span', 'badge', expense.category)
    );
    info.append(top, makeElement('div', 'expense-date', formatDate(expense.date)));
    if (expense.note) {
      // textContent (inside makeElement) shows the note exactly as typed,
      // so a note like "<b>hi</b>" can't turn into real HTML.
      info.append(makeElement('div', 'expense-note', expense.note));
    }

    const actions = makeElement('div', 'expense-actions', '');
    if (expense.id === confirmingDeleteId) {
      // This row is asking "are you sure?"
      actions.append(
        makeElement('span', 'confirm-text', 'Delete this?'),
        makeRowButton('Yes, delete', 'confirm-delete', expense, 'btn-danger-solid'),
        makeRowButton('Cancel', 'cancel-delete', expense)
      );
    } else {
      actions.append(
        makeRowButton('Edit', 'edit', expense),
        makeRowButton('Delete', 'delete', expense, 'btn-danger')
      );
    }

    item.append(info, actions);
    list.appendChild(item);
  }

  // Total: reduce() walks the array and adds each amount to a running sum (starting at 0)
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalEl.textContent = formatPeso(total); // the header always shows the ALL-TIME total

  // No expenses at all: hide the filters, they'd have nothing to filter
  filtersBox.hidden = expenses.length === 0;

  // The empty message has two versions: nothing saved yet, or nothing matches the filters
  if (expenses.length === 0) {
    emptyMessage.textContent = 'No expenses yet. Add your first one using the form.';
  } else {
    emptyMessage.textContent = 'No expenses match these filters.';
  }
  emptyMessage.hidden = visible.length > 0;

  // Total of what's SHOWN (after filtering), beside the "Expenses" heading
  const visibleTotal = visible.reduce((sum, e) => sum + e.amount, 0);
  listTotal.textContent = formatPeso(visibleTotal);
  listTotalBox.hidden = expenses.length === 0;

  // Summary line under the filters: just the count (the money is in the heading now)
  const filtered = filters.month !== 'all' || filters.category !== 'all';
  filterSummary.textContent = filtered
    ? `Showing ${visible.length} of ${countLabel(expenses.length)}`
    : countLabel(expenses.length);
  filterSummary.hidden = expenses.length === 0;

  // The chart uses the same data, so redraw it whenever the list is redrawn
  renderChart();

  // Nothing to export yet? Grey out the button.
  exportBtn.disabled = expenses.length === 0;
}

// ===== 5b. Render the chart: bars are just <div>s with a width in % =====

// Each category's color lives in style.css as a variable, e.g. --cat-food.
// This turns "Food" into "var(--cat-food)". Unknown categories fall back to the "Other" color.
function categoryColor(category) {
  return `var(--cat-${category.toLowerCase()}, var(--cat-other))`;
}

// Categories in the same order as the form's dropdown, so colors always appear in the same order
function categoryOrder() {
  return [...categoryInput.options].map((option) => option.value);
}

// Adds up amounts into groups. Example: sumBy(expenses, monthOf)
//   -> Map { "2026-11" => 11350, "2026-10" => 850 }
// A Map is like an object made for "key -> value" lookups.
function sumBy(items, getKey) {
  const totals = new Map();
  for (const item of items) {
    const key = getKey(item);
    totals.set(key, (totals.get(key) || 0) + item.amount);
  }
  return totals;
}

// One chart row: a label line ("Nov 2026 ...... ₱11,350.00") with a bar underneath.
// widthPercent: how long the bar is compared to the biggest one (100 = full width)
function makeChartRow(label, amountText, widthPercent) {
  const row = makeElement('div', 'chart-row', '');
  const labels = makeElement('div', 'chart-row-label', '');
  labels.append(makeElement('span', '', label), makeElement('span', 'chart-amount', amountText));

  const track = makeElement('div', 'bar-track', ''); // the light grey "lane" the bar sits in
  const bar = makeElement('div', 'bar', '');
  bar.style.width = `${widthPercent}%`;
  track.append(bar);

  row.append(labels, track);
  return { row, bar };
}

function renderChart() {
  const hasData = expenses.length > 0;
  chartEmpty.hidden = hasData;
  chartContent.hidden = !hasData;
  if (!hasData) return;

  const order = categoryOrder();

  // --- By month: one bar per month, split into colored pieces by category ---
  monthChart.innerHTML = '';
  const monthTotals = sumBy(expenses, monthOf);
  const biggestMonth = Math.max(...monthTotals.values()); // the longest bar = 100%
  const months = [...monthTotals.keys()].sort().reverse(); // newest first, like the list

  for (const month of months) {
    const monthExpenses = expenses.filter((e) => monthOf(e) === month);
    const byCategory = sumBy(monthExpenses, (e) => e.category);
    const monthTotal = monthTotals.get(month);

    const { row, bar } = makeChartRow(
      formatMonth(month),
      formatPeso(monthTotal),
      (monthTotal / biggestMonth) * 100
    );

    // Each piece gets "flex-grow" equal to its amount, so the pieces share the bar
    // in proportion: ₱10,000 gets 10× more room than ₱1,000.
    const breakdown = [];
    for (const category of order) {
      const amount = byCategory.get(category);
      if (!amount) continue;
      const piece = makeElement('span', 'bar-piece', '');
      piece.style.flexGrow = amount;
      piece.style.background = categoryColor(category);
      piece.title = `${category}: ${formatPeso(amount)}`; // shows when you hover with a mouse
      bar.append(piece);
      breakdown.push(`${category} ${formatPeso(amount)}`);
    }

    // Screen readers can't "see" colors, so give them the breakdown as text
    row.append(makeElement('span', 'visually-hidden', `Breakdown: ${breakdown.join(', ')}`));
    monthChart.append(row);
  }

  // --- Legend: a colored dot + name for each category that has spending ---
  const categoryTotals = sumBy(expenses, (e) => e.category);
  chartLegend.innerHTML = '';
  for (const category of order) {
    if (!categoryTotals.has(category)) continue;
    const item = makeElement('li', 'legend-item', '');
    const swatch = makeElement('span', 'legend-swatch', '');
    swatch.style.background = categoryColor(category);
    item.append(swatch, category);
    chartLegend.append(item);
  }

  // --- By category: one bar per category, biggest first, with its share of the total ---
  categoryChart.innerHTML = '';
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const biggestCategory = Math.max(...categoryTotals.values());
  const categories = [...categoryTotals.keys()].sort(
    (a, b) => categoryTotals.get(b) - categoryTotals.get(a)
  );

  for (const category of categories) {
    const amount = categoryTotals.get(category);
    const percent = Math.round((amount / grandTotal) * 100);
    // A real but tiny share would round to "0%", which looks wrong, so say "<1%" instead
    const percentText = percent === 0 ? '<1%' : `${percent}%`;
    const { row, bar } = makeChartRow(
      category,
      `${formatPeso(amount)} · ${percentText}`,
      (amount / biggestCategory) * 100
    );
    bar.style.background = categoryColor(category);
    categoryChart.append(row);
  }
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
    let category = categories.find((c) => c.toLowerCase() === cell('category').trim().toLowerCase());
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

  // Leave edit mode / any open "Delete this?" in case those expenses changed
  confirmingDeleteId = null;
  if (editingId) resetForm();

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

// Step 1 of deleting: switch that row to "Delete this? [Yes, delete] [Cancel]"
function askToDelete(id) {
  confirmingDeleteId = id;
  renderList();
  // Put keyboard focus on Cancel (the safe choice), so pressing Enter by accident deletes nothing
  list.querySelector(`button[data-action="cancel-delete"][data-id="${id}"]`)?.focus();
}

function cancelDelete() {
  confirmingDeleteId = null;
  renderList();
}

// Step 2: really delete (only reached from the "Yes, delete" button)
function deleteExpense(id) {
  confirmingDeleteId = null;

  // If we were editing this one, leave edit mode first
  if (editingId === id) resetForm();

  // filter() makes a NEW array that keeps every expense EXCEPT this one
  expenses = expenses.filter((e) => e.id !== id);
  saveExpenses(expenses);
  renderList();
}

// Switch the form into "edit mode" and fill it with the expense's values
function startEdit(id) {
  const expense = expenses.find((e) => e.id === id);
  if (!expense) return;

  editingId = id;
  amountInput.value = expense.amount;
  categoryInput.value = expense.category;
  dateInput.value = expense.date;
  noteInput.value = expense.note;
  updateNoteCount();

  formTitle.textContent = 'Edit expense';
  submitBtn.textContent = 'Save changes';
  cancelBtn.hidden = false;

  form.scrollIntoView({ behavior: 'smooth' }); // on phones the form may be off-screen
  amountInput.focus();
}

// Back to "add mode" with an empty form
function resetForm() {
  editingId = null;
  form.reset();
  dateInput.value = todayString();
  updateNoteCount();

  formTitle.textContent = 'Add expense';
  submitBtn.textContent = 'Add expense';
  cancelBtn.hidden = true;
}

// ===== 7. Events: react to what the user does =====
form.addEventListener('submit', function (event) {
  // By default a form reloads the page when submitted. We stop that.
  event.preventDefault();

  const amount = Number(amountInput.value);

  // Double-check in JavaScript (the HTML checks can be bypassed)
  if (!(amount > 0)) {
    alert('Please enter an amount greater than ₱0.');
    return;
  }
  if (!dateInput.value) {
    alert('Please pick a date.');
    return;
  }

  const values = {
    amount: Math.round(amount * 100) / 100, // keep 2 decimal places
    category: categoryInput.value,
    date: dateInput.value,
    note: noteInput.value.trim(),
  };

  // Same form, two jobs: update if we're editing, otherwise add
  if (editingId) {
    updateExpense(editingId, values);
  } else {
    addExpense({ id: makeId(), ...values });
  }

  // Get the form ready for the next expense
  resetForm();
  amountInput.focus();
});

cancelBtn.addEventListener('click', resetForm);

// "input" fires on every keystroke, paste, or delete in the note box
noteInput.addEventListener('input', updateNoteCount);

// ONE click listener on the whole list handles every Edit and Delete button
// (this is called "event delegation"). It still works for rows that are
// added later, because the list itself never gets replaced.
list.addEventListener('click', function (event) {
  // closest() finds the button that was clicked (or null if you clicked text)
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === 'edit') {
    if (confirmingDeleteId) cancelDelete(); // starting an edit closes any open "Delete this?"
    startEdit(id);
  } else if (action === 'delete') {
    askToDelete(id);          // first click: ask
  } else if (action === 'confirm-delete') {
    deleteExpense(id);        // "Yes, delete": really delete
  } else if (action === 'cancel-delete') {
    cancelDelete();           // "Cancel": back to normal
  }
});

// Changing either filter: remember the choice, save it, redraw.
// "change" fires when you pick a different option in a dropdown.
filterMonth.addEventListener('change', function () {
  filters.month = filterMonth.value;
  saveFilters(filters);
  renderList();
});

filterCategory.addEventListener('change', function () {
  filters.category = filterCategory.value;
  saveFilters(filters);
  renderList();
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

fillCategoryFilter();
resetForm(); // start in "add mode" with today's date
renderList();
