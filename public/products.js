/**
 * Product & Sales Intelligence Dashboard Controller
 * Connects frontend/products.html to real PostgreSQL analytics:
 * - GET http://127.0.0.1:8000/api/dashboard/products
 */

const API_BASE_URL = window.API_BASE_URL || (
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  window.location.port !== '8000' && window.location.port !== ''
    ? 'http://127.0.0.1:8000'
    : ''
);

document.addEventListener('DOMContentLoaded', () => {
  initSidebarToggle();
  fetchProductSalesData();
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

async function fetchProductSalesData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/products`);
    if (!response.ok) {
      throw new Error(`Product API HTTP error ${response.status}`);
    }
    const data = await response.json();

    // 1. Render KPIs
    renderProductKPIs(data.kpis);

    // 2. Render Charts
    renderDepartmentRevenueChart(data.department_revenue || []);
    renderDepartmentUnitsChart(data.department_units || []);
    renderCategoryRevenueChart(data.category_revenue || []);
    renderRevenueTrendChart(data.revenue_trend || []);
    renderRevenueUnitsScatterChart(data.revenue_units_scatter || []);
    renderTopProductsRevenueChart(data.top_products_revenue || []);
    renderTopProductsUnitsChart(data.top_products_units || []);
    renderParetoChart(data.pareto_data || {});

    // 3. Render Product Performance Table
    renderProductTable(data.product_table || []);

    // 4. Render Insights & Recommendations
    renderProductInsights(data.insights || []);
    renderProductRecommendations(data.recommendations || []);

  } catch (error) {
    console.error('Failed to load product & sales data:', error);
    renderDashboardError('Failed to load product metrics. Ensure FastAPI backend is running on 127.0.0.1:8000.');
  }
}

function renderProductKPIs(kpis) {
  if (!kpis) return;

  setElText('kpi-total-revenue', formatCurrency(kpis.total_revenue || 0));
  setElText('kpi-total-units', formatCompactNumber(kpis.total_units_sold || 0) + ' Units');
  setElText('kpi-total-products', (kpis.total_products || 0).toLocaleString() + ' SKUs');
  setElText('kpi-avg-rev-prod', formatCurrency(kpis.avg_revenue_per_product || 0));
  setElText('kpi-avg-unit-val', formatCurrency(kpis.avg_unit_value || 0) + ' / Unit');
  setElText('kpi-top-dept-rev', formatCurrency(kpis.top_department_revenue || 0));
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderProductInsights(insights) {
  const container = document.getElementById('product-insights-container');
  if (!container) return;

  if (!insights || insights.length === 0) {
    container.innerHTML = `<div class="placeholder-box">No product insights available</div>`;
    return;
  }

  container.innerHTML = `
    <div class="insights-grid">
      ${insights.map(item => `
        <div class="insight-card-item severity-border-low">
          <div class="insight-card-header">
            <span class="severity-badge severity-low">SALES INSIGHT</span>
          </div>
          <h4 class="insight-card-title">${escapeHTML(item.title)}</h4>
          <p class="insight-card-desc">${escapeHTML(item.description)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderProductRecommendations(recommendations) {
  const container = document.getElementById('product-recommendations-container');
  if (!container) return;

  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `<div class="placeholder-box">No recommendations available</div>`;
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
            <h4 class="insight-card-title">🚀 ${escapeHTML(rec.opportunity)}</h4>
            <p class="insight-card-desc">${escapeHTML(rec.detail)}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderProductTable(products) {
  const container = document.getElementById('product-table-container');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `<div class="placeholder-box">No product data available</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Product ID</th>
            <th>Department</th>
            <th>Commodity</th>
            <th>Sub Commodity</th>
            <th>Brand</th>
            <th class="num-col">Revenue</th>
            <th class="num-col">Units Sold</th>
            <th class="num-col">Avg Unit Value</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((p, idx) => `
            <tr>
              <td class="num-col">#${idx + 1}</td>
              <td><code>${p.product_id}</code></td>
              <td><span class="tag-dept">${escapeHTML(p.department)}</span></td>
              <td>${escapeHTML(p.commodity)}</td>
              <td>${escapeHTML(p.sub_commodity)}</td>
              <td><span class="tag-brand ${p.brand.toLowerCase() === 'national' ? 'brand-nat' : 'brand-priv'}">${escapeHTML(p.brand)}</span></td>
              <td class="num-col <strong>">${formatCurrency(p.revenue)}</td>
              <td class="num-col">${p.units_sold.toLocaleString()}</td>
              <td class="num-col">${formatCurrency(p.avg_unit_value)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
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
    legend: { labels: { color: '#94A3B8', font: { family: 'Inter', size: 11, weight: 500 } } },
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

/** 1. Revenue by Department */
function renderDepartmentRevenueChart(depts) {
  const ctx = document.getElementById('chart-department-revenue');
  if (!ctx) return;

  const labels = depts.map(d => d.department);
  const values = depts.map(d => d.revenue);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue ($)',
        data: values,
        backgroundColor: 'rgba(226, 201, 155, 0.85)',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Revenue: ${formatCurrency(c.parsed.x)}` } }
      },
      scales: {
        x: { ticks: { callback: (v) => '$' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } },
        y: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11, weight: 600 } } }
      }
    }
  });
}

/** 2. Units Sold by Department */
function renderDepartmentUnitsChart(depts) {
  const ctx = document.getElementById('chart-department-units');
  if (!ctx) return;

  const labels = depts.map(d => d.department);
  const values = depts.map(d => d.units);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Units Sold',
        data: values,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Units: ${c.parsed.x.toLocaleString()}` } }
      },
      scales: {
        x: { ticks: { callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k' } },
        y: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } } }
      }
    }
  });
}

/** 3. Revenue by Merchandise Category (Top 10) */
function renderCategoryRevenueChart(cats) {
  const ctx = document.getElementById('chart-category-revenue');
  if (!ctx) return;

  const labels = cats.map(c => c.category);
  const values = cats.map(c => c.revenue);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Category Revenue ($)',
        data: values,
        backgroundColor: 'rgba(168, 85, 247, 0.75)',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Revenue: ${formatCurrency(c.parsed.x)}` } }
      },
      scales: {
        x: { ticks: { callback: (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } },
        y: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } } }
      }
    }
  });
}

/** 4. Revenue Trend Over Time (Line Chart) */
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
        label: 'Weekly Sales ($)',
        data: values,
        borderColor: '#E2C99B',
        backgroundColor: 'rgba(226, 201, 155, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        ...chartThemeOptions.plugins,
        tooltip: { callbacks: { label: (c) => ` Revenue: ${formatCurrency(c.parsed.y)}` } }
      },
      scales: {
        y: { ticks: { callback: (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } }
      }
    }
  });
}

/** 5. Revenue vs Units Sold Scatter Plot */
function renderRevenueUnitsScatterChart(scatterData) {
  const ctx = document.getElementById('chart-revenue-units-scatter');
  if (!ctx) return;

  const points = scatterData.map(d => ({
    x: d.units,
    y: d.revenue,
    label: d.label,
    department: d.department
  }));

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Category Revenue vs Volume',
        data: points,
        backgroundColor: '#E2C99B',
        pointRadius: 6,
        pointHoverRadius: 9
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
              return ` ${pt.label} (${pt.department}): ${formatCurrency(pt.y)} revenue | ${pt.x.toLocaleString()} units`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Category Units Sold', color: '#94A3B8' },
          ticks: { callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k' }
        },
        y: {
          title: { display: true, text: 'Category Revenue ($)', color: '#94A3B8' },
          ticks: { callback: (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }
        }
      }
    }
  });
}

/** 6. Top 10 Products by Revenue */
function renderTopProductsRevenueChart(products) {
  const ctx = document.getElementById('chart-top-products-revenue');
  if (!ctx) return;

  const labels = products.map(p => `#${p.product_id} (${p.commodity})`);
  const values = products.map(p => p.revenue);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Product Sales ($)',
        data: values,
        backgroundColor: 'rgba(226, 201, 155, 0.85)',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Sales: ${formatCurrency(c.parsed.x)}` } }
      },
      scales: {
        x: { ticks: { callback: (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } },
        y: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10 } } }
      }
    }
  });
}

/** 7. Top 10 Products by Units Sold */
function renderTopProductsUnitsChart(products) {
  const ctx = document.getElementById('chart-top-products-units');
  if (!ctx) return;

  const labels = products.map(p => `#${p.product_id} (${p.commodity})`);
  const values = products.map(p => p.units);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Units Sold',
        data: values,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Units: ${c.parsed.x.toLocaleString()}` } }
      },
      scales: {
        x: { ticks: { callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k' } },
        y: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10 } } }
      }
    }
  });
}

/** 8. Revenue Contribution Pareto Analysis Chart */
function renderParetoChart(pareto) {
  const ctx = document.getElementById('chart-pareto-concentration');
  if (!ctx) return;

  const labels = ['Top 10 SKUs', 'Top 50 SKUs', 'Top 100 SKUs', 'All 92k SKUs'];
  const values = [
    pareto.top10_revenue || 0,
    pareto.top50_revenue || 0,
    pareto.top100_revenue || 0,
    pareto.total_revenue || 8057463
  ];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cumulative Revenue ($)',
        data: values,
        backgroundColor: ['#E2C99B', '#10B981', '#A855F7', '#F59E0B'],
        borderRadius: 6
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Revenue: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: { ticks: { callback: (v) => '$' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } }
      }
    }
  });
}

/* Utilities */
function formatCurrency(val) {
  if (typeof val !== 'number') val = parseFloat(val) || 0;
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCompactNumber(val) {
  if (typeof val !== 'number') val = parseFloat(val) || 0;
  if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
  return val.toLocaleString();
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
