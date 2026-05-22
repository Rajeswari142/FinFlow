/* ============================================================
   FinFlow — app.js
   Entry point: initialisation and user-action handlers
   ============================================================ */

'use strict';

// ── INIT ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadData();

  // Set today's date as default in the add form
  document.getElementById('expDate').valueAsDate = new Date();

  // Pre-fill budget input if a budget is already saved
  if (budget) {
    document.getElementById('budgetInput').value = budget;
  }

  // Close edit modal when clicking outside the modal box
  document.getElementById('editModal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });

  // Initialise charts and render everything
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  initCharts(isDark);
  renderAll();
});

// ── RENDER ALL ────────────────────────────────────────────────

/** Convenience: re-render summary cards, list, and charts. */
function renderAll() {
  renderSummary();
  renderList();
  renderCharts();
}

// ── BUDGET ────────────────────────────────────────────────────

/** Read the budget input and persist it. */
function setBudget() {
  const v = parseFloat(document.getElementById('budgetInput').value);
  if (isNaN(v) || v < 0) {
    showToast('Enter a valid budget amount', '⚠');
    return;
  }
  budget = v;
  saveBudget();
  renderSummary();
  showToast('Budget updated!', '✓');
}

// ── ADD EXPENSE ───────────────────────────────────────────────

/** Validate the add form and create a new expense. */
function saveExpense() {
  const title    = document.getElementById('expTitle').value.trim();
  const amount   = parseFloat(document.getElementById('expAmount').value);
  const category = document.getElementById('expCategory').value;
  const date     = document.getElementById('expDate').value;

  if (!title)              { showToast('Please enter a title',        '⚠'); return; }
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', '⚠'); return; }
  if (!date)               { showToast('Please select a date',        '⚠'); return; }

  addExpense(title, amount, category, date);
  renderAll();
  resetForm();
  showToast('Expense added!', '✓');
}

/** Clear the form and hide the Cancel button. */
function cancelEdit() {
  resetForm();
  document.getElementById('cancelBtn').style.display = 'none';
  document.getElementById('formTitle').textContent   = 'Add Expense';
}

// ── EDIT EXPENSE (MODAL) ──────────────────────────────────────

/** Save changes from the edit modal. */
function saveEdit() {
  const title    = document.getElementById('mTitle').value.trim();
  const amount   = parseFloat(document.getElementById('mAmount').value);
  const category = document.getElementById('mCategory').value;
  const date     = document.getElementById('mDate').value;

  if (!title || !amount || amount <= 0) {
    showToast('Please fill all fields correctly', '⚠');
    return;
  }

  const ok = updateExpense(editId, title, amount, category, date);
  if (ok) {
    renderAll();
    closeModal();
    showToast('Expense updated!', '✏');
  } else {
    showToast('Could not find expense to update', '⚠');
  }
}

// ── DELETE EXPENSE ────────────────────────────────────────────

/**
 * Delete an expense by ID with a quick animation.
 * @param {number} id
 */
function deleteExpense(id) {
  // Fade out the row before removing from state
  const el = document.getElementById(`ei-${id}`);
  if (el) {
    el.style.transition = 'opacity 0.2s, transform 0.2s';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(16px)';
    setTimeout(() => {
      removeExpense(id);
      renderAll();
    }, 200);
  } else {
    removeExpense(id);
    renderAll();
  }
  showToast('Expense deleted', '🗑');
}

// ── EXPORT CSV ────────────────────────────────────────────────

/** Download all expenses as a CSV file. */
function exportCSV() {
  if (expenses.length === 0) {
    showToast('No data to export', '⚠');
    return;
  }

  const header = ['Title', 'Amount (₹)', 'Category', 'Date'];
  const rows   = expenses.map(e => [
    `"${e.title.replace(/"/g, '""')}"`, // escape quotes inside titles
    e.amount,
    e.category,
    e.date,
  ]);

  const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `finflow_expenses_${new Date().toISOString().slice(0, 10)}.csv`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('CSV exported!', '⬇');
}
