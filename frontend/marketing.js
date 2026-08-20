/**
 * Marketing & Promotions Intelligence Dashboard Controller
 * Connects frontend/marketing.html to real PostgreSQL analytics:
 * - GET http://127.0.0.1:8000/api/dashboard/marketing
 */

const API_BASE_URL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : '';

document.addEventListener('DOMContentLoaded', () => {
  initSidebarToggle();
  fetchMarketingPromotionsData();
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

async function fetchMarketingPromotionsData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/marketing`);
    if (!response.ok) {
      throw new Error(`Marketing API HTTP error ${response.status}`);
    }
    const data = await response.json();

    // 1. Render KPIs
    renderMarketingKPIs(data.kpis);

    // 2. Render Charts
    renderCampaignRankingChart(data.campaign_ranking || []);
    renderCampaignReachResponseChart(data.campaign_reach_response || []);
    renderPromotionTypeChart(data.promotion_type_performance || []);
    renderTopCouponsChart(data.top_coupons || []);
    renderSegmentResponseChart(data.segment_response || []);
    renderChannelEffectivenessChart(data.channel_effectiveness || []);

    // 3. Render Campaign Table
    renderCampaignTable(data.campaign_performance || []);

    // 4. Render Insights & Recommendations
    renderMarketingInsights(data.insights || []);
    renderMarketingRecommendations(data.recommendations || []);

  } catch (error) {
    console.error('Failed to load marketing & promotions data:', error);
    renderDashboardError('Failed to load marketing metrics. Ensure FastAPI backend is running on 127.0.0.1:8000.');
  }
}

function renderMarketingKPIs(kpis) {
  if (!kpis) return;

  setElText('kpi-total-campaigns', (kpis.total_campaigns || 0).toString());
  setElText('kpi-targeted-hh', (kpis.total_targeted_households || 0).toLocaleString() + ' Drops');
  setElText('kpi-total-redemptions', (kpis.total_coupon_redemptions || 0).toLocaleString() + ' Vouchers');
  setElText('kpi-redemption-rate', (kpis.overall_redemption_rate || 0).toFixed(2) + '%');
  setElText('kpi-top-campaign', kpis.top_campaign || 'Campaign 18');
  setElText('kpi-promoted-revenue', formatCurrency(kpis.promoted_revenue || 0));
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderMarketingInsights(insights) {
  const container = document.getElementById('marketing-insights-container');
  if (!container) return;

  if (!insights || insights.length === 0) {
    container.innerHTML = `<div class="placeholder-box">No marketing insights available</div>`;
    return;
  }

  container.innerHTML = `
    <div class="insights-grid">
      ${insights.map(item => `
        <div class="insight-card-item severity-border-low">
          <div class="insight-card-header">
            <span class="severity-badge severity-low">CAMPAIGN INSIGHT</span>
          </div>
          <h4 class="insight-card-title">${escapeHTML(item.title)}</h4>
          <p class="insight-card-desc">${escapeHTML(item.description)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMarketingRecommendations(recommendations) {
  const container = document.getElementById('marketing-recommendations-container');
  if (!container) return;

  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `<div class="placeholder-box">No marketing recommendations available</div>`;
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
            <h4 class="insight-card-title">🎯 ${escapeHTML(rec.opportunity)}</h4>
            <p class="insight-card-desc">${escapeHTML(rec.detail)}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderCampaignTable(campaigns) {
  const container = document.getElementById('campaign-table-container');
  if (!container) return;

  if (!campaigns || campaigns.length === 0) {
    container.innerHTML = `<div class="placeholder-box">No campaign data available</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Campaign ID</th>
            <th>Type</th>
            <th>Start Day</th>
            <th>End Day</th>
            <th class="num-col">Targeted HHs</th>
            <th class="num-col">Redeeming HHs</th>
            <th class="num-col">Redemption Rate</th>
            <th class="num-col">Total Redemptions</th>
            <th class="num-col">Associated Spend Lift</th>
          </tr>
        </thead>
        <tbody>
          ${campaigns.map(c => `
            <tr>
              <td><code>Campaign ${c.campaign}</code></td>
              <td><span class="tag-dept">${escapeHTML(c.campaign_type)}</span></td>
              <td>Day ${c.start_day}</td>
              <td>Day ${c.end_day}</td>
              <td class="num-col">${c.households_targeted.toLocaleString()}</td>
              <td class="num-col">${c.households_redeemed.toLocaleString()}</td>
              <td class="num-col <strong>">${c.redemption_rate.toFixed(2)}%</td>
              <td class="num-col">${c.coupon_redemptions.toLocaleString()}</td>
              <td class="num-col">${formatCurrency(c.spend_lift)}</td>
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

/** 1. Campaign Response Ranking (Top 10 by Redemption Rate) */
function renderCampaignRankingChart(ranking) {
  const ctx = document.getElementById('chart-campaign-ranking');
  if (!ctx) return;

  const labels = ranking.map(r => r.campaign);
  const values = ranking.map(r => r.redemption_rate);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Redemption Rate (%)',
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
        tooltip: { callbacks: { label: (c) => ` Redemption Rate: ${c.parsed.x.toFixed(2)}%` } }
      },
      scales: {
        x: { ticks: { callback: (v) => v + '%' } },
        y: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } } }
      }
    }
  });
}

/** 2. Campaign Reach vs Response Scatter Plot */
function renderCampaignReachResponseChart(reachData) {
  const ctx = document.getElementById('chart-campaign-reach-response');
  if (!ctx) return;

  const points = reachData.map(d => ({
    x: d.targeted_households,
    y: d.redemption_rate,
    campaign: d.campaign,
    type: d.type,
    redemptions: d.redemptions
  }));

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Targeted HHs vs Redemption Rate',
        data: points,
        backgroundColor: '#10B981',
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
              return ` ${pt.campaign} (${pt.type}): ${pt.x.toLocaleString()} targeted HHs | ${pt.y.toFixed(2)}% rate (${pt.redemptions} redemptions)`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Targeted Households (Reach)', color: '#94A3B8' },
          ticks: { color: '#64748B' }
        },
        y: {
          title: { display: true, text: 'Redemption Rate (%)', color: '#94A3B8' },
          ticks: { callback: (v) => v + '%' }
        }
      }
    }
  });
}

/** 3. Campaign Type Performance Comparison */
function renderPromotionTypeChart(types) {
  const ctx = document.getElementById('chart-promotion-type');
  if (!ctx) return;

  const labels = types.map(t => t.campaign_type + ' Campaigns');
  const values = types.map(t => t.total_redemptions);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Redemptions',
        data: values,
        backgroundColor: ['#E2C99B', '#10B981', '#A855F7'],
        borderRadius: 6
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Redemptions: ${c.parsed.y.toLocaleString()}` } }
      }
    }
  });
}

/** 4. Top 10 Campaigns by Total Coupon Redemptions */
function renderTopCouponsChart(coupons) {
  const ctx = document.getElementById('chart-top-coupons');
  if (!ctx) return;

  const labels = coupons.map(c => c.campaign);
  const values = coupons.map(c => c.total_redemptions);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Redemptions',
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
        tooltip: { callbacks: { label: (c) => ` Vouchers Redeemed: ${c.parsed.x.toLocaleString()}` } }
      }
    }
  });
}

/** 5. Campaign Response by RFM Customer Segment */
function renderSegmentResponseChart(segResp) {
  const ctx = document.getElementById('chart-segment-response');
  if (!ctx) return;

  const labels = segResp.map(s => s.segment);
  const values = segResp.map(s => s.coupons_redeemed);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Coupons Redeemed',
        data: values,
        backgroundColor: '#F59E0B',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Coupons Redeemed: ${c.parsed.x.toLocaleString()}` } }
      }
    }
  });
}

/** 6. Promotional Channel Lift Chart */
function renderChannelEffectivenessChart(channels) {
  const ctx = document.getElementById('chart-channel-effectiveness');
  if (!ctx) return;

  const labels = channels.map(c => c.channel);
  const values = channels.map(c => c.revenue);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Spend Lift ($)',
        data: values,
        backgroundColor: 'rgba(226, 201, 155, 0.85)',
        borderRadius: 6
      }]
    },
    options: {
      ...chartThemeOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Spend Lift: ${formatCurrency(c.parsed.y)}` } }
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
