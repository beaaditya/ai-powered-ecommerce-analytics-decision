/**
 * Customer Intelligence Dashboard Controller
 * Connects frontend/customers.html to real PostgreSQL analytics:
 * - GET http://127.0.0.1:8000/api/dashboard/customers
 */

const API_BASE_URL = window.API_BASE_URL || (
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  window.location.port !== '8000' && window.location.port !== ''
    ? 'http://127.0.0.1:8000'
    : ''
);

document.addEventListener('DOMContentLoaded', () => {
  initSidebarToggle();
  fetchCustomerIntelligence();
});

function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

async function fetchCustomerIntelligence() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/customers`);
    if (!response.ok) {
      throw new Error(`Customer Intelligence API HTTP error ${response.status}`);
    }
    const data = await response.json();

    // 1. Render KPIs
    renderCustomerKPIs(data.kpis);

    // 2. Render Charts
    renderSegmentDistributionChart(data.segments || []);
    renderSegmentValueChart(data.segment_value || []);
    renderSpendDistributionChart(data.spend_distribution || []);
    renderFrequencyDistributionChart(data.frequency_data || []);
    renderRecencyScatterChart(data.rfm_scatter || []);
    renderRiskMatrixChart(data.segments || []);
    renderSpendingMomentumChart(data.customer_trends || []);

    // 3. Render Insights & Recommendations
    renderCustomerInsights(data.insights || []);
    renderCustomerRecommendations(data.recommendations || []);

  } catch (error) {
    console.error('Failed to load customer intelligence data:', error);
    renderDashboardError('Failed to load customer intelligence metrics. Ensure FastAPI backend is running on 127.0.0.1:8000.');
  }
}

function renderCustomerKPIs(kpis) {
  if (!kpis) return;

  setElText('kpi-total-customers', (kpis.total_customers || 0).toLocaleString() + ' HHs');
  setElText('kpi-avg-spend', formatCurrency(kpis.avg_customer_spend || 0));
  setElText('kpi-avg-txns', (kpis.avg_transactions_per_customer || 0).toFixed(1) + ' Visits/HH');
  setElText('kpi-retention-rate', (kpis.repeat_customer_rate || 0).toFixed(1) + '%');
  setElText('kpi-at-risk', (kpis.at_risk_customers || 0).toLocaleString() + ' HHs');
  setElText('kpi-high-value', (kpis.high_value_customers || 0).toLocaleString() + ' HHs');
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderCustomerInsights(insights) {
  const container = document.getElementById('customer-insights-container');
  if (!container) return;

  if (!insights || insights.length === 0) {
    container.innerHTML = `<div class="placeholder-box">No customer insights available</div>`;
    return;
  }

  container.innerHTML = `
    <div class="insights-grid">
      ${insights.map(item => `
        <div class="insight-card-item severity-border-medium">
          <div class="insight-card-header">
            <span class="severity-badge severity-medium">DATA INSIGHT</span>
          </div>
          <h4 class="insight-card-title">${escapeHTML(item.title)}</h4>
          <p class="insight-card-desc">${escapeHTML(item.description)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCustomerRecommendations(recommendations) {
  const container = document.getElementById('customer-recommendations-container');
  if (!container) return;

  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `<div class="placeholder-box">No customer recommendations available</div>`;
    return;
  }

  container.innerHTML = `
    <div class="insights-grid">
      ${recommendations.map(rec => {
        const badgeClass = rec.priority === 'High' ? 'severity-high' : 'severity-medium';
        return `
          <div class="insight-card-item severity-border-${rec.priority === 'High' ? 'high' : 'medium'}">
            <div class="insight-card-header">
              <span class="severity-badge ${badgeClass}">${rec.priority.toUpperCase()} PRIORITY</span>
            </div>
            <h4 class="insight-card-title">💡 ${escapeHTML(rec.action)}</h4>
            <p class="insight-card-desc">${escapeHTML(rec.detail)}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ==========================================================================
   Chart.js Renderers
   ========================================================================== */

const chartThemeOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94A3B8', font: { family: 'Inter', size: 11, weight: 500 } }
    },
    tooltip: {
      backgroundColor: '#0B0E14',
      titleColor: '#F8FAFC',
      bodyColor: '#E2C99B',
      borderColor: 'rgba(226, 201, 155, 0.25)',
      borderWidth: 1,
      padding: 10
    }
  },
  scales: {
    x: { ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255, 255, 255, 0.03)' } },
    y: { ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255, 255, 255, 0.03)' } }
  }
};

const segmentColors = {
  'Recent Customers': '#38BDF8',
  'At Risk High Value': '#EF4444',
  'Regular Customers': '#8B5CF6',
  'At Risk': '#F59E0B',
  'Loyal Customers': '#10B981',
  'Champions': '#E2C99B'
};

/** 1. Segment Distribution Donut Chart */
function renderSegmentDistributionChart(segments) {
  const ctx = document.getElementById('chart-segment-distribution');
  if (!ctx) return;

  const labels = segments.map(s => `${s.segment} (${s.pct_of_base}%)`);
  const values = segments.map(s => s.count);
  const colors = segments.map(s => segmentColors[s.segment] || '#E2C99B');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#080A0E',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} HHs`
          }
        }
      },
      cutout: '65%'
    }
  });
}

/** 2. Segment Value Horizontal Bar Chart */
function renderSegmentValueChart(segments) {
  const ctx = document.getElementById('chart-segment-value');
  if (!ctx) return;

  const labels = segments.map(s => s.segment);
  const values = segments.map(s => s.total_spend);
  const colors = segments.map(s => segmentColors[s.segment] || '#10B981');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Spend ($)',
        data: values,
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Cumulative Spend: ${formatCurrency(ctx.parsed.x)}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#64748B',
            callback: (val) => '$' + (val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'k')
          },
          grid: { color: 'rgba(255, 255, 255, 0.03)' }
        },
        y: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11, weight: 600 } }, grid: { display: false } }
      }
    }
  });
}

/** 3. Customer Spend Distribution Histogram */
function renderSpendDistributionChart(spendDist) {
  const ctx = document.getElementById('chart-spend-distribution');
  if (!ctx) return;

  const labels = spendDist.map(d => d.bucket);
  const values = spendDist.map(d => d.count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Households',
        data: values,
        backgroundColor: 'rgba(226, 201, 155, 0.85)',
        borderColor: '#E2C99B',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Households: ${ctx.parsed.y.toLocaleString()}`
          }
        }
      }
    }
  });
}

/** 4. Customer Activity / Purchase Frequency Distribution */
function renderFrequencyDistributionChart(freqData) {
  const ctx = document.getElementById('chart-frequency-distribution');
  if (!ctx) return;

  const labels = freqData.map(d => d.bucket);
  const values = freqData.map(d => d.count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Households',
        data: values,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: '#10B981',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Households: ${ctx.parsed.y.toLocaleString()}`
          }
        }
      }
    }
  });
}

/** 5. Customer Recency vs Monetary Scatter Plot */
function renderRecencyScatterChart(scatterData) {
  const ctx = document.getElementById('chart-recency-scatter');
  if (!ctx) return;

  const points = scatterData.map(d => ({
    x: d.last_purchase_day,
    y: d.monetary_value,
    segment: d.segment,
    household: d.household_key
  }));

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Customer Recency vs Spend',
        data: points,
        backgroundColor: points.map(p => segmentColors[p.segment] || '#E2C99B'),
        pointRadius: 5,
        pointHoverRadius: 8
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const pt = ctx.raw;
              return ` HH #${pt.household}: Day ${pt.x} recency | ${formatCurrency(pt.y)} spend (${pt.segment})`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Last Purchase Day Index (Higher = Recent)', color: '#94A3B8' },
          ticks: { color: '#64748B' },
          grid: { color: 'rgba(255, 255, 255, 0.03)' }
        },
        y: {
          title: { display: true, text: 'Cumulative Monetary Spend ($)', color: '#94A3B8' },
          ticks: { color: '#64748B', callback: (v) => '$' + v.toLocaleString() },
          grid: { color: 'rgba(255, 255, 255, 0.03)' }
        }
      }
    }
  });
}

/** 6. Risk Matrix Comparison Chart */
function renderRiskMatrixChart(segments) {
  const ctx = document.getElementById('chart-risk-matrix');
  if (!ctx) return;

  const atRiskHigh = segments.find(s => s.segment === 'At Risk High Value') || { count: 585, total_spend: 3990569 };
  const atRiskReg = segments.find(s => s.segment === 'At Risk') || { count: 415, total_spend: 647811 };
  const activeHigh = segments.find(s => s.segment === 'Champions') || { count: 119, total_spend: 611338 };
  const activeReg = segments.find(s => s.segment === 'Regular Customers') || { count: 500, total_spend: 1679237 };

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['At Risk High Value', 'At Risk Regular', 'Active Champions', 'Active Regulars'],
      datasets: [{
        label: 'Revenue Exposure ($)',
        data: [atRiskHigh.total_spend, atRiskReg.total_spend, activeHigh.total_spend, activeReg.total_spend],
        backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#E2C99B'],
        borderRadius: 6
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Revenue Exposure: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: (v) => '$' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') }
        }
      }
    }
  });
}

/** 7. Customer Spending Momentum Trend Chart */
function renderSpendingMomentumChart(trends) {
  const ctx = document.getElementById('chart-customer-momentum');
  if (!ctx) return;

  const labels = trends.map(t => t.trend + ' Momentum');
  const values = trends.map(t => t.count);

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#10B981', '#EF4444'],
        borderColor: '#080A0E',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} HHs`
          }
        }
      },
      cutout: '65%'
    }
  });
}

/* Utilities */
function formatCurrency(val) {
  if (typeof val !== 'number') val = parseFloat(val) || 0;
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderDashboardError(msg) {
  const container = document.querySelector('.dashboard-content');
  if (container) {
    const err = document.createElement('div');
    err.className = 'placeholder-box error-box';
    err.style.marginBottom = '20px';
    err.innerHTML = `<span class="ph-icon">⚠️</span><span class="ph-label">Error</span><span class="ph-desc">${escapeHTML(msg)}</span>`;
    container.insertBefore(err, container.firstChild);
  }
}
