# FastAPI Backend — API Documentation

This document specifies all currently active API endpoints implemented in `backend/main.py`.

---

## 1. System Health Check

### `GET /health`
Tests API and PostgreSQL database connectivity and reports server metadata.

- **URL:** `http://127.0.0.1:8000/health`
- **Method:** `GET`
- **Headers:** None
- **Request Body:** None

#### Response (Success - `200 OK`):
```json
{
  "api_status": "healthy",
  "overall_status": "healthy",
  "database_status": {
    "status": "connected",
    "details": "Successfully connected to PostgreSQL database.",
    "version": "PostgreSQL 18.4 on x86_64-windows..."
  },
  "version": "PostgreSQL 18.4 on x86_64-windows...",
  "schemas_found": [
    "ai",
    "analytics",
    "clean",
    "public",
    "raw"
  ]
}
```

#### Response (Database Disconnected - `503 Service Unavailable`):
```json
{
  "api_status": "healthy",
  "overall_status": "unhealthy",
  "database_status": {
    "status": "disconnected",
    "details": "connection to server at \"localhost\" failed..."
  },
  "version": null,
  "schemas_found": []
}
```

---

## 2. Gemini AI Health Check

### `GET /ai/health`
Verifies that the Google Gemini API key is configured in the environment variables without making an external API call.

- **URL:** `http://127.0.0.1:8000/ai/health`
- **Method:** `GET`
- **Headers:** None
- **Request Body:** None

#### Response (Configured - `200 OK`):
```json
{
  "status": "healthy",
  "gemini_configured": true
}
```

#### Response (Missing Key - `503 Service Unavailable`):
```json
{
  "status": "unhealthy",
  "gemini_configured": false
}
```

---

## 3. Conversational Retail AI Querying

### `POST /chat`
Translates plain English retail questions into validated PostgreSQL `SELECT` queries, executes them against the `analytics` schema in read-only mode, and generates a grounded executive summary.

- **URL:** `http://127.0.0.1:8000/chat`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "question": "What are the top 5 departments by total sales?"
}
```

#### Response (`200 OK`):
```json
{
  "question": "What are the top 5 departments by total sales?",
  "sql": "SELECT department, SUM(revenue) AS total_sales FROM analytics.department_metrics GROUP BY department ORDER BY total_sales DESC LIMIT 5",
  "data": [
    {
      "department": "GROCERY",
      "total_sales": 4093814.14
    },
    {
      "department": "DRUG GM",
      "total_sales": 1055358.03
    },
    {
      "department": "PRODUCE",
      "total_sales": 557452.11
    },
    {
      "department": "MEAT",
      "total_sales": 548786.81
    },
    {
      "department": "KIOSK-GAS",
      "total_sales": 544222.28
    }
  ],
  "answer": "The top 5 departments by total sales are led heavily by Grocery ($4,093,814.14), followed by Drug GM ($1,055,358.03), Produce ($557,452.11), Meat ($548,786.81), and Kiosk-Gas ($544,222.28)..."
}
```

---

## 4. Automated Business Insights

### `GET /api/insights`
Proactively calculates trends, anomalies, and risk factors across weekly revenue, active customers, category momentum, marketing campaigns, promotions, and customer segment risk.

- **URL:** `http://127.0.0.1:8000/api/insights`
- **Method:** `GET`
- **Headers:** None
- **Request Body:** None

#### Response (`200 OK`):
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
    },
    {
      "type": "customer_activity_contraction",
      "severity": "medium",
      "title": "Active Customer Participation (-4.63%)",
      "description": "Active shopping households averaged 1,278 in recent weeks versus 1,340 in the previous period (-4.63% change in active participation).",
      "metric": "active_households",
      "value": 1278,
      "change_pct": -4.63
    },
    {
      "type": "category_growth",
      "severity": "low",
      "title": "High Growth Category: Garden Center",
      "description": "GARDEN CENTER in GARDEN CENTER surged +144.77% from $2,078.10 in H1 to $5,086.56 in H2 (+$3,008.46 gain).",
      "metric": "category_revenue",
      "value": 5086.56,
      "change_pct": 144.77
    },
    {
      "type": "category_decline",
      "severity": "medium",
      "title": "Category Contraction: Corn",
      "description": "CORN in PRODUCE contracted -21.33% from $3,042.07 in H1 to $2,393.31 in H2 ($-648.76 drop).",
      "metric": "category_revenue",
      "value": 2393.31,
      "change_pct": -21.33
    },
    {
      "type": "campaign_top_performer",
      "severity": "low",
      "title": "Top Campaign: Campaign 18 (TypeA)",
      "description": "Campaign 18 achieved the highest engagement with an 18.89% redemption rate (214 households redeemed out of 1,133 targeted, totaling 653 coupon redemptions).",
      "metric": "redemption_rate",
      "value": 18.89,
      "change_pct": 18.89
    },
    {
      "type": "promotion_sales_volume",
      "severity": "low",
      "title": "Promotional Revenue Impact",
      "description": "Promoted items generated $1,559,228.97 across 796,129 units sold at an average item price of $1.96.",
      "metric": "promoted_revenue",
      "value": 1559228.97,
      "change_pct": 0.0
    },
    {
      "type": "customer_segment_risk",
      "severity": "high",
      "title": "Revenue At Risk: At Risk High Value",
      "description": "585 households classified in the 'At Risk High Value' segment represent $3,990,569.06 in historical spend (average $6,821.49 per household), requiring targeted retention.",
      "metric": "at_risk_spend",
      "value": 3990569.06,
      "change_pct": null
    }
  ]
}
```
