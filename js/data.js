/* ============================================================
   FinFlow — data.js
   State, constants, and LocalStorage helpers
   ============================================================ */

'use strict';

// ── CATEGORY CONFIG ───────────────────────────────────────────
const CAT_COLORS = {
  Food:          { bg: '#ff6a6a22', icon: '#ff6a6a', emoji: '🍔' },
  Travel:        { bg: '#6abaff22', icon: '#6abaff', emoji: '✈️' },
  Shopping:      { bg: '#ffca6a22', icon: '#ffca6a', emoji: '🛍️' },
  Health:        { bg: '#6affb822', icon: '#6affb8', emoji: '💊' },
  Entertainment: { bg: '#c86aff22', icon: '#c86aff', emoji: '🎬' },
  Education:     { bg: '#6afff622', icon: '#6afff6', emoji: '📚' },
  Bills:         { bg: '#ff9f6a22', icon: '#ff9f6a', emoji: '🧾' },
  Others:        { bg: '#aaaaaa22', icon: '#aaaaaa', emoji: '📦' },
};

const CAT_CHART_COLORS = [
  '#7c6aff', '#ff6a6a', '#6affb8', '#ffca6a',
  '#6abaff', '#c86aff', '#ff9f6a', '#aaaaaa',
];

// ── STATE ─────────────────────────────────────────────────────
let expenses = [];
let budget   = 0;
let editId   = null;       // ID of item being edited in modal

// ── PERSISTENCE ──────────────────────────────────────────────
const STORAGE_KEY_EXPENSES = 'finflow_expenses';
const STORAGE_KEY_BUDGET   = 'finflow_budget';

/** Load state from LocalStorage */
function loadData() {
  try {
    expenses = JSON.parse(localStorage.getItem(STORAGE_KEY_EXPENSES) || '[]');
    budget   = parseFloat(localStorage.getItem(STORAGE_KEY_BUDGET)   || '0');
  } catch (e) {
    console.error('FinFlow: failed to load data', e);
    expenses = [];
    budget   = 0;
  }
}

/** Persist expenses to LocalStorage */
function saveData() {
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
}

/** Persist budget to LocalStorage */
function saveBudget() {
  localStorage.setItem(STORAGE_KEY_BUDGET, budget);
}

// ── EXPENSE CRUD ──────────────────────────────────────────────

/**
 * Add a new expense to the list.
 * @param {string} title
 * @param {number} amount
 * @param {string} category
 * @param {string} date  – YYYY-MM-DD
 * @returns {object} the new expense object
 */
function addExpense(title, amount, category, date) {
  const expense = { id: Date.now(), title, amount, category, date };
  expenses.unshift(expense);
  saveData();
  return expense;
}

/**
 * Update an existing expense by ID.
 * @returns {boolean} true if found and updated
 */
function updateExpense(id, title, amount, category, date) {
  const e = expenses.find(x => x.id === id);
  if (!e) return false;
  e.title    = title;
  e.amount   = amount;
  e.category = category;
  e.date     = date;
  saveData();
  return true;
}

/**
 * Remove an expense by ID.
 * @returns {boolean} true if found and removed
 */
function removeExpense(id) {
  const before = expenses.length;
  expenses = expenses.filter(e => e.id !== id);
  if (expenses.length !== before) { saveData(); return true; }
  return false;
}

// ── COMPUTED ──────────────────────────────────────────────────

/** Total amount spent across all expenses */
function totalSpent() {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/** Remaining budget (can be negative) */
function remainingBudget() {
  return budget - totalSpent();
}

/** Percentage of budget used (0–100, capped) */
function budgetUsedPct() {
  return budget > 0 ? Math.min((totalSpent() / budget) * 100, 100) : 0;
}

/**
 * Filter expenses by search term and/or category.
 * @param {string} search
 * @param {string} cat  – empty string = all
 * @returns {object[]}
 */
function filterExpenses(search, cat) {
  const q = (search || '').toLowerCase();
  return expenses.filter(e => {
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    const matchCat    = !cat || e.category === cat;
    return matchSearch && matchCat;
  });
}

/**
 * Spending totals grouped by category.
 * @returns {{ labels: string[], amounts: number[] }}
 */
function spendingByCategory() {
  const map = {};
  expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
  return { labels: Object.keys(map), amounts: Object.values(map) };
}

/**
 * Daily spending for the last N days (default 14).
 * @param {number} days
 * @returns {{ labels: string[], amounts: number[] }}
 */
function dailySpending(days = 14) {
  const dayMap = {};
  const today  = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  expenses.forEach(e => {
    if (Object.prototype.hasOwnProperty.call(dayMap, e.date)) {
      dayMap[e.date] += e.amount;
    }
  });

  const labels  = Object.keys(dayMap).map(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  });
  return { labels, amounts: Object.values(dayMap) };
}
