# AI Architecture & Decision Engine Specification

This document details the artificial intelligence architecture, model prompts, SQL generation, safety gating, and analytical synthesis pipelines.

---

## 1. Core AI Architecture Flow

```
[User Natural Language Question]
           │
           ▼
┌────────────────────────────────────────┐
│  Intent Scope & Query Formulation      │  (Gemini with Analytics Schema Prompt)
│  - Checks relevance to Dunnhumby data  │
│  - Generates single PostgreSQL query   │
└──────────────────┬─────────────────────┘
                   │  "SELECT ... FROM analytics..." or "OUT_OF_SCOPE"
                   ▼
┌────────────────────────────────────────┐
│  SQL Safety Validation Gate            │  (Deterministic Python Regex Engine)
│  - Blocks non-SELECT/WITH statements   │
│  - Blocks destructive keywords         │
│  - Blocks multiple chained statements  │
└──────────────────┬─────────────────────┘
                   │
         [Is Valid & Read-Only?]
         ├── NO  ──► Return Safe Rejection Notice (No DB execution)
         │
         └── YES
              │
              ▼
┌────────────────────────────────────────┐
│  PostgreSQL Database Execution         │  (analytics schema)
│  - Read-Only Transaction Session       │
│  - Capped to 500 records               │
│  - Decimal/Date serialization          │
└──────────────────┬─────────────────────┘
                   │
           [Data Recordset]
                   │
                   ▼
┌────────────────────────────────────────┐
│  Executive Business Summarization      │  (Gemini Grounded Synthesizer)
│  - Grounded strictly in returned data  │
│  - Zero metric hallucination allowed   │
│  - Formatted with $, %, and rankings   │
└──────────────────┬─────────────────────┘
                   │
                   ▼
   [Response: question, sql, data, answer]
```

---

## 2. Gemini AI Integration & Model Selection

- **SDK:** `google-genai` (version `1.0.0+`)
- **Primary Model:** `gemini-flash-lite-latest` (configured via `GEMINI_MODEL` environment variable)
- **Fallback Models:** `["gemini-flash-lite-latest", "gemini-flash-latest"]`
- **Error Handling:** If a model experiences rate limits or temporary 503 errors, `backend/ai.py` automatically iterates through fallback models before returning a clean server error without exposing credentials.

---

## 3. Natural-Language-to-SQL Prompt Engineering

The system prompt provides complete schema context for all 13 core analytics data marts:
- **RFM Segment Schema:** `customer_rfm_scored`
- **Customer Metrics:** `customer_intelligence`, `customer_metrics`, `customer_trend`, `customer_discount`
- **Store & Category:** `department_metrics`, `category_metrics`, `category_trend`, `category_weekly`
- **Marketing & Promotions:** `campaign_performance`, `campaign_customer_spend`, `promotion_sales`
- **Products & Basket:** `product_metrics`, `basket_metrics`, `weekly_metrics`

### Rules Enforced by the System Prompt:
1. Always output executable PostgreSQL query prefixed with the schema `analytics.`.
2. Output ONLY the query without surrounding conversational text.
3. If a question is outside the scope of retail analytics (e.g. general weather or non-retail trivia), output `OUT_OF_SCOPE`.

---

## 4. SQL Safety & Security Gate (`backend/sql_agent.py`)

1. **Syntax Checking**: Sanitizes comments (`--` and `/* */`) and verifies statements start with `SELECT` or `WITH`.
2. **Keyword Blocklist**: Uses regex word boundaries to block:
   `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `MERGE`, `COPY`, `CALL`, `EXECUTE`, `EXEC`.
3. **Multi-Statement Defense**: Rejects queries with internal semicolons.
4. **Database-Level Protection**: Sets `conn.set_session(readonly=True, autocommit=True)`.
5. **Memory Defense**: Caps record fetching at 500 rows (`MAX_QUERY_RESULTS`).

---

## 5. Result-Grounded Answer Synthesis

When query results return from PostgreSQL:
1. **Empty Result Protection**: If 0 rows are returned, the assistant directly returns:
   `"No matching data was found for this question in the retail analytics database."`
   (bypassing LLM generation to prevent metric hallucination).
2. **Grounded Summarization**: When rows are present, the exact recordset is passed to Gemini with explicit constraints:
   - Direct answer stating the findings clearly.
   - Important numbers and rankings directly from the data.
   - Brief business insights and retail implications for leadership.
   - Standardized formatting for currency (`$`), percentages (`%`), and counts.

---

## 6. Automated Business Insight Engine (`backend/insights.py`)

Independent of user questions, `backend/insights.py` computes business insights across 6 retail domains using deterministic Python/SQL formulas:

1. **Revenue Trend**: 4-week moving average comparison (weeks 99-102 vs 95-98).
2. **Customer Trend**: Active household participation changes.
3. **Category Performance**: H1 vs H2 growth & decline categories with minimum baseline spend $\ge \$1,000$.
4. **Campaign Performance**: Ranking campaigns by household redemption percentage.
5. **Promotion Performance**: Measuring revenue and unit volume generated by promoted products.
6. **Customer Segment Risk**: Identifying revenue at risk in the `At Risk High Value` RFM cohort.
