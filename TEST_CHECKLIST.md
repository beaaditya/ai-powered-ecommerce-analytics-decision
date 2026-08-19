# System Test & Verification Checklist

Status as of **August 18, 2026**: All core systems, safety guards, endpoints, and frontend pages are verified and passing.

---

## 1. Backend & Infrastructure Verification

| Test Component | Description | Status | Verified Output / Details |
| :--- | :--- | :---: | :--- |
| **Python Environment** | Python 3.13.5 running via `.venv` | **PASS** | `.venv\Scripts\python.exe` operates with all dependencies. |
| **PostgreSQL Connection** | Connection to `dunnhumby_retail` database | **PASS** | Connected with 5s timeout, discovered all 4 schemas. |
| **GET /health** | FastAPI health check endpoint | **PASS** | Returns `200 OK`, `database_status: connected`, PostgreSQL 18.4. |
| **Gemini AI SDK** | `google-genai` integration with model fallback | **PASS** | Configured with `gemini-flash-lite-latest` and fallback resilience. |
| **GET /ai/health** | Gemini AI configuration health check | **PASS** | Returns `200 OK`, `gemini_configured: true`. |
| **GET /api/insights** | Automated business insight detection endpoint | **PASS** | Returns `200 OK` with 7 real database insights across 6 categories. |
| **POST /chat** | Natural language retail SQL translation & summary | **PASS** | Returns `200 OK`, generated SQL, data array, and executive answer. |
| **CORS Middleware** | Preflight CORS headers for `127.0.0.1:3000` | **PASS** | `Access-Control-Allow-Origin: http://127.0.0.1:3000` returned. |

---

## 2. SQL Safety & Security Gate Verification

| Safety Test | Test Statement / Query | Status | Expected & Verified Outcome |
| :--- | :--- | :---: | :--- |
| **Valid Analytical SELECT** | `SELECT * FROM analytics.customer_rfm_scored LIMIT 10;` | **PASS** | Validated as `True` and executed safely. |
| **Valid CTE Query** | `WITH top_depts AS (...) SELECT * FROM top_depts;` | **PASS** | Validated as `True` and executed safely. |
| **Block DROP Table** | `DROP TABLE analytics.customer_rfm_scored;` | **PASS** | Blocked with `"Only read-only SELECT or WITH queries permitted."` |
| **Block DELETE Data** | `DELETE FROM analytics.customer_rfm_scored WHERE 1=1;` | **PASS** | Blocked before database execution. |
| **Block UPDATE Records** | `UPDATE analytics.customer_rfm_scored SET monetary_value = 0;` | **PASS** | Blocked before database execution. |
| **Block INSERT Rows** | `INSERT INTO analytics.customer_rfm_scored VALUES (1, 2, 3);` | **PASS** | Blocked before database execution. |
| **Block Multi-Statement** | `SELECT * FROM ...; DROP TABLE ...;` | **PASS** | Blocked with `"Multiple SQL statements are not permitted."` |
| **Read-Only Session** | Enforce `conn.set_session(readonly=True)` | **PASS** | Verified PostgreSQL read-only transaction mode. |
| **Max Result Cap** | Cap results at `MAX_QUERY_RESULTS = 500` | **PASS** | Verified in `execute_sql` fetch size limiter. |

---

## 3. Analytics Quality & Answer Validation

| Quality Test | Input Query | Status | Verified Outcome |
| :--- | :--- | :---: | :--- |
| **Department Sales** | *"What are the top 5 departments by sales?"* | **PASS** | Returned exact figures ($4.09M Grocery, $1.05M Drug GM, etc.). |
| **RFM Segmentation** | *"How many customers are in each RFM segment?"* | **PASS** | Returned exact counts for all 2,500 households across 6 cohorts. |
| **Product Leaders** | *"Which products generate highest revenue?"* | **PASS** | Returned top 10 SKUs with IDs, brand types, units, and revenues. |
| **Empty Result Gating** | *"What are sales for department NONEXISTENT_XYZ?"* | **PASS** | Returned `"No matching data was found for this question..."` without hallucinating. |
| **Out-of-Scope Gating** | *"What is the weather today?"* | **PASS** | Detected `OUT_OF_SCOPE`, generated no SQL, and politely redirected. |

---

## 4. Frontend & Session History Verification

| Frontend Test | Description | Status | Verified Outcome |
| :--- | :--- | :---: | :--- |
| **Executive Overview Page** | `http://127.0.0.1:3000/index.html` | **PASS** | Served with 200 OK, KPI cards, and insights container. |
| **Customer Intelligence Page**| `http://127.0.0.1:3000/customers.html` | **PASS** | Served with 200 OK, RFM and churn risk panels. |
| **Product & Sales Page** | `http://127.0.0.1:3000/products.html` | **PASS** | Served with 200 OK, department and category momentum panels. |
| **Marketing & Promotions Page**| `http://127.0.0.1:3000/marketing.html` | **PASS** | Served with 200 OK, campaign and promotion panels. |
| **AI Business Analyst Page** | `http://127.0.0.1:3000/ai.html` | **PASS** | Served with 200 OK, conversational chat interface active. |
| **LocalStorage Persistence** | Session history under `retail_ai_conversations_v1` | **PASS** | Verified multi-conversation storage, switching, and deletion. |
| **Auto Title Generation** | Automatic generation of concise conversation titles | **PASS** | Verified topic matching (e.g. "RFM Segment Analysis"). |
