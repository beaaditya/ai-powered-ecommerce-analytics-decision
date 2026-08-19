/**
 * Executive Overview Dashboard Controller
 * Connects frontend/index.html to real PostgreSQL analytics endpoints:
 * - GET http://127.0.0.1:8000/api/dashboard/overview
 * - GET http://127.0.0.1:8000/api/insights
 */

const API_BASE_URL = window.API_BASE_URL || (
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  window.location.port !== '8000' && window.location.port !== ''
    ? 'http://127.0.0.1:8000'
    : ''
);

document.addEventListener('DOMContentLoaded', () => {
  initSidebarToggle();
  fetchDashboardOverview();
  fetchAutomatedInsights();
  initAutomatedAnalysis();
});

/**
 * Mobile Sidebar Toggle Handler
 */
function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

/**
 * Fetch and Render Overview Metrics & Charts
 */
async function fetchDashboardOverview() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/overview`);
    if (!response.ok) {
      throw new Error(`Overview API HTTP error ${response.status}`);
    }
    const data = await response.json();

    // 1. Update KPI Cards
    renderKPIs(data.kpis);

    // 2. Render Charts
    renderRevenueTrendChart(data.revenue_trend || []);
    renderCustomerTrendChart(data.customer_trend || []);
    renderDepartmentRevenueChart(data.department_revenue || []);
    renderCategoryRevenueChart(data.category_revenue || []);
    renderCustomerSegmentChart(data.customer_segments || []);

  } catch (error) {
    console.error('Failed to load dashboard overview data:', error);
    renderDashboardError('Failed to load live overview metrics. Ensure FastAPI backend is running on 127.0.0.1:8000.');
  }
}

/**
 * Render KPI Cards with Formatted Numbers
 */
function renderKPIs(kpis) {
  if (!kpis) return;

  const totalRevEl = document.getElementById('kpi-total-revenue');
  const activeCustEl = document.getElementById('kpi-active-customers');
  const totalUnitsEl = document.getElementById('kpi-total-units');
  const avgBasketEl = document.getElementById('kpi-avg-basket');
  const purchaseFreqEl = document.getElementById('kpi-purchase-freq');

  if (totalRevEl) {
    totalRevEl.textContent = formatCurrency(kpis.total_revenue || 0);
  }
  if (activeCustEl) {
    activeCustEl.textContent = formatCompactNumber(kpis.active_customers || 0) + ' Households';
  }
  if (totalUnitsEl) {
    totalUnitsEl.textContent = formatCompactNumber(kpis.total_units_sold || 0) + ' Units';
  }
  if (avgBasketEl) {
    avgBasketEl.textContent = formatCurrency(kpis.avg_basket_value || 0);
  }
  if (purchaseFreqEl) {
    purchaseFreqEl.textContent = (kpis.purchase_frequency || 0).toFixed(1) + ' Visits/HH';
  }
}

/**
 * Fetch and Render Automated Business Insights
 */
async function fetchAutomatedInsights() {
  const container = document.getElementById('automated-insights-container');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/insights`);
    if (!response.ok) {
      throw new Error(`Insights API HTTP error ${response.status}`);
    }
    const data = await response.json();
    const insights = data.insights || [];

    if (insights.length === 0) {
      container.innerHTML = `
        <div class="placeholder-box">
          <span class="ph-icon">✅</span>
          <span class="ph-label">No Anomaly Insights Detected</span>
          <span class="ph-desc">All retail performance metrics are operating within expected historical baseline thresholds.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="insights-grid">
        ${insights.map(item => createInsightCardHTML(item)).join('')}
      </div>
    `;

  } catch (error) {
    console.error('Failed to load automated insights:', error);
    container.innerHTML = `
      <div class="placeholder-box error-box">
        <span class="ph-icon">⚠️</span>
        <span class="ph-label">Insights Connection Error</span>
        <span class="ph-desc">Unable to retrieve live insights from backend /api/insights.</span>
      </div>
    `;
  }
}

/**
 * Generate Insight Card HTML
 */
function createInsightCardHTML(insight) {
  const severity = (insight.severity || 'low').toLowerCase();
  const severityBadgeClass = 
    severity === 'high' ? 'severity-high' :
    severity === 'medium' ? 'severity-medium' : 'severity-low';

  const severityLabel = 
    severity === 'high' ? 'CRITICAL RISK' :
    severity === 'medium' ? 'ATTENTION' : 'OPPORTUNITY';

  const changeText = insight.change_pct !== null && insight.change_pct !== undefined
    ? `<span class="insight-change ${insight.change_pct >= 0 ? 'pos' : 'neg'}">${insight.change_pct >= 0 ? '+' : ''}${insight.change_pct.toFixed(2)}%</span>`
    : '';

  const queryText = encodeURIComponent(`Investigate insight: ${insight.title} - ${insight.description}`);

  return `
    <div class="insight-card-item severity-border-${severity}">
      <div class="insight-card-header">
        <span class="severity-badge ${severityBadgeClass}">${severityLabel}</span>
        ${changeText}
      </div>
      <h4 class="insight-card-title">${escapeHTML(insight.title || 'Business Insight')}</h4>
      <p class="insight-card-desc">${escapeHTML(insight.description || '')}</p>
      <div style="margin-top: 10px; text-align: right;">
        <a href="ai.html?q=${queryText}" class="btn-investigate-ai" style="font-size: 0.75rem; color: #E2C99B; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
          <span>Investigate with AI</span>
          <span>→</span>
        </a>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Chart.js Renderers
   ========================================================================== */

/** Common Dark Theme Chart Configuration Defaults */
const chartThemeOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94A3B8',
        font: { family: 'Inter', size: 12, weight: 500 }
      }
    },
    tooltip: {
      backgroundColor: '#0B0E14',
      titleColor: '#F8FAFC',
      bodyColor: '#E2C99B',
      borderColor: 'rgba(226, 201, 155, 0.25)',
      borderWidth: 1,
      padding: 10,
      boxPadding: 4
    }
  },
  scales: {
    x: {
      ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(255, 255, 255, 0.03)' }
    },
    y: {
      ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(255, 255, 255, 0.03)' }
    }
  }
};

/**
 * 1. Weekly Revenue Trend Line Chart
 */
function renderRevenueTrendChart(trendData) {
  const ctx = document.getElementById('chart-revenue-trend');
  if (!ctx) return;

  const labels = trendData.map(d => `W${d.week_no}`);
  const values = trendData.map(d => d.revenue);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Weekly Revenue ($)',
        data: values,
        borderColor: '#E2C99B',
        backgroundColor: 'rgba(226, 201, 155, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#E2C99B'
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        ...chartThemeOptions.plugins,
        tooltip: {
          ...chartThemeOptions.plugins.tooltip,
          callbacks: {
            label: (context) => `Revenue: ${formatCurrency(context.parsed.y)}`
          }
        }
      },
      scales: {
        ...chartThemeOptions.scales,
        y: {
          ...chartThemeOptions.scales.y,
          ticks: {
            color: '#64748B',
            callback: (val) => '$' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
          }
        }
      }
    }
  });
}

/**
 * 2. Weekly Active Customers Line Chart
 */
function renderCustomerTrendChart(trendData) {
  const ctx = document.getElementById('chart-customer-trend');
  if (!ctx) return;

  const labels = trendData.map(d => `W${d.week_no}`);
  const values = trendData.map(d => d.active_households);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Active Households',
        data: values,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#10B981'
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        ...chartThemeOptions.plugins,
        tooltip: {
          ...chartThemeOptions.plugins.tooltip,
          callbacks: {
            label: (context) => `Active Shoppers: ${context.parsed.y.toLocaleString()} HH`
          }
        }
      }
    }
  });
}

/**
 * 3. Department Revenue Horizontal Bar Chart
 */
function renderDepartmentRevenueChart(deptData) {
  const ctx = document.getElementById('chart-department-revenue');
  if (!ctx) return;

  // Take top 8 departments
  const topDepts = deptData.slice(0, 8);
  const labels = topDepts.map(d => d.department);
  const values = topDepts.map(d => d.revenue);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Department Sales ($)',
        data: values,
        backgroundColor: 'rgba(226, 201, 155, 0.85)',
        borderColor: '#E2C99B',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        ...chartThemeOptions.plugins,
        legend: { display: false },
        tooltip: {
          ...chartThemeOptions.plugins.tooltip,
          callbacks: {
            label: (context) => `Sales: ${formatCurrency(context.parsed.x)}`
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
        y: {
          ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11, weight: 600 } },
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * 4. Top Categories by Revenue Horizontal Bar Chart
 */
function renderCategoryRevenueChart(catData) {
  const ctx = document.getElementById('chart-category-revenue');
  if (!ctx) return;

  const topCats = catData.slice(0, 10);
  const labels = topCats.map(d => d.category);
  const values = topCats.map(d => d.revenue);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Category Revenue ($)',
        data: values,
        backgroundColor: 'rgba(168, 85, 247, 0.75)',
        borderColor: '#A855F7',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        ...chartThemeOptions.plugins,
        legend: { display: false },
        tooltip: {
          ...chartThemeOptions.plugins.tooltip,
          callbacks: {
            label: (context) => `Revenue: ${formatCurrency(context.parsed.x)}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#64748B',
            callback: (val) => '$' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
          },
          grid: { color: 'rgba(255, 255, 255, 0.03)' }
        },
        y: {
          ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11, weight: 500 } },
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * 5. Customer Segment Distribution Donut Chart
 */
function renderCustomerSegmentChart(segmentData) {
  const ctx = document.getElementById('chart-customer-segments');
  if (!ctx) return;

  const labels = segmentData.map(d => d.segment);
  const values = segmentData.map(d => d.count);
  const totalCount = values.reduce((a, b) => a + b, 0);

  const colors = [
    '#38BDF8', // Recent Customers (Sky)
    '#EF4444', // At Risk High Value (Refined Red)
    '#8B5CF6', // Regular Customers (Muted Violet)
    '#F59E0B', // At Risk (Muted Amber)
    '#10B981', // Loyal Customers (Emerald)
    '#E2C99B'  // Champions (Champagne Gold)
  ];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#080A0E',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94A3B8',
            font: { family: 'Inter', size: 11, weight: 500 },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#0B0E14',
          titleColor: '#F8FAFC',
          bodyColor: '#E2C99B',
          borderColor: 'rgba(226, 201, 155, 0.25)',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const val = context.parsed;
              const pct = totalCount > 0 ? ((val / totalCount) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${val.toLocaleString()} HH (${pct}%)`;
            }
          }
        }
      },
      cutout: '68%'
    }
  });
}

/* ==========================================================================
   Formatting & Utility Functions
   ========================================================================== */

function formatCurrency(val) {
  if (typeof val !== 'number') val = parseFloat(val) || 0;
  if (val >= 1000000) {
    return '$' + (val / 1000000).toFixed(2) + 'M';
  }
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCompactNumber(val) {
  if (typeof val !== 'number') val = parseFloat(val) || 0;
  if (val >= 1000000) {
    return (val / 1000000).toFixed(2) + 'M';
  }
  if (val >= 1000) {
    return (val / 1000).toFixed(1) + 'k';
  }
  return val.toLocaleString();
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDashboardError(message) {
  const container = document.querySelector('.dashboard-content');
  if (container) {
    const errBanner = document.createElement('div');
    errBanner.className = 'placeholder-box error-box';
    errBanner.style.marginBottom = '20px';
    errBanner.innerHTML = `
      <span class="ph-icon">⚠️</span>
      <span class="ph-label">Dashboard Data Error</span>
      <span class="ph-desc">${escapeHTML(message)}</span>
    `;
    container.insertBefore(errBanner, container.firstChild);
  }
}

/**
 * Automated Business Analysis Pipeline Handlers
 */
function initAutomatedAnalysis() {
  const runBtn = document.getElementById('btn-run-analysis');
  if (!runBtn) return;

  runBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await triggerAutomatedAnalysis();
  });
}

async function triggerAutomatedAnalysis() {
  const runBtn = document.getElementById('btn-run-analysis');
  const container = document.getElementById('automated-analysis-container');
  const badge = document.getElementById('analysis-timestamp-badge');

  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = `<span>⏳ Scanning...</span>`;
  }

  if (container) {
    container.innerHTML = `
      <div class="placeholder-box" style="padding: 32px 20px;">
        <div class="typing-dots" style="margin: 0 auto 12px auto;"><span></span><span></span><span></span></div>
        <span class="ph-label" style="color:#F8FAFC;">Executing Automated Business Analysis Scan...</span>
        <span class="ph-desc">Evaluating live metrics across revenue, customer RFM cohorts, department velocity, and promotional campaigns.</span>
      </div>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Analysis Pipeline HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (badge) {
      badge.textContent = `Completed at ${data.generated_at ? data.generated_at.split(' ')[1] : 'Just now'}`;
    }

    renderAutomatedAnalysis(data);

  } catch (error) {
    console.error('Automated Analysis Pipeline failed:', error);
    if (container) {
      container.innerHTML = `
        <div class="placeholder-box error-box">
          <span class="ph-icon">⚠️</span>
          <span class="ph-label">Pipeline Execution Error</span>
          <span class="ph-desc">Unable to run automated analysis pipeline. Ensure FastAPI backend is running on 127.0.0.1:8000.</span>
        </div>
      `;
    }
  } finally {
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = `<span>⚡ Run Analysis</span>`;
    }
  }
}

function renderAutomatedAnalysis(data) {
  const container = document.getElementById('automated-analysis-container');
  if (!container) return;

  const findings = data.findings || [];
  const risks = data.risks || [];
  const opps = data.opportunities || [];
  const recs = data.recommendations || [];

  // Map analysis types to dashboard links
  const domainLinks = {
    'revenue': { label: 'Sales Overview', url: 'index.html' },
    'customers': { label: 'Customer Intelligence', url: 'customers.html' },
    'products': { label: 'Product & Sales', url: 'products.html' },
    'marketing': { label: 'Marketing & Promos', url: 'marketing.html' }
  };

  container.innerHTML = `
    <div class="pipeline-analysis-card">
      <!-- 1. Executive Summary -->
      <div class="pipeline-summary-box">
        ${formatMarkdownParagraphs(data.summary || 'Summary unavailable.')}
      </div>

      <!-- 2. Domain Findings Chips with Deep-Links -->
      ${findings.length > 0 ? `
        <div class="pipeline-findings-grid">
          ${findings.slice(0, 6).map(f => {
            const domain = domainLinks[f.analysis_type] || { label: 'Analytics', url: 'index.html' };
            return `
              <div class="pipeline-finding-item">
                <div class="finding-item-header">
                  <a href="${domain.url}" class="finding-tag-chip">
                    <span>${domain.label}</span>
                    <span>→</span>
                  </a>
                  <span style="font-size:0.6875rem; color:#64748B;">${escapeHTML(f.source || '')}</span>
                </div>
                <span style="font-size:0.8125rem; color:#CBD5E1; line-height:1.4;">${escapeHTML(f.finding || '')}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <!-- 3. Two-Column Risks & Opportunities -->
      <div class="pipeline-cols-grid">
        <div class="pipeline-col-card">
          <div class="pipeline-col-title" style="color: #F87171;">
            <span>⚠️</span>
            <span>Key Business Risks (${risks.length})</span>
          </div>
          <ul class="report-list">
            ${risks.map(r => `<li>${escapeHTML(r)}</li>`).join('')}
          </ul>
        </div>

        <div class="pipeline-col-card">
          <div class="pipeline-col-title" style="color: #38BDF8;">
            <span>💡</span>
            <span>Growth Opportunities (${opps.length})</span>
          </div>
          <ul class="report-list">
            ${opps.map(o => `<li>${escapeHTML(o)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- 4. Strategic Recommendations -->
      <div class="pipeline-col-card" style="background: rgba(30, 41, 59, 0.7); border-color: rgba(99, 102, 241, 0.3);">
        <div class="pipeline-col-title" style="color: #A78BFA;">
          <span>🚀</span>
          <span>Prioritized Strategic Recommendations (${recs.length})</span>
        </div>
        <ol class="report-list-numbered">
          ${recs.map(r => `<li>${escapeHTML(r)}</li>`).join('')}
        </ol>
      </div>
    </div>
  `;
}

function formatMarkdownParagraphs(text) {
  if (!text) return '';
  const clean = escapeHTML(text);
  return clean.split(/\n\s*\n/).map(p => `<p style="margin-bottom: 8px;">${p.replace(/\n/g, '<br>')}</p>`).join('');
}

