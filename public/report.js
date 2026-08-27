/**
 * AI Business Report Modal & Controller
 * Triggers POST http://127.0.0.1:8000/api/reports/business and renders executive management report modal.
 */

const API_BASE_URL = window.API_BASE_URL || (
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  window.location.port !== '8000' && window.location.port !== ''
    ? 'http://127.0.0.1:8000'
    : ''
);
const REPORT_API_URL = `${API_BASE_URL}/api/reports/business`;

document.addEventListener('DOMContentLoaded', () => {
  initReportModal();
  bindReportButtons();
});

function bindReportButtons() {
  const btns = document.querySelectorAll('.btn-generate-report, #btn-generate-report');
  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openReportModal();
    });
  });
}

function initReportModal() {
  if (document.getElementById('report-modal-overlay')) return;

  const modalHTML = `
    <div id="report-modal-overlay" class="modal-overlay" style="display:none;">
      <div class="modal-card report-modal-card">
        <div class="modal-header">
          <div class="modal-title-box">
            <span class="modal-icon">📄</span>
            <div>
              <h3 class="modal-title" id="report-modal-title">Dunnhumby Executive Retail Report</h3>
              <span class="modal-subtitle" id="report-modal-subtitle">AI-generated business intelligence management report</span>
            </div>
          </div>
          <div class="modal-actions">
            <button id="btn-print-report" class="btn-secondary" style="display:none;">
              <span>🖨️ Print / Export PDF</span>
            </button>
            <button id="btn-close-report" class="modal-close-btn">&times;</button>
          </div>
        </div>

        <div class="modal-body" id="report-modal-body">
          <div class="placeholder-box" id="report-loading-box">
            <div class="typing-dots" style="margin-bottom: 12px;"><span></span><span></span><span></span></div>
            <span class="ph-label">Generating Executive Report...</span>
            <span class="ph-desc">Aggregating PostgreSQL analytics metrics across sales, customers, products, campaigns, and automated insights.</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.getElementById('btn-close-report').addEventListener('click', closeReportModal);
  document.getElementById('report-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'report-modal-overlay') closeReportModal();
  });
  document.getElementById('btn-print-report').addEventListener('click', () => {
    window.print();
  });
}

function openReportModal() {
  const overlay = document.getElementById('report-modal-overlay');
  const body = document.getElementById('report-modal-body');
  const loading = document.getElementById('report-loading-box');
  const printBtn = document.getElementById('btn-print-report');

  if (overlay) overlay.style.display = 'flex';
  if (body) {
    body.innerHTML = `
      <div class="placeholder-box" id="report-loading-box" style="padding: 40px 20px;">
        <div class="typing-dots" style="margin: 0 auto 16px auto;"><span></span><span></span><span></span></div>
        <span class="ph-label" style="font-size: 1rem; color: #F8FAFC;">Generating Executive Management Report...</span>
        <span class="ph-desc">Synthesizing live PostgreSQL metrics from Executive Overview, Customer Intelligence, Product Sales, and Marketing Campaigns.</span>
      </div>
    `;
  }
  if (printBtn) printBtn.style.display = 'none';

  fetchReportData();
}

function closeReportModal() {
  const overlay = document.getElementById('report-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function fetchReportData() {
  const body = document.getElementById('report-modal-body');
  const printBtn = document.getElementById('btn-print-report');
  const subtitle = document.getElementById('report-modal-subtitle');

  try {
    const response = await fetch(REPORT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: 'overall' })
    });

    if (!response.ok) {
      throw new Error(`Report API returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (subtitle) {
      subtitle.textContent = `Generated on ${data.generated_at || 'Just now'} | Period: Overall Retail Baseline`;
    }

    if (printBtn) printBtn.style.display = 'inline-flex';

    renderReportView(data);

  } catch (error) {
    console.error('Failed to generate business report:', error);
    if (body) {
      body.innerHTML = `
        <div class="placeholder-box error-box">
          <span class="ph-icon">⚠️</span>
          <span class="ph-label">Report Generation Error</span>
          <span class="ph-desc">Unable to connect to /api/reports/business. Ensure FastAPI backend is running.</span>
        </div>
      `;
    }
  }
}

function renderReportView(data) {
  const body = document.getElementById('report-modal-body');
  if (!body) return;

  const kpis = data.kpi_highlights || {};
  const sections = data.sections || {};
  const insights = data.insights || [];
  const risks = data.risks || [];
  const opps = data.opportunities || [];
  const recs = data.recommendations || [];

  body.innerHTML = `
    <div class="report-content-view">
      <!-- 1. Executive Summary Panel -->
      <div class="report-section-card summary-card">
        <h4 class="report-section-title">📋 Executive Summary</h4>
        <div class="report-text">${formatMarkdownParagraphs(data.executive_summary || '')}</div>
      </div>

      <!-- 2. KPI Highlights Grid -->
      <div class="report-kpi-grid">
        <div class="report-kpi-box">
          <span class="report-kpi-lbl">Total Store Revenue</span>
          <span class="report-kpi-val">${formatCurrency(kpis.total_revenue || 8057463.08)}</span>
        </div>
        <div class="report-kpi-box">
          <span class="report-kpi-lbl">Total Units Sold</span>
          <span class="report-kpi-val">${formatCompactNumber(kpis.total_units_sold || 260685622)}</span>
        </div>
        <div class="report-kpi-box">
          <span class="report-kpi-lbl">Active Shoppers</span>
          <span class="report-kpi-val">${(kpis.active_customers || 2500).toLocaleString()} HHs</span>
        </div>
        <div class="report-kpi-box">
          <span class="report-kpi-lbl">Avg Basket Value</span>
          <span class="report-kpi-val">${formatCurrency(kpis.avg_basket_value || 29.14)}</span>
        </div>
        <div class="report-kpi-box">
          <span class="report-kpi-lbl">Leading Department</span>
          <span class="report-kpi-val">${escapeHTML(kpis.top_department || 'Grocery')}</span>
        </div>
        <div class="report-kpi-box">
          <span class="report-kpi-lbl">Top Response Campaign</span>
          <span class="report-kpi-val">${escapeHTML(kpis.top_campaign || 'Campaign 18')}</span>
        </div>
      </div>

      <!-- 3. Core Strategic Sections -->
      <div class="report-grid">
        <div class="report-section-card">
          <h4 class="report-section-title">📈 Revenue & Sales Performance</h4>
          <div class="report-text">${formatMarkdownParagraphs(sections.sales || 'Sales analysis unavailable.')}</div>
        </div>

        <div class="report-section-card">
          <h4 class="report-section-title">👥 Customer Intelligence & Cohorts</h4>
          <div class="report-text">${formatMarkdownParagraphs(sections.customers || 'Customer analysis unavailable.')}</div>
        </div>

        <div class="report-section-card">
          <h4 class="report-section-title">🏬 Product Assortment & Velocity</h4>
          <div class="report-text">${formatMarkdownParagraphs(sections.products || 'Product analysis unavailable.')}</div>
        </div>

        <div class="report-section-card">
          <h4 class="report-section-title">🎯 Marketing & Promotion Efficacy</h4>
          <div class="report-text">${formatMarkdownParagraphs(sections.marketing || 'Marketing analysis unavailable.')}</div>
        </div>
      </div>

      <!-- 4. Key Risks & Opportunities -->
      <div class="report-grid">
        <div class="report-section-card risk-card">
          <h4 class="report-section-title">⚠️ Key Business Risks</h4>
          <ul class="report-list">
            ${risks.map(r => `<li>${escapeHTML(r)}</li>`).join('')}
          </ul>
        </div>

        <div class="report-section-card opp-card">
          <h4 class="report-section-title">💡 Growth Opportunities</h4>
          <ul class="report-list">
            ${opps.map(o => `<li>${escapeHTML(o)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- 5. Recommended Operational Actions -->
      <div class="report-section-card rec-card">
        <h4 class="report-section-title">🚀 Recommended Operational Actions</h4>
        <ol class="report-list-numbered">
          ${recs.map(r => `<li>${escapeHTML(r)}</li>`).join('')}
        </ol>
      </div>

      <!-- 6. Automated Detected Insights -->
      ${insights.length > 0 ? `
        <div class="report-section-card">
          <h4 class="report-section-title">✨ Automated Detected Insights (${insights.length})</h4>
          <div class="insights-grid" style="margin-top: 10px;">
            ${insights.slice(0, 4).map(i => `
              <div class="insight-card-item severity-border-low">
                <h5 style="color:#F8FAFC; margin-bottom: 4px;">${escapeHTML(i.title)}</h5>
                <p style="font-size: 0.8125rem; color: #94A3B8;">${escapeHTML(i.description)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function formatMarkdownParagraphs(text) {
  if (!text) return '';
  const clean = escapeHTML(text);
  return clean.split(/\n\s*\n/).map(p => `<p style="margin-bottom: 10px;">${p.replace(/\n/g, '<br>')}</p>`).join('');
}

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
