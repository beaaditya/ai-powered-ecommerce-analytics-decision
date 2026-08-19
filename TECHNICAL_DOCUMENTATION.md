# AI-Assisted Retail Intelligence System: Final Technical Documentation

**System Title:** AI-Assisted Retail Intelligence & Conversational Decision Support System  
**Dataset:** Dunnhumby "The Complete Journey" Longitudinal Retail Dataset  
**Database Server:** PostgreSQL 16 (`dunnhumby_retail`)  
**Backend Framework:** FastAPI / Uvicorn (Python 3.13.5)  
**AI Foundation:** Google Gemini (`gemini-flash-lite-latest` / `gemini-flash-latest`) via `google-genai` SDK  
**Frontend Architecture:** Enterprise Multi-Page Responsive Web Application (Vanilla HTML5, CSS3 Custom Properties, ES6+ JavaScript)  
**Status:** Feature-Complete, Tested & Verified (August 2026)  

---

## 1. Project Overview

The **AI-Assisted Retail Intelligence System** is an enterprise-grade retail analytics platform and conversational decision-support copilot built upon the **Dunnhumby "The Complete Journey"** dataset. The underlying dataset tracks the actual purchasing behavior of 2,500 shopper households across 92,339 stock-keeping units (SKUs), 29 store departments, and 30 targeted marketing campaigns over two full calendar years (102 weeks / 719 operational days), totaling $8,057,463.08 in verified cumulative store sales.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         Core Platform Capabilities                               │
├─────────────────────────┬────────────────────────────┬───────────────────────────┤
│  Executive KPI Tracking │  Customer RFM Segmentation │  Category & SKU Pareto    │
├─────────────────────────┼────────────────────────────┼───────────────────────────┤
│  Marketing & Promo Lift │  Proactive Anomaly Alerts  │  Conversational NL-to-SQL │
├─────────────────────────┼────────────────────────────┼───────────────────────────┤
│  Multi-Turn AI Memory   │  Multi-Domain Agent Diag.  │  Automated C-Suite Reports│
└─────────────────────────┴────────────────────────────┴───────────────────────────┘
```

### Major Capabilities:
* **Interactive Executive Dashboards:** Real-time visibility into revenue velocity, customer lifetime value distributions, product assortment growth/decay, and marketing campaign conversion rates across 5 specialized views.
* **Proactive Anomaly & Insight Detection:** Background deterministic engines scanning rolling moving averages, customer participation rates, and revenue concentration to flag risks and growth opportunities without requiring user prompting.
* **Natural-Language-to-SQL Querying:** Conversational interface allowing non-technical executives to ask plain English retail questions, automatically translated to PostgreSQL queries, checked by deterministic safety filters, executed against read-only sessions, and summarized into executive-ready answers.
* **Autonomous Diagnostic Agent:** Multi-step analytical planner capable of investigating complex root-cause inquiries (e.g., *"Why did sales decline?"*) across revenue, customer, product, and marketing tools.
* **Automated C-Suite Reporting:** One-click generation of structured business intelligence management reports reconciled 100% against relational database records with zero metric hallucination.

---

## 2. Technology Stack

The platform is engineered with a strict decoupled architecture prioritizing performance, determinism, and zero bloated runtime dependencies.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Full Technology Stack                                  │
├───────────────────────┬───────────────────────────────┬────────────────────────────────┤
│ Layer                 │ Technology / Component        │ Version / Specification        │
├───────────────────────┼───────────────────────────────┼────────────────────────────────┤
│ **Language Runtime**  │ Python                        │ 3.13.5 (CPython, 64-bit)       │
│ **Backend Framework** │ FastAPI                       │ >= 0.110.0                     │
│ **ASGI Web Server**   │ Uvicorn                       │ >= 0.28.0                      │
│ **Database Engine**   │ PostgreSQL Server             │ PostgreSQL 16 (`dunnhumby_retail`)│
│ **Database Driver**   │ psycopg2-binary               │ >= 2.9.9                       │
│ **Data Validation**   │ Pydantic                      │ >= 2.0.0                       │
│ **Environment Config**│ python-dotenv                 │ >= 1.0.1                       │
│ **Generative AI SDK** │ google-genai (Google GenAI)   │ >= 1.0.0                       │
│ **Primary LLM Model** │ Google Gemini Flash Lite      │ `gemini-flash-lite-latest`     │
│ **Fallback LLM Model**│ Google Gemini Flash           │ `gemini-flash-latest`          │
│ **Frontend Markup**   │ HTML5                         │ Semantic, Multi-Page Layout    │
│ **Frontend Styling**  │ Modern Vanilla CSS3           │ Custom Properties, Glassmorphic│
│ **Frontend Scripting**│ Vanilla ECMAScript 6+         │ Native `fetch()`, LocalStorage │
└───────────────────────┴───────────────────────────────┴────────────────────────────────┘
```

---

## 3. System Architecture

The system utilizes a modern, decoupled client-server architecture with an isolated database layer and a dual-path analytical AI engine.

```
                                  +---------------------------------------+
                                  |     Frontend Web Application          |
                                  |   (Vanilla HTML5, CSS3, JavaScript)   |
                                  |   Hosted at http://127.0.0.1:3000     |
                                  +-------------------+-------------------+
                                                      |
                                     HTTP REST (JSON) | CORS: http://127.0.0.1:3000
                                                      v
                                  +---------------------------------------+
                                  |         FastAPI Backend Server        |
                                  |         (http://127.0.0.1:8000)       |
                                  +-------------------+-------------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
                    v                                 v                                 v
        [Conversational /chat Flow]       [Automated Insights & Diag]       [Direct Dashboard Slices]
                    |                                 |                                 |
                    v                                 v                                 v
      +---------------------------+     +---------------------------+     +---------------------------+
      |     Google Gemini AI      |     |  Python Diagnostic Engine |     |  Pre-Calculated Marts     |
      | (NL-to-SQL + Schema Ctx)  |     |  (backend/insights.py)    |     |  (overview, customers,    |
      +-------------+-------------+     +-------------+-------------+     |   products, marketing)    |
                    |                                 |                   +-------------+-------------+
                    v                                 v                                 |
      +---------------------------+     +---------------------------+                   |
      |   SQL Safety Validator    |     |   Threshold Evaluation    |                   |
      | (SELECT only, AST Parser) |     |  (Growth, Churn, Pareto)  |                   |
      +-------------+-------------+     +-------------+-------------+                   |
                    |                                 |                                 |
                    +---------------------------------+---------------------------------+
                                                      |
                                                      v
                                        +---------------------------+
                                        |    PostgreSQL Database    |
                                        |    (`dunnhumby_retail`)   |
                                        |   - raw schema (8 tables) |
                                        |   - clean schema (8 tbls) |
                                        |   - analytics (26 marts)  |
                                        |   - ai schema (1 audit)   |
                                        |   Read-Only Session Exec  |
                                        +-------------+-------------+
                                                      |
                                                      v
                                        +---------------------------+
                                        |  Grounded Executive AI    |
                                        |  (Synthesizes answer with |
                                        |   zero hallucination)     |
                                        +-------------+-------------+
                                                      |
                                                      v
                                        +---------------------------+
                                        |    Frontend UI Display    |
                                        +---------------------------+
```

### Subsystem Interaction & Flow:
1. **Dashboard Data Delivery:** Dedicated backend modules (`overview.py`, `customers_data.py`, `products_data.py`, `marketing_data.py`) query pre-aggregated PostgreSQL analytics marts directly, returning serialized JSON payloads within sub-60ms.
2. **Automated Insights:** `backend/insights.py` executes period-over-period delta algorithms in SQL/Python to detect revenue shifts ($\pm 3\%$), household participation drops ($\pm 3\%$), category momentum ($\pm 15\%$), and at-risk revenue exposure.
3. **Conversational AI Agent:** `backend/sql_agent.py` prompts Gemini with the analytics schema context, validates generated queries through Python AST regex guards, executes queries against PostgreSQL with `readonly=True`, and feeds raw results back into Gemini for grounded executive synthesis.
4. **Autonomous Analysis Pipeline:** `backend/pipeline.py` and `backend/agent.py` execute multi-tool investigations across all four business domains simultaneously, evaluating strategic implications and generating management action plans.
5. **Business Reports:** `backend/reports.py` aggregates data from all four dashboard modules and automated insights, prompting Gemini to produce structured executive markdown reports on demand.

---

## 4. Project File Structure

```
c:\dunnhumby_The-Complete-Journey
├── .env                                  # Environment variables (DB credentials, Gemini API key)
├── .gitignore                            # Git exclusion rules (.env, .venv, raw CSVs)
├── requirements.txt                      # Python library dependencies
├── README.md                             # Repository overview and quickstart guide
├── DATABASE_DOCUMENTATION.md             # PostgreSQL schema and data mart catalog
├── AI_ARCHITECTURE.md                    # AI orchestration and prompt engineering specifications
├── API_DOCUMENTATION.md                  # REST endpoint payload specifications
├── TEST_CHECKLIST.md                     # Verification checklists and validation matrices
├── TEST_REPORT.md                        # Final system test and verification audit report
├── BUSINESS_CASE_STUDY.md                # Executive business case study and empirical findings
├── TECHNICAL_DOCUMENTATION.md           # This comprehensive technical reference document
│
├── backend/                              # FastAPI Application Source Code
│   ├── main.py                           # FastAPI application entrypoint, CORS & route definitions
│   ├── database.py                       # PostgreSQL connection pooling, health checks & session mgmt
│   ├── ai.py                             # Google GenAI SDK wrapper, model fallback & health check
│   ├── prompts.py                        # Centralized system prompts, schema context & prompt builders
│   ├── sql_agent.py                      # NL-to-SQL generator, AST safety validator & executor
│   ├── insights.py                       # Deterministic anomaly detection engine across 6 domains
│   ├── overview.py                       # Executive overview dashboard analytical data queries
│   ├── customers_data.py                 # Customer intelligence & RFM segmentation data queries
│   ├── products_data.py                  # Product sales, department & Pareto concentration queries
│   ├── marketing_data.py                 # Campaign performance, coupon & promotional lift queries
│   ├── agent.py                          # AI Business Analyst multi-step diagnostic planner & tools
│   ├── pipeline.py                       # Automated business analysis pipeline & memory cache
│   └── reports.py                        # AI executive business report generator
│
├── frontend/                             # Vanilla Web Application UI
│   ├── index.html                        # Executive Overview Dashboard interface
│   ├── customers.html                    # Customer Intelligence & RFM Segmentation interface
│   ├── products.html                     # Product & Sales Intelligence interface
│   ├── marketing.html                    # Marketing & Promotions Intelligence interface
│   ├── ai.html                           # Conversational AI Business Analyst chat interface
│   ├── style.css                         # Enterprise design system, glassmorphism tokens & layouts
│   ├── app.js                            # Conversational chat controller, LocalStorage memory & UI
│   ├── overview.js                       # Executive overview dynamic data loader & Chart.js renderer
│   ├── customers.js                      # Customer intelligence dynamic data loader & RFM renderer
│   ├── products.js                       # Product & sales dynamic data loader & Pareto renderer
│   ├── marketing.js                      # Marketing & promotions dynamic data loader & lift renderer
│   └── report.js                         # AI executive report modal controller & print/PDF exporter
│
├── scripts/
│   └── import.py                         # PostgreSQL raw CSV bulk-import script
│
└── dunnhumby_The-Complete-Journey CSV/   # Raw Source CSV Files (2.59M transaction rows)
```

---

## 5. Database Architecture

The PostgreSQL database `dunnhumby_retail` contains four distinct schemas structured to separate raw staging from cleaned relational data, pre-computed analytical data marts, and system audit logs.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       PostgreSQL Database Schema Architecture                          │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ Raw CSV Datasets ]
          │
          ▼
 ┌────────────────────────────────────────┐
 │ Schema: `raw` (8 tables)               │ Direct untyped ingest from CSV files
 │ - raw.transaction_data                 │ (2,595,734 rows)
 │ - raw.product                          │ (92,339 rows)
 │ - raw.hh_demographic                   │ (801 rows)
 │ - raw.campaign_desc                    │ (30 rows)
 │ - raw.campaign_table                   │ (7,208 rows)
 │ - raw.coupon                           │ (124,550 rows)
 │ - raw.coupon_redempt                   │ (2,318 rows)
 │ - raw.causal_data                      │ (36,786,526 rows)
 └──────────────────┬─────────────────────┘
                    │
                    ▼  Cleaning, type casting, date normalization, indexing
 ┌────────────────────────────────────────┐
 │ Schema: `clean` (8 tables)             │ Normalized, strongly-typed relational tables
 │ - clean.transaction_data               │ Primary Foreign Keys: household_key, product_id
 └──────────────────┬─────────────────────┘
                    │
                    ▼  Aggregation, RFM scoring, half-over-half growth, lift calculation
 ┌────────────────────────────────────────┐
 │ Schema: `analytics` (26 tables/views)  │ Pre-computed analytical data marts
 │ 1. customer_rfm_scored                 │ RFM scores (1-5), monetary value, 6 customer segments
 │ 2. customer_intelligence               │ Spending trends, discount sensitivity, active weeks
 │ 3. department_metrics                  │ Department revenue, baskets, units, customer reach
 │ 4. category_metrics                    │ Category & sub-commodity revenues and unit volume
 │ 5. category_trend                      │ Half-over-half (H1 vs H2) category growth/contraction
 │ 6. weekly_metrics                      │ 102-week macro store indicators (revenue, HHs, baskets)
 │ 7. product_metrics                     │ SKU-level revenues, brand classification, household count
 │ 8. campaign_performance                │ Targeted HHs, redemptions, conversion rates (TypeA/B/C)
 │ 9. campaign_customer_spend             │ Pre- vs. post-campaign spend lift per household
 │ 10. customer_campaign_response         │ Segment-level campaign redemption and spend change
 │ 11. promotion_sales                    │ Display/mailer promotional sales vs baseline
 │ 12. customer_recommendations           │ Collaborative preference rankings per household
 │ 13. basket_metrics                     │ Basket size, revenue, and discount profiles
 └──────────────────┬─────────────────────┘
                    │
                    ▼  Read-only query execution & logging
 ┌────────────────────────────────────────┐
 │ Schema: `ai` (1 table)                 │ `ai.query_log` (Execution audit logs)
 └────────────────────────────────────────┘
```

### Key Analytics Data Mart Schema Definitions

#### 1. `analytics.customer_rfm_scored`
* `household_key` (bigint, PK): Unique household identifier.
* `last_purchase_day` (integer): Day index of latest transaction (1–719).
* `purchase_frequency` (bigint): Total distinct store visit days.
* `monetary_value` (numeric): Total cumulative spending ($).
* `avg_basket_value` (numeric): Spend per shopping trip ($).
* `recency_score` (integer): 1–5 quintile score.
* `frequency_score` (integer): 1–5 quintile score.
* `monetary_score` (integer): 1–5 quintile score.
* `customer_segment` (varchar): Categorical classification (*Champions*, *Loyal Customers*, *Recent Customers*, *Regular Customers*, *At Risk High Value*, *At Risk*).

#### 2. `analytics.weekly_metrics`
* `week_no` (integer, PK): Calendar week index (1–102).
* `active_households` (bigint): Unique households shopping in the week.
* `baskets` (bigint): Total completed transactions.
* `units` (bigint): Total items purchased.
* `revenue` (numeric): Gross weekly sales ($).
* `discounts` (numeric): Promotional and store loyalty discounts applied ($).

#### 3. `analytics.department_metrics`
* `department` (text, PK): Store department name (e.g., `GROCERY`, `DRUG GM`, `PRODUCE`, `MEAT`, `KIOSK-GAS`).
* `customers` (bigint): Total unique households shopping in department.
* `baskets` (bigint): Total shopping baskets containing department items.
* `units_sold` (bigint): Total item units purchased.
* `revenue` (numeric): Cumulative department sales ($).
* `discounts` (numeric): Department promotional markdowns ($).

#### 4. `analytics.campaign_performance`
* `campaign` (integer, PK): Marketing campaign identifier (1–30).
* `description` (text): Campaign tier classification (`TypeA`, `TypeB`, `TypeC`).
* `start_day` (integer) / `end_day` (integer): Campaign active window.
* `households_targeted` (bigint): Targeted household drop count.
* `households_redeemed` (bigint): Unique households redeeming coupons.
* `total_redemptions` (bigint): Cumulative coupons redeemed.
* `redemption_rate` (numeric): Percentage conversion ($(\text{redeemed}/\text{targeted}) \times 100$).

---

## 6. End-to-End Data Flow

The system orchestrates two primary asynchronous data pipelines:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            Pipeline A: Dashboard Metric Flow                           │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ Client Browser ] ──── HTTP GET ────► [ FastAPI Endpoint ] ──── Read-Only SQL ────► [ PostgreSQL ]
         │                                       │                                         │
         │                                       ▼                                         │
         │                              [ Python Serializer ]                              │
         │                                (Decimal -> Float)                               │
         │                                       │                                         │
         ◄──────── JSON Response ────────────────┴──────── Recordset Records ──────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Pipeline B: Conversational AI NL-to-SQL Flow                    │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ User Question ] ──► [ Prompt Builder ] ──► [ Google Gemini ] ──► [ Raw SQL Query ]
                                                                            │
                                                                            ▼
 [ Grounded Answer ] ◄── [ Gemini Summarizer ] ◄── [ Recordset ] ◄── [ SQL Safety Gate ]
                                                                       (SELECT only)
```

---

## 7. Complete API Documentation

The FastAPI backend exposes 12 production REST endpoints categorized into four operational groups.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI REST Endpoints Matrix                           │
├─────────┬───────────────────────────┬──────────────────────────────────────────────────┤
│ Method  │ Endpoint Path             │ Functional Purpose                               │
├─────────┼───────────────────────────┼──────────────────────────────────────────────────┤
│ `GET`   │ `/health`                 │ System & PostgreSQL connection health check      │
│ `GET`   │ `/ai/health`              │ Gemini API configuration health check            │
│ `POST`  │ `/chat`                   │ Conversational NL-to-SQL retail query assistant  │
│ `GET`   │ `/api/insights`           │ Deterministic automated business insight engine  │
│ `GET`   │ `/api/dashboard/overview` │ Executive overview KPI & trend data feed         │
│ `GET`   │ `/api/dashboard/customers`│ Customer intelligence & RFM cohort data feed     │
│ `GET`   │ `/api/dashboard/products` │ Product assortment, department & Pareto feed     │
│ `GET`   │ `/api/dashboard/marketing`│ Campaign performance & promotional lift feed     │
│ `POST`  │ `/api/reports/business`   │ AI executive business report generator           │
│ `POST`  │ `/api/agent/analyze`      │ Multi-step diagnostic AI Business Analyst agent  │
│ `POST`  │ `/api/analysis/run`       │ Automated multi-domain analysis pipeline trigger │
│ `GET`   │ `/api/analysis/latest`    │ Cached latest automated analysis result retrieval│
└─────────┴───────────────────────────┴──────────────────────────────────────────────────┘
```

### 7.1 Detailed Endpoint Specifications

#### 1. System Health Check (`GET /health`)
* **Purpose:** Validates FastAPI server runtime, checks active PostgreSQL connectivity, and returns active schemas.
* **Request:** None.
* **Response (`200 OK`):**
  ```json
  {
    "api_status": "healthy",
    "overall_status": "healthy",
    "database_status": {
      "status": "connected",
      "details": "Successfully connected to PostgreSQL database.",
      "version": "PostgreSQL 16.0..."
    },
    "version": "PostgreSQL 16.0...",
    "schemas_found": ["ai", "analytics", "clean", "public", "raw"]
  }
  ```
* **Error Handling:** Returns `503 Service Unavailable` if database connection fails.

#### 2. Gemini AI Health Check (`GET /ai/health`)
* **Purpose:** Checks presence of `GEMINI_API_KEY` in environment variables without making an external billable API call.
* **Request:** None.
* **Response (`200 OK`):** `{"status": "healthy", "gemini_configured": true}`
* **Error Handling:** Returns `503 Service Unavailable` with `gemini_configured: false` if key is missing.

#### 3. Conversational Retail Query (`POST /chat`)
* **Purpose:** Translates user prompt into safe SQL, executes query against PostgreSQL, and returns data with an executive summary.
* **Request Body:**
  ```json
  {
    "question": "What are the top 5 departments by total sales?",
    "history": [
      {"role": "user", "text": "What are the top 5 departments?"},
      {"role": "assistant", "text": "The top 5 departments are..."}
    ]
  }
  ```
* **Response (`200 OK`):**
  ```json
  {
    "question": "What are the top 5 departments by total sales?",
    "sql": "SELECT department, SUM(revenue) AS total_sales FROM analytics.department_metrics GROUP BY department ORDER BY total_sales DESC LIMIT 5",
    "data": [
      {"department": "GROCERY", "total_sales": 4093814.14},
      {"department": "DRUG GM", "total_sales": 1152060.03}
    ],
    "answer": "The top 5 departments are led by Grocery ($4,093,814.14)..."
  }
  ```
* **Error Handling:** Returns controlled error messages for SQL safety rejections or out-of-scope queries without leaking database internals.

#### 4. Automated Business Insights (`GET /api/insights`)
* **Purpose:** Returns background anomaly and trend detections across 6 business categories.
* **Request:** None.
* **Response (`200 OK`):**
  ```json
  {
    "insights": [
      {
        "type": "revenue_decline",
        "severity": "medium",
        "title": "Recent Weekly Revenue Trend (-3.49%)",
        "description": "Average weekly revenue over the recent 4-week period was $87,700.73 compared to $90,873.51 in the prior period (-3.49% change).",
        "metric": "weekly_revenue",
        "value": 87700.73,
        "change_pct": -3.49
      }
    ]
  }
  ```

#### 5. Executive Overview Dashboard (`GET /api/dashboard/overview`)
* **Purpose:** Delivers high-level store KPIs, 102-week revenue and customer trends, department breakdowns, top 10 categories, and customer segment counts.
* **Response (`200 OK`):** Contains `kpis`, `revenue_trend`, `customer_trend`, `department_revenue`, `category_revenue`, `customer_segments`.

#### 6. Customer Intelligence Dashboard (`GET /api/dashboard/customers`)
* **Purpose:** Delivers customer KPIs, RFM segment metrics, spend buckets, frequency distribution, recency scatter coordinates, and spend momentum.
* **Response (`200 OK`):** Contains `kpis`, `segments`, `spend_distribution`, `frequency_data`, `rfm_scatter`, `customer_trends`, `recommendations`.

#### 7. Product & Sales Intelligence Dashboard (`GET /api/dashboard/products`)
* **Purpose:** Delivers product KPIs, department sales and unit volume, category breakdowns, Pareto cumulative curves, top 10 products, and 25-row SKU leaderboard.
* **Response (`200 OK`):** Contains `kpis`, `department_revenue`, `department_units`, `category_revenue`, `pareto_data`, `top_products_revenue`, `product_table`.

#### 8. Marketing & Promotions Intelligence Dashboard (`GET /api/dashboard/marketing`)
* **Purpose:** Delivers campaign KPIs, 30-campaign performance table, redemption rankings, campaign reach vs. response scatter, campaign type (TypeA/B/C) comparison, and customer segment response.
* **Response (`200 OK`):** Contains `kpis`, `campaign_performance`, `campaign_ranking`, `campaign_reach_response`, `promotion_type_performance`, `channel_effectiveness`, `segment_response`.

#### 9. AI Business Report Generator (`POST /api/reports/business`)
* **Purpose:** Aggregates PostgreSQL analytics across all modules and prompts Gemini to produce a structured executive report.
* **Request Body:** `{"period": "overall"}`
* **Response (`200 OK`):** Contains `report_title`, `generated_at`, `executive_summary`, `sections` (`sales`, `customers`, `products`, `marketing`), `kpi_highlights`, `risks`, `opportunities`, `recommendations`.

#### 10. AI Business Analyst Agent (`POST /api/agent/analyze`)
* **Purpose:** Orchestrates multi-step investigation for diagnostic business inquiries.
* **Request Body:** `{"question": "Why did sales decline?"}`
* **Response (`200 OK`):** Contains `question`, `plan`, `findings`, `insights`, `recommendations`, `answer`.

#### 11. Automated Analysis Pipeline Run (`POST /api/analysis/run`)
* **Purpose:** Executes autonomous multi-domain retail scan, gathers PostgreSQL findings, evaluates strategic implications, and caches results in memory.
* **Response (`200 OK`):** Contains `status`, `generated_at`, `summary`, `findings`, `insights`, `risks`, `opportunities`, `recommendations`.

#### 12. Latest Automated Analysis Retrieval (`GET /api/analysis/latest`)
* **Purpose:** Returns cached automated analysis in sub-10ms latency.
* **Response (`200 OK`):** Returns cached analysis JSON object.

---

## 8. AI Architecture & Prompt Engineering

The AI layer operates on a fundamental principle: **Python and PostgreSQL perform all deterministic mathematical calculations, data aggregation, and safety validation; Google Gemini is used exclusively for linguistic intent mapping, SQL query generation, and narrative executive synthesis.**

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Dual-Engine Responsibility Matrix                      │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ PostgreSQL & Python Engine             │ Google Gemini Generative AI Layer             │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ • 102-week time-series aggregation     │ • Natural language query intent translation   │
│ • RFM quintile score calculation       │ • Formulating PostgreSQL `SELECT` syntax      │
│ • Pareto concentration % calculations  │ • Synthesizing grounded executive narratives  │
│ • Period-over-period delta detection   │ • Formatting currency ($), %, and rankings    │
│ • Deterministic regex AST safety gate  │ • Multi-step diagnostic investigation planning│
│ • Read-only database session controls  │ • Explaining pre-calculated anomaly insights  │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```

### 8.1 Model Integration & Fallback Configuration (`backend/ai.py`)
* **SDK:** `google-genai` (version 1.0.0+)
* **Primary Model:** `gemini-flash-lite-latest`
* **Fallback Model:** `gemini-flash-latest`
* **Resilience:** `backend/ai.py` automatically cascades through fallback models upon encountering API rate limits or 503 service issues, returning clean error responses without logging or exposing API credentials.

### 8.2 Centralized Prompt Architecture (`backend/prompts.py`)
1. **Schema Context Injection (`ANALYTICS_SCHEMA_CONTEXT`):** Injects exact table structures, columns, and data types for 15 core analytics data marts into every SQL generation call.
2. **Follow-Up Context Window (`format_followup_context`):** Maintains the last 3 conversation turns in memory, enabling natural pronoun resolution (*"Which customer segments are at risk?"* $\rightarrow$ *"How much revenue do **they** generate?"*).
3. **Out-of-Scope Gating:** Directs Gemini to return the exact string `OUT_OF_SCOPE` if inquiries are unrelated to retail analytics, preventing irrelevant database operations.
4. **Grounded Answer Synthesis (`build_business_answer_prompt`):** Supplies the exact database recordset to Gemini with strict negative constraints prohibiting metric hallucination.

---

## 9. SQL Safety & Security Defense

To guarantee absolute database protection, the system implements a multi-layer defense-in-depth architecture ensuring no malicious, destructive, or resource-exhaustive SQL reaches execution.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             Multi-Tier SQL Safety Architecture                         │
└────────────────────────────────────────────────────────────────────────────────────────┘

 1. Intent Scope Gate: Non-retail questions flagged as 'OUT_OF_SCOPE' (No SQL generated)
            │
            ▼
 2. AST / Syntax Sanitizer: Strips SQL comments (-- and /* */) and trims whitespace
            │
            ▼
 3. Command Restriction: Enforces query begins strictly with `SELECT` or `WITH`
            │
            ▼
 4. Blocklist Keyword Guard: Word-boundary regex rejects destructive verbs:
    [ DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, CREATE, GRANT, REVOKE, MERGE, COPY, EXEC ]
            │
            ▼
 5. Multi-Statement Defense: Rejects queries containing internal semicolons (injection blocker)
            │
            ▼
 6. Database-Level Read-Only Session: `conn.set_session(readonly=True, autocommit=True)`
            │
            ▼
 7. Result Buffer Cap: Capped at `MAX_QUERY_RESULTS = 500` rows (Memory Exhaustion Guard)
```

---

## 10. Frontend Architecture & User Interface

The frontend is implemented as a high-performance, multi-page application (MPA) served locally at `http://127.0.0.1:3000`.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Multi-Page Frontend Sitemap                               │
├───────────────────────┬───────────────────────────────┬────────────────────────────────┤
│ Page File             │ Dashboard Name                │ Dedicated Client Script        │
├───────────────────────┼───────────────────────────────┼────────────────────────────────┤
│ `index.html`          │ Executive Overview            │ `overview.js`, `report.js`     │
│ `customers.html`      │ Customer Intelligence (RFM)   │ `customers.js`, `report.js`    │
│ `products.html`       │ Product & Sales Intelligence  │ `products.js`, `report.js`     │
│ `marketing.html`      │ Marketing & Promotions        │ `marketing.js`, `report.js`    │
│ `ai.html`             │ AI Business Analyst Copilot   │ `app.js`, `report.js`          │
└───────────────────────┴───────────────────────────────┴────────────────────────────────┘
```

### UI Component Architecture:
* **Design System (`style.css`):** Built using CSS Custom Properties with an enterprise dark theme, glassmorphic card overlays, responsive flexbox/grid containers, and accessibility-compliant typography.
* **Conversational Chat Interface (`app.js`):** Features auto-expanding textarea, typing indicators, suggested query chips, raw SQL collapsible drawers, dynamic table renderers, and persistent multi-session chat history stored under `retail_ai_conversations_v1` in browser `localStorage`.
* **Executive Report Modal (`report.js`):** Reusable modal controller present on all pages, supporting one-click asynchronous report generation and native browser print/PDF export styling (`@media print`).

---

## 11. Core Analytics & Computational Logic

All analytical indicators are calculated deterministically using PostgreSQL SQL queries.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         Core Metrics Calculation Formulas                              │
├───────────────────────┬────────────────────────────────────────────────────────────────┤
│ Metric                │ Computational Formula / SQL Logic                              │
├───────────────────────┼────────────────────────────────────────────────────────────────┤
│ **Total Revenue**     │ `SUM(sales_value)` over all transactions                       │
│ **Avg Basket Value**  │ `SUM(sales_value) / NULLIF(COUNT(DISTINCT basket_id), 0)`      │
│ **Repeat Cust. Rate** │ `(COUNT(HH with visits >= 10) / COUNT(total HHs)) * 100`       │
│ **RFM Recency**       │ Days elapsed: `719 - MAX(transaction_day)` per household       │
│ **RFM Frequency**     │ `COUNT(DISTINCT transaction_day)` per household                │
│ **RFM Monetary**      │ `SUM(sales_value)` per household                               │
│ **Pareto Share**      │ `(SUM(top_n_revenue) / SUM(total_revenue)) * 100`              │
│ **Campaign Redemp. %**│ `(households_redeemed / NULLIF(households_targeted, 0)) * 100` │
│ **Spend Lift**        │ `SUM(post_campaign_spend - pre_campaign_spend)`                │
└───────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 12. Automated Insight Engine (`backend/insights.py`)

The automated insight engine runs independently of user questions to compute business insights across six retail domains:

1. **Revenue Trend:** Compares the rolling 4-week average revenue of Weeks 99–102 against Weeks 95–98 using threshold `REVENUE_CHANGE_THRESHOLD = 3.0%`.
2. **Customer Participation:** Compares average active shopping households in Weeks 99–102 against Weeks 95–98 using threshold `CUSTOMER_CHANGE_THRESHOLD = 3.0%`.
3. **Category Growth/Contraction:** Scans H1 vs. H2 revenue in `analytics.category_trend` for categories with $\ge \$1,000$ baseline using threshold `CATEGORY_CHANGE_THRESHOLD = 15.0%`.
4. **Campaign Efficacy:** Identifies top marketing campaigns where redemption rate $\ge 10.0\%$ (`CAMPAIGN_REDEMPTION_THRESHOLD`).
5. **Promotional Sales:** Aggregates dollar volume and unit throughput for items with `has_promotion = 1`.
6. **Customer Segment Risk:** Identifies high-value at-risk revenue exposure when segment household count $\ge 100$ (`SEGMENT_AT_RISK_THRESHOLD`).

---

## 13. AI Business Analyst Agent (`backend/agent.py`)

The AI Business Analyst Agent orchestrates autonomous multi-step diagnostic investigations:

```
[ User Query: "Why did sales decline?" ]
                    │
                    ▼
[ Step 1: Agent Planner ] ──► Formulates tool execution plan:
                              1. `revenue_analysis`
                              2. `customer_analysis`
                              3. `product_analysis`
                              4. `marketing_analysis`
                    │
                    ▼
[ Step 2: Tool Execution ] ──► Queries PostgreSQL analytics data marts
                    │
                    ▼
[ Step 3: Evidence Gathering ] ──► Aggregates structured findings & automated insights
                    │
                    ▼
[ Step 4: Diagnostic Evaluator ] ──► Prompts Gemini to synthesize root cause & action plan
                    │
                    ▼
[ Structured Executive Answer & Prioritized Recommendations Delivered ]
```

---

## 14. Automated Analysis Pipeline (`backend/pipeline.py`)

* **Trigger:** Invoked via `POST /api/analysis/run` or retrieved via `GET /api/analysis/latest`.
* **Execution:** Simultaneously collects findings from revenue, customer, product, and marketing tools alongside anomaly detections from `backend/insights.py`.
* **Synthesis:** Prompts Gemini with structured evidence to output:
  * **Executive Summary:** Macro business performance overview.
  * **Quantified Risks:** Top 3 operational and churn risk factors.
  * **Growth Opportunities:** Top 3 revenue acceleration vectors.
  * **Strategic Recommendations:** Top 4 prioritized management action items.
* **Caching:** Results are cached in-memory (`_LATEST_ANALYSIS_CACHE`) for sub-10ms subsequent retrievals.

---

## 15. AI Business Reports (`backend/reports.py`)

* **Endpoint:** `POST /api/reports/business` (payload: `{"period": "overall"}`).
* **Data Sources:** Live aggregations from `overview.py`, `customers_data.py`, `products_data.py`, `marketing_data.py`, and `insights.py`.
* **Report Sections:**
  * Executive Summary
  * Sales Performance
  * Customer Intelligence
  * Product & Sales Velocity
  * Marketing & Promotional Efficacy
  * Key Business Risks
  * Prioritized Management Action Plan
* **Grounding:** Injects live metrics into the prompt; Gemini structures and narrates the report without altering values.

---

## 16. Security & Privacy Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Security & Privacy Architecture                           │
├───────────────────────┬────────────────────────────────────────────────────────────────┤
│ Security Layer        │ Implementation Mechanism                                       │
├───────────────────────┼────────────────────────────────────────────────────────────────┤
│ **Secrets Isolation** │ `.env` file isolated in project root; excluded by `.gitignore` │
│ **Client Protection** │ Zero API keys or DB passwords exposed in frontend JS or HTML   │
│ **CORS Policy**       │ Restricted to local development origins (`127.0.0.1:3000`)     │
│ **Database Security** │ PostgreSQL sessions executed under `readonly=True`             │
│ **SQL Injection**     │ AST regex validation rejecting destructive verbs & semicolons  │
│ **Error Masking**     │ Generic error messages returned to clients; internal logs safe │
│ **Client Storage**    │ `localStorage` restricted to chat text only; zero auth secrets │
└───────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 17. System Testing & Verification Audit

As documented in [TEST_REPORT.md](file:///c:/dunnhumby_The-Complete-Journey/TEST_REPORT.md), the system passed **15 out of 15 validation categories** with zero critical defects.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             Final System Verification Matrix                           │
├────┬─────────────────────────────┬───────────────────────────┬────────┬────────────────┤
│ #  │ Test Category               │ Scope                     │ Status │ Latency / Pct  │
├────┼─────────────────────────────┼───────────────────────────┼────────┼────────────────┤
│ 1  │ Runtime Environment         │ Python 3.13.5, .venv      │ PASS   │ Clean Startup  │
│ 2  │ Database Integrity          │ 26 analytics marts        │ PASS   │ Read-Only Exec │
│ 3  │ REST API Endpoints          │ 12 REST Endpoints         │ PASS   │ 100% 200 OK    │
│ 4  │ SQL Safety & Injections     │ 10 Injection Payloads     │ PASS   │ 10/10 Blocked  │
│ 5  │ NL-to-SQL AI Generation     │ 6 Analytical Questions    │ PASS   │ 100% Grounded  │
│ 6  │ Follow-up Context Memory    │ Multi-turn chat context   │ PASS   │ Pronoun Resolv.│
│ 7  │ Automated Insights          │ 6 Domain Anomaly Detectors│ PASS   │ 7 Real Insights│
│ 8  │ Automated Analysis Pipeline │ Multi-Domain Scan         │ PASS   │ 12 Findings    │
│ 9  │ Business Report Synthesis   │ C-Suite Executive Report  │ PASS   │ 100% Reconciled│
│ 10 │ Frontend Web Pages          │ 5 Responsive Dashboards   │ PASS   │ 200 OK         │
│ 11 │ Local Storage Management    │ Multi-session Chat History│ PASS   │ Zero Leaks     │
│ 12 │ Security Audit              │ Secrets & CORS Scans      │ PASS   │ Clean Audit    │
│ 13 │ Data Accuracy               │ DB Ground Truth Matching  │ PASS   │ $0.00 Variance │
│ 14 │ Query Performance           │ Dashboard Latencies       │ PASS   │ < 60ms queries │
│ 15 │ Overall Status              │ Production Readiness      │ PASS   │ READY          │
└────┴─────────────────────────────┴───────────────────────────┴────────┴────────────────┘
```

---

## 18. Running the Project

Follow these exact operational steps to execute the system locally:

### Step 1: Activate Virtual Environment
Open PowerShell in the workspace root directory:
```powershell
.\.venv\Scripts\Activate.ps1
```

### Step 2: Verify Configuration (`.env`)
Ensure `.env` exists in the project root with the following structure:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dunnhumby_retail
DB_USER=postgres
DB_PASSWORD=<YOUR_POSTGRES_PASSWORD>
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-flash-lite-latest
```

### Step 3: Verify PostgreSQL Service
Ensure PostgreSQL is running locally on port `5432` with the `dunnhumby_retail` database loaded.

### Step 4: Launch FastAPI Backend
```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### Step 5: Launch Frontend Server
In a separate terminal window:
```powershell
python -m http.server 3000 --directory frontend
```

### Step 6: Access Application & Verify Health
* Open your browser and navigate to: `http://127.0.0.1:3000`
* Backend API Documentation: `http://127.0.0.1:8000/docs`
* Health Check: `http://127.0.0.1:8000/health`
* AI Health Check: `http://127.0.0.1:8000/ai/health`

---

## 19. Troubleshooting & Operational Support

| Operational Issue | Potential Root Cause | Verified Resolution |
| :--- | :--- | :--- |
| **`GET /health` returns 503** | PostgreSQL service stopped or invalid password in `.env`. | Start PostgreSQL service; verify credentials in `.env`. |
| **`GET /ai/health` returns 503** | `GEMINI_API_KEY` missing from `.env` or invalid. | Set valid Google GenAI API key in `.env` and restart backend. |
| **CORS Errors in Browser** | Accessing frontend from non-whitelisted port or host. | Ensure frontend is served from `http://127.0.0.1:3000` or `http://localhost:3000`. |
| **Chat returns "Out of Scope"** | Question is unrelated to retail analytics. | Phrase inquiries around departments, sales, customers, campaigns, or products. |
| **Chat returns "SQL validation failed"** | Generated query contained non-SELECT syntax. | Rephrase inquiry to request analytical aggregations. |

---

## 20. Technical & Methodological Limitations

1. **Historical Dataset:** Analysis represents a historical two-year retail transaction window (102 weeks).
2. **Observational Analytics:** Campaign spend lift represents observational correlation rather than controlled counterfactual causation.
3. **Demographic Sample:** Demographic profiles are available for 801 of the 2,500 total households.
4. **AI Generation Oversight:** Natural language outputs should be subjected to human-in-the-loop validation for edge cases.
5. **Deployment Scope:** Single-node configuration requires PgBouncer and distributed caching for high-concurrency multi-tenant production deployments.

---

## 21. Future Roadmap

* **Real-Time Streaming Ingestion:** Integration with Apache Kafka / Flink for sub-second POS transaction stream ingestion.
* **Predictive Supervised ML:** XGBoost and LightGBM models for 30-day customer churn scoring and temporal demand forecasting.
* **Enterprise SSO & RBAC:** OAuth2 / OpenID Connect integration with role-based access controls for department-level data segregation.
* **Scheduled PDF/Email Delivery:** Background worker distribution for automated weekly executive summaries.
* **A/B Testing Framework:** Statistical experimentation engine in PostgreSQL for randomized controlled promotional trials.

---

## 22. Final System Summary

The **AI-Assisted Retail Intelligence System** represents a complete synthesis of six engineering disciplines:

$$\text{Data Engineering} + \text{Business Analytics} + \text{Generative AI} + \text{SQL} + \text{Automation} + \text{Modern Web Applications}$$

By grounding generative AI directly in relational data marts with deterministic Python safety gating, the platform eliminates metric hallucination while unlocking intuitive, conversational data exploration. Retail leaders are empowered to monitor macro KPIs, detect customer churn risks, evaluate promotional lift, and execute evidence-based retail strategies with complete confidence.
