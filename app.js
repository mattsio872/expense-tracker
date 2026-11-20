// ===== 1. Find the HTML elements we need (using their id "name tags") =====
const form = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const noteInput = document.getElementById('note');
const list = document.getElementById('expense-list');
const emptyMessage = document.getElementById('empty-message');

// ===== 2. State: the app's data, kept in memory =====
// Every expense looks like: { id, amount, category, date, note }
// (Step 3 will save this to localStorage so it survives a refresh.)
let expenses = [];

// ===== 3. Helpers =====

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

// ===== 4. Render: draw the expenses array onto the page =====
function renderList() {
  list.innerHTML = ''; // clear the old list, then rebuild it from the array

  for (const expense of expenses) {
    const item = document.createElement('li');
    // textContent (not innerHTML) shows text exactly as typed,
    // so a note like "<b>hi</b>" can't turn into real HTML.
    item.textContent =
      `₱${expense.amount.toFixed(2)} · ${expense.category} · ${expense.date}` +
      (expense.note ? ` · ${expense.note}` : '');
    list.appendChild(item);
  }

  // Show "No expenses yet" only when the list is empty
  emptyMessage.hidden = expenses.length > 0;
}

// ===== 5. Actions =====
function addExpense(expense) {
  expenses.push(expense);
  renderList();
}

// ===== 6. Events: react to what the user does =====
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

  addExpense({
    id: makeId(),
    amount: Math.round(amount * 100) / 100, // keep 2 decimal places
    category: categoryInput.value,
    date: dateInput.value,
    note: noteInput.value.trim(),
  });

  // Get the form ready for the next expense
  form.reset();
  dateInput.value = todayString();
  amountInput.focus();
});

// ===== 7. Start-up =====
dateInput.value = todayString(); // pre-fill today's date
renderList();
