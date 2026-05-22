/* ============================================================
   FinFlow — charts.js
   Chart initialisation and update helpers (Chart.js 4)
   ============================================================ */

'use strict';

let donutChart = null;
let lineChart  = null;

// ── INITIALISE ────────────────────────────────────────────────

/**
 * Create both charts. Call once on DOMContentLoaded.
 * @param {boolean} dark – whether the current theme is dark
 */
function initCharts(dark) {
  const { gridColor, textColor } = themeTokens(dark);

  Chart.defaults.color       = textColor;
  Chart.defaults.borderColor = gridColor;
  Chart.defaults.font.family = "'DM Mono', monospace";

  // ── DONUT: spending by category ──────────────────────────
  donutChart = new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: CAT_CHART_COLORS,
        borderWidth: 2,
        borderColor: dark ? '#111118' : '#ffffff',
      }],
    },
    options: {
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12, boxWidth: 12, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ₹${ctx.parsed.toLocaleString('en-IN')}`,
          },
        },
      },
      animation: { animateScale: true },
    },
  });

  // ── LINE: daily spending trend ────────────────────────────
  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Daily Spend',
        data: [],
        fill: true,
        tension: 0.4,
        borderColor: '#7c6aff',
        backgroundColor: 'rgba(124,106,255,0.15)',
        pointBackgroundColor: '#7c6aff',
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { maxTicksLimit: 7, font: { size: 10 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            font: { size: 10 },
            callback: v => '₹' + v.toLocaleString('en-IN'),
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN')}`,
          },
        },
      },
    },
  });
}

// ── UPDATE DATA ───────────────────────────────────────────────

/** Push latest expense data into both charts and re-render. */
function renderCharts() {
  if (!donutChart || !lineChart) return;

  // Donut
  const { labels: catLabels, amounts: catAmounts } = spendingByCategory();
  donutChart.data.labels = catLabels;
  donutChart.data.datasets[0].data = catAmounts;
  donutChart.data.datasets[0].backgroundColor =
    catLabels.map((_, i) => CAT_CHART_COLORS[i % CAT_CHART_COLORS.length]);
  donutChart.update();

  // Line
  const { labels: dayLabels, amounts: dayAmounts } = dailySpending(14);
  lineChart.data.labels = dayLabels;
  lineChart.data.datasets[0].data = dayAmounts;
  lineChart.update();
}

// ── THEME SYNC ────────────────────────────────────────────────

/** Update chart colours when the theme toggles. */
function updateChartsTheme() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  const { gridColor, textColor } = themeTokens(dark);

  Chart.defaults.color       = textColor;
  Chart.defaults.borderColor = gridColor;

  if (donutChart) {
    donutChart.data.datasets[0].borderColor = dark ? '#111118' : '#ffffff';
    donutChart.update();
  }
  if (lineChart) {
    lineChart.options.scales.x.grid.color = gridColor;
    lineChart.options.scales.y.grid.color = gridColor;
    lineChart.update();
  }
}

// ── HELPERS ───────────────────────────────────────────────────

function themeTokens(dark) {
  return {
    gridColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    textColor: dark ? '#9090b0'                 : '#5a5a7a',
  };
}
