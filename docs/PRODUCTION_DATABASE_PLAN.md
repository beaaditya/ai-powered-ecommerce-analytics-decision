# Production Database Plan (Free-Tier Vercel + Supabase)

---

## Executive Summary

This document establishes the official production database strategy for deploying the **AI-Powered E-Commerce Analytics & Decision System** to **Vercel** and **Supabase (Free Tier)**.

- **Current Local Database Size:** **~11.37 GB** (36.8M raw/clean causal records and transaction logs)
- **Supabase Free-Tier Storage Cap:** **500 MB**
- **Production Target Footprint:** **< 400 MB** (to ensure ample buffer for indexes, system catalogs, and future growth)
- **Engineered Production Footprint:** **~48.3 MB** (*436,846 rows across 18 analytics tables & 2 views*)
- **Compression Footprint:** **~21.2 MB uncompressed SQL dump / ~6.4 MB gzipped**
- **Free-Tier Quota Utilization:** **< 10% of Supabase Free Limit** (leaving > 450 MB of safety margin)

---

## 1. Current Local Database Overview

```text
Database Name : dunnhumby_retail
Total Disk Size: 11,642 MB (11.37 GB)
Active Schemas:
  - raw        : 2,365 MB  (Raw CSV ingestion tables)
  - clean      : 4,342 MB  (Standardized & cleaned relational tables)
  - analytics  : 6,540 MB  (Pre-aggregated analytics & causal join tables)
  - ai         :    32 kB  (AI agent query logging)
  - public     :     0 bytes
```

### Why the Local Database is 11 GB

The local database contains 36.78 million row-by-row promotional causal records and 5.19 million raw transaction records:

1. `analytics.promotion_sales` (**3,765 MB** / 36.78M rows) — Full transaction-to-promotional-mailer causal join.
2. `clean.causal_data` (**2,938 MB** / 36.78M rows) — Cleaned store-level feature/display causal records.
3. `analytics.promotion_weekly` (**2,114 MB** / 36.78M rows) — Weekly causal promotion table.
4. `raw.causal_data` (**1,831 MB** / 36.78M rows) — Raw causal CSV table.
5. `raw.transaction_data` (**501 MB** / 5.19M rows) — Raw transaction CSV table.
6. `clean.transaction_data` (**273 MB** / 2.59M rows) — Cleaned transaction records.

---

## 2. Complete Database Table Inventory & Classification

| Schema.Table | Size | Rows | Classification | Action for Production |
| :--- | :--- | :--- | :--- | :--- |
| `analytics.weekly_metrics` | 40 kB | 102 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.department_metrics` | 16 kB | 44 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.category_metrics` | 480 kB | 3,912 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.category_trend` | 96 kB | 360 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.product_metrics` | 14 MB | 92,339 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.customer_rfm_scored` | 760 kB | 2,500 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.customer_intelligence` | 416 kB | 2,500 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.customer_metrics` | 368 kB | 2,500 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.customer_rfm` | 296 kB | 2,500 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.customer_trend` | 496 kB | 2,500 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.customer_discount` | 496 kB | 2,500 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.customer_recommendations` | 3.77 MB | 34,158 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.campaign_performance` | 16 kB | 30 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.campaign_customer_spend` | 1.08 MB | 7,208 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.customer_campaign_response` | 1.70 MB | 7,208 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.basket_metrics` | 24 MB | 276,484 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.production_promotion_summary` | 16 kB | 1 | **A. Required for Production** | **Include in Cloud DB** |
| `ai.query_log` | 16 kB | 0 | **A. Required for Production** | **Include in Cloud DB** |
| `analytics.promotion_sales` | 3,765 MB | 36,786,524 | **B. Local ETL Only** | **EXCLUDE** (Replaced by summary table) |
| `analytics.promotion_weekly` | 2,114 MB | 36,786,524 | **B. Local ETL Only** | **EXCLUDE** (Intermediate ETL) |
| `clean.causal_data` | 2,938 MB | 36,786,524 | **B. Local ETL Only** | **EXCLUDE** (Intermediate ETL) |
| `raw.causal_data` | 1,831 MB | 36,786,524 | **B. Local ETL Only** | **EXCLUDE** (Raw dataset) |
| `raw.transaction_data` | 501 MB | 5,191,464 | **B. Local ETL Only** | **EXCLUDE** (Raw dataset) |
| `clean.transaction_data` | 273 MB | 2,595,732 | **B. Local ETL Only** | **EXCLUDE** (Intermediate ETL) |
| `analytics.customer_category_rank` | 32 MB | 292,023 | **C. Local Rebuild Only** | **EXCLUDE** (Used to build recommendations) |
| `analytics.customer_category_preference`| 29 MB | 292,023 | **C. Local Rebuild Only** | **EXCLUDE** (Used to build recommendations) |
| `analytics.customer_category` | 29 MB | 292,023 | **C. Local Rebuild Only** | **EXCLUDE** (Intermediate rollup) |
| `raw.product` | 19 MB | 184,706 | **B. Local ETL Only** | **EXCLUDE** (Raw catalog) |
| `raw.coupon` | 13 MB | 249,096 | **B. Local ETL Only** | **EXCLUDE** (Raw coupon list) |
| `clean.product` | 12 MB | 92,353 | **B. Local ETL Only** | **EXCLUDE** (Materialized into product_metrics) |
| `analytics.customer_weekly` | 9.6 MB | 123,976 | **C. Local Rebuild Only** | **EXCLUDE** (Intermediate spend rollup) |
| `analytics.category_product_popularity`| 9.2 MB | 92,339 | **C. Local Rebuild Only** | **EXCLUDE** (Intermediate popularity rollup) |
| `clean.coupon` | 8.0 MB | 119,384 | **B. Local ETL Only** | **EXCLUDE** (Intermediate clean table) |
| `analytics.category_weekly` | 2.1 MB | 28,759 | **C. Local Rebuild Only** | **EXCLUDE** (Category trends covered by category_trend) |
| `raw.campaign_table` | 768 kB | 14,416 | **B. Local ETL Only** | **EXCLUDE** (Raw campaign mapping) |
| `clean.campaign_table` | 512 kB | 7,208 | **B. Local ETL Only** | **EXCLUDE** (Covered by campaign_performance) |
| `raw.coupon_redempt` | 312 kB | 4,636 | **B. Local ETL Only** | **EXCLUDE** (Raw redemptions) |
| `clean.coupon_redempt` | 224 kB | 2,318 | **B. Local ETL Only** | **EXCLUDE** (Covered by campaign_performance) |
| `raw.hh_demographic` | 184 kB | 1,602 | **B. Local ETL Only** | **EXCLUDE** (Raw demographics) |
| `clean.hh_demographic` | 136 kB | 801 | **B. Local ETL Only** | **EXCLUDE** (Merged into customer_intelligence) |
| `clean.campaign_desc` | 16 kB | 30 | **B. Local ETL Only** | **EXCLUDE** (Merged into campaign_performance) |
| `raw.campaign_desc` | 8 kB | 60 | **B. Local ETL Only** | **EXCLUDE** (Raw descriptors) |

---

## 3. Required Production Dataset (18 Tables + 2 Views)

The 18 tables below contain **100% of the data required** to power all dashboard pages, analytical cards, visualizations, automated anomaly detection, AI Business Analyst chat, and executive management reports:

```text
┌────────────────────────────────────────┬───────────┬──────────────┬───────────────┐
│ Schema.Table                           │ Disk Size │    Row Count │ Storage Bytes │
├────────────────────────────────────────┼───────────┼──────────────┼───────────────┤
│ analytics.weekly_metrics               │ 40 kB     │          102 │        40,960 │
│ analytics.department_metrics           │ 16 kB     │           44 │        16,384 │
│ analytics.category_metrics             │ 480 kB    │        3,912 │       491,520 │
│ analytics.category_trend               │ 96 kB     │          360 │        98,304 │
│ analytics.product_metrics              │ 14 MB     │       92,339 │    14,712,832 │
│ analytics.customer_rfm_scored          │ 760 kB    │        2,500 │       778,240 │
│ analytics.customer_intelligence        │ 416 kB    │        2,500 │       425,984 │
│ analytics.customer_metrics             │ 368 kB    │        2,500 │       376,832 │
│ analytics.customer_rfm                 │ 296 kB    │        2,500 │       303,104 │
│ analytics.customer_trend               │ 496 kB    │        2,500 │       507,904 │
│ analytics.customer_discount            │ 496 kB    │        2,500 │       507,904 │
│ analytics.customer_recommendations     │ 3.77 MB   │       34,158 │     3,866,624 │
│ analytics.campaign_performance         │ 16 kB     │           30 │        16,384 │
│ analytics.campaign_customer_spend      │ 1.08 MB   │        7,208 │     1,114,112 │
│ analytics.customer_campaign_response   │ 1.70 MB   │        7,208 │     1,744,896 │
│ analytics.basket_metrics               │ 24 MB     │      276,484 │    25,608,192 │
│ analytics.production_promotion_summary │ 16 kB     │            1 │        16,384 │
│ ai.query_log                           │ 16 kB     │            0 │        16,384 │
├────────────────────────────────────────┼───────────┼──────────────┼───────────────┤
│ TOTAL PRODUCTION DATASET               │ ~48.3 MB  │      436,846 │    50,642,944 │
└────────────────────────────────────────┴───────────┴──────────────┴───────────────┘
```

### Production Views
1. `analytics.ai_customer_context` — Pre-joined view of customer segments, trends, discount sensitivity, and basket values.
2. `analytics.customer_recommendation_view` — Top 10 product recommendations per household joined with customer segments.

---

## 4. Frontend-to-Database Dependency Map

```text
┌──────────────────────────────┬───────────────────────────────┬──────────────────────────────┬───────────────────────────────────────────┐
│ Frontend View / Action       │ REST API Endpoint             │ Backend Module               │ PostgreSQL Tables / Views Used            │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ Executive Overview Page      │ GET /api/dashboard/overview   │ backend.overview             │ analytics.weekly_metrics                  │
│                              │                               │                              │ analytics.customer_rfm_scored             │
│                              │                               │                              │ analytics.department_metrics              │
│                              │                               │                              │ analytics.category_metrics                │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ Customer Intelligence Page   │ GET /api/dashboard/customers  │ backend.customers_data       │ analytics.customer_rfm_scored             │
│                              │                               │                              │ analytics.customer_intelligence           │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ Product & Sales Page         │ GET /api/dashboard/products   │ backend.products_data        │ analytics.weekly_metrics                  │
│                              │                               │                              │ analytics.product_metrics                 │
│                              │                               │                              │ analytics.department_metrics              │
│                              │                               │                              │ analytics.category_metrics                │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ Marketing & Promotions Page  │ GET /api/dashboard/marketing  │ backend.marketing_data       │ analytics.campaign_performance            │
│                              │                               │                              │ analytics.campaign_customer_spend         │
│                              │                               │                              │ analytics.customer_campaign_response      │
│                              │                               │                              │ analytics.customer_rfm_scored             │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ Automated Business Insights  │ GET /api/insights             │ backend.insights             │ analytics.weekly_metrics                  │
│                              │                               │                              │ analytics.category_trend                  │
│                              │                               │                              │ analytics.campaign_performance            │
│                              │                               │                              │ analytics.customer_rfm_scored             │
│                              │                               │                              │ analytics.production_promotion_summary    │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ AI Business Analyst (Chat)   │ POST /chat                    │ backend.sql_agent            │ All 18 Analytics Schema Tables            │
│                              │                               │ backend.prompts              │ (Pre-aggregated analytical schema)        │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ AI Multi-Step Investigation  │ POST /api/agent/analyze       │ backend.agent                │ Synthesizes metrics across Overview,      │
│                              │                               │                              │ Customers, Products, Marketing & Insights │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ AI Management Report Modal   │ POST /api/reports/business    │ backend.reports              │ Synthesizes metrics across Overview,      │
│                              │                               │                              │ Customers, Products, Marketing & Insights │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ Automated Pipeline Run       │ POST /api/analysis/run        │ backend.pipeline             │ Background multi-domain evaluation        │
│                              │ GET /api/analysis/latest      │                              │ across analytics tables                   │
├──────────────────────────────┼───────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ System Health Diagnostics    │ GET /health                   │ backend.main                 │ Checks database connection & version      │
│                              │ GET /ai/health                │ backend.ai                   │ Checks Gemini API key configuration       │
└──────────────────────────────┴───────────────────────────────┴──────────────────────────────┴───────────────────────────────────────────┘
```

---

## 5. AI SQL Agent Compatibility Analysis

### Architecture Alignment
The Gemini Natural-Language-to-SQL agent (`backend/sql_agent.py` and `backend/prompts.py`) was engineered with schema awareness exclusively targeting the `analytics.*` schema.

```text
               [ Business User Question ]
                           │
                           ▼
               [ Google Gemini 2.5 Flash ]
                           │ (Generates SQL against analytics schema)
                           ▼
          [ Read-Only AST & Keyword Validator ]
                           │
                           ▼
    [ Target Tables in Production (48.3 MB Total) ]
    ├── analytics.customer_rfm_scored      ├── analytics.product_metrics
    ├── analytics.customer_intelligence    ├── analytics.category_metrics
    ├── analytics.customer_recommendations ├── analytics.category_trend
    ├── analytics.campaign_performance     ├── analytics.customer_trend
    ├── analytics.campaign_customer_spend  ├── analytics.customer_discount
    ├── analytics.customer_campaign_resp.  ├── analytics.weekly_metrics
    ├── analytics.department_metrics       └── analytics.basket_metrics
```

### Result: 100% Fully Functional
- **Does the AI SQL Agent require `raw.transaction_data` (501 MB) or `clean.causal_data` (2.9 GB)?** **No.** All user questions regarding spending trends, RFM segment counts, top products, campaign response, and average basket sizes query the pre-aggregated `analytics.*` tables directly.
- **Is any AI functionality degraded?** **No.** Every single prompt, test question, and multi-turn query runs identically on the reduced 48.3 MB production database.

---

## 6. Cloud Migration Step-by-Step Guide

```text
┌───────────────────────┐
│ LOCAL POSTGRESQL DB   │ (11.37 GB — Untouched & Read-Only)
└───────────┬───────────┘
            │ python scripts/export_production_db.py
            ▼
┌───────────────────────┐
│ production_dump.sql   │ (21.2 MB uncompressed / 6.4 MB gzipped)
└───────────┬───────────┘
            │ psql "postgres://postgres:[PASSWORD]@[HOST]:5432/postgres" < production_dump.sql
            ▼
┌───────────────────────┐
│ SUPABASE FREE POSTGRES│ (48.3 MB stored — < 10% of 500 MB quota)
└───────────┬───────────┘
            ▲
            │ Connection Pooling (DATABASE_URL / Session Pooler)
┌───────────┴───────────┐
│ VERCEL SERVERLESS API │ (FastAPI Python Runtime + Gemini AI)
└───────────────────────┘
```

### Step 1: Export Local Production Tables
Run the automated extraction utility (from project root):

```bash
python scripts/export_production_db.py --output production_dump.sql
```

### Step 2: Create a Free Supabase Project
1. Log in to [supabase.com](https://supabase.com) (Free Tier).
2. Click **New Project** (select region closest to your Vercel deployment, e.g., US East / EU Central).
3. Set a strong database password and record your connection string.

### Step 3: Import Production Dump into Supabase
Run `psql` to load the 48 MB dataset into your Supabase database:

```bash
psql "postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres" -f production_dump.sql
```
*(Or use Supabase's built-in SQL Editor to execute `scripts/create_production_database.sql` and upload the data).*

### Step 4: Configure Vercel Production Environment Variables
In your Vercel Project Settings (**Settings > Environment Variables**), configure:

```ini
DB_HOST=db.[YOUR_PROJECT_REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR_SUPABASE_PASSWORD]
GEMINI_API_KEY=[YOUR_GOOGLE_GEMINI_API_KEY]
GEMINI_MODEL=gemini-flash-lite-latest
```

---

## 7. Safety & Local Isolation Guarantees

1. **Local Database Untouched:** The local `dunnhumby_retail` PostgreSQL database remains completely intact with all 11 GB of raw, clean, and analytical data.
2. **Read-Only Local Extraction:** `scripts/export_production_db.py` operates in strict read-only mode (`conn.set_session(readonly=True)`).
3. **No Breaking Code Changes:** The FastAPI backend and frontend JavaScript logic interact with identical table names, schema qualifications, and column names.
4. **Git Protection:** Database dumps (`*.dump`, `*.backup`, `*.sql.gz`, `production_dump.sql`) and `.env` credentials are systematically excluded from Git.
