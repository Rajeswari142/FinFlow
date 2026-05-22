/* ============================================================
   FinFlow — ui.js
   All DOM rendering, toast notifications, and modal helpers
   ============================================================ */

'use strict';

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer = null;

/**
 * Show a brief toast notification.
 * @param {string} msg
 * @param {string} icon – emoji or symbol
 */
function showToast(msg, icon = '✓') {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── SUMMARY CARDS ─────────────────────────────────────────────

/** Re-render the four summary cards and the budget progress bar. */
function renderSummary() {
  const total     = totalSpent();
  const remaining = remainingBudget();
  const pct       = budgetUsedPct();

  document.getElementById('totalSpent').textContent      = fmt(total);
  document.getElementById('budgetDisplay').textContent   = fmt(budget);
  document.getElementById('remainingDisplay').textContent = budget > 0 ? fmt(remaining) : '—';
  document.getElementById('txCount').textContent         = expenses.length;
  document.getElementById('remainSub').textContent       = remaining < 0 ? '⚠ over budget!' : 'available to spend';

  // Progress bar
  const fill = document.getElementById('progressFill');
  fill.style.width = pct + '%';
  fill.className   = 'progress-bar-fill'
    + (pct >= 100 ? ' over' : pct >= 75 ? ' warn' : '');

  document.getElementById('progressPct').textContent = budget > 0
    ? `${pct.toFixed(1)}% used · ₹${Math.abs(remaining).toLocaleString('en-IN')} ${remaining < 0 ? 'over' : 'left'}`
    : 'Set a budget to track usage';
}

// ── EXPENSE LIST ──────────────────────────────────────────────

/** Re-render the scrollable expense list, applying search + filter. */
function renderList() {
  const search   = document.getElementById('searchInput').value;
  const cat      = document.getElementById('filterCat').value;
  const filtered = filterExpenses(search, cat);
  const list     = document.getElementById('expenseList');

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>${expenses.length ? 'No results found.' : 'No expenses yet.<br>Add your first expense!'}</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(buildExpenseHTML).join('');
}

/**
 * Build the HTML string for a single expense row.
 * @param {object} e – expense object
 * @returns {string}
 */
function buildExpenseHTML(e) {
  const cat     = CAT_COLORS[e.category] || CAT_COLORS.Others;
  const dateStr = new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return `
    <div class="expense-item" id="ei-${e.id}">
      <div class="cat-icon" style="background:${cat.bg};color:${cat.icon}">${cat.emoji}</div>
      <div class="expense-info">
        <div class="expense-title">${escHtml(e.title)}</div>
        <div class="expense-meta">
          ${dateStr} &nbsp;·&nbsp;
          <span style="color:${cat.icon}">${e.category}</span>
        </div>
      </div>
      <div class="expense-amount">${fmt(e.amount)}</div>
      <div class="expense-actions">
        <button class="action-btn edit" onclick="openEditModal(${e.id})" title="Edit">✏</button>
        <button class="action-btn del"  onclick="deleteExpense(${e.id})" title="Delete">✕</button>
      </div>
    </div>`;
}

// ── MODAL ─────────────────────────────────────────────────────

/**
 * Open the edit modal pre-filled with a given expense.
 * @param {number} id
 */
function openEditModal(id) {
  const e = expenses.find(x => x.id === id);
  if (!e) return;
  editId = id;

  document.getElementById('mTitle').value    = e.title;
  document.getElementById('mAmount').value   = e.amount;
  document.getElementById('mCategory').value = e.category;
  document.getElementById('mDate').value     = e.date;

  document.getElementById('editModal').classList.add('active');
}

/** Close the edit modal and clear editId. */
function closeModal() {
  document.getElementById('editModal').classList.remove('active');
  editId = null;
}

// ── FORM HELPERS ──────────────────────────────────────────────

/** Reset the add-expense form to its default state. */
function resetForm() {
  document.getElementById('expTitle').value    = '';
  document.getElementById('expAmount').value   = '';
  document.getElementById('expDate').valueAsDate = new Date();
  document.getElementById('expCategory').value = 'Food';
}

// ── THEME ─────────────────────────────────────────────────────

/** Toggle dark/light theme on <html> and update dependent UI. */
function toggleTheme() {
  const html    = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  html.setAttribute('data-theme', isLight ? 'dark' : 'light');
  document.getElementById('themeBtn').textContent = isLight ? '☀ Light' : '🌙 Dark';
  updateChartsTheme();
}

// ── FORMATTING ────────────────────────────────────────────────

/** Format a number as Indian-locale Rupees. */
function fmt(n) {
  return '₹' + (n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Basic HTML escaping to prevent XSS in dynamic content. */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
