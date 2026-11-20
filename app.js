// ===== 1. Find the HTML elements we need (using their id "name tags") =====
const form = document.getElementById('expense-form');
const formTitle = document.getElementById('form-title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const noteInput = document.getElementById('note');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const list = document.getElementById('expense-list');
const totalEl = document.getElementById('total');
const emptyMessage = document.getElementById('empty-message');

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

// ===== 3. State: the app's data =====
// Every expense looks like: { id, amount, category, date, note }
// We start with whatever was saved last time.
let expenses = loadExpenses();

// Which expense is being edited right now. null = we're adding a new one.
let editingId = null;

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

// Builds one row button. data-action says WHAT it does, data-id says WHICH expense.
function makeRowButton(label, action, expense) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.dataset.action = action;   // becomes data-action="edit" / "delete"
  button.dataset.id = expense.id;   // becomes data-id="1795...-ab12"
  button.setAttribute('aria-label', `${label} ${expense.category} expense of ${formatPeso(expense.amount)}`);
  return button;
}

// ===== 5. Render: draw the expenses array onto the page =====
function renderList() {
  list.innerHTML = ''; // clear the old list, then rebuild it from the array

  // Newest first. We sort a COPY ([...expenses]) so the saved data isn't reordered.
  // Dates are "YYYY-MM-DD" text, which sorts correctly as plain text.
  // Same date? The id starts with the time it was created, so newer ids win.
  const sorted = [...expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );

  for (const expense of sorted) {
    const item = document.createElement('li');

    // The expense text.
    // textContent (not innerHTML) shows text exactly as typed,
    // so a note like "<b>hi</b>" can't turn into real HTML.
    const text = document.createElement('span');
    text.textContent =
      `${formatPeso(expense.amount)} · ${expense.category} · ${expense.date}` +
      (expense.note ? ` · ${expense.note}` : '');

    item.append(
      text, ' ',
      makeRowButton('Edit', 'edit', expense), ' ',
      makeRowButton('Delete', 'delete', expense)
    );
    list.appendChild(item);
  }

  // Show "No expenses yet" only when the list is empty
  emptyMessage.hidden = expenses.length > 0;

  // Total: reduce() walks the array and adds each amount to a running sum (starting at 0)
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalEl.textContent = formatPeso(total);
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

function deleteExpense(id) {
  const expense = expenses.find((e) => e.id === id);
  if (!expense) return;

  // confirm() shows OK / Cancel and returns true only if OK was clicked
  const ok = confirm(`Delete ${formatPeso(expense.amount)} (${expense.category}) on ${expense.date}?`);
  if (!ok) return;

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

// ONE click listener on the whole list handles every Edit and Delete button
// (this is called "event delegation"). It still works for rows that are
// added later, because the list itself never gets replaced.
list.addEventListener('click', function (event) {
  // closest() finds the button that was clicked (or null if you clicked text)
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  if (button.dataset.action === 'edit') {
    startEdit(button.dataset.id);
  } else if (button.dataset.action === 'delete') {
    deleteExpense(button.dataset.id);
  }
});

// ===== 8. Start-up =====
resetForm(); // start in "add mode" with today's date
renderList();
