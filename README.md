# AI-Powered E-Commerce Analytics & Decision

An AI-assisted business intelligence and decision-support system for
e-commerce and retail analytics.

## Overview

AI-Powered E-Commerce Analytics & Decision combines a PostgreSQL
analytics database, SQL-based business analysis, a FastAPI backend, a
browser-based analytics dashboard, and Gemini AI.

The system supports both user-driven analysis and proactive business
intelligence.

### User-Driven Analysis

Business users can ask natural-language questions such as:

-   What are the top products by sales?
-   How many customers are in each RFM segment?
-   Which campaigns performed best?
-   Which categories are growing or declining?

The AI-assisted workflow generates analytical SQL, validates it as
read-only, executes it against PostgreSQL, validates the results, and
produces a business-oriented explanation and recommendation.

### Proactive Business Intelligence

The platform also surfaces automated findings involving:

-   Revenue changes
-   Customer behavior
-   Product/category growth and contraction
-   Promotion and campaign performance
-   Customer-risk opportunities
-   Business recommendations

## Key Features

-   Executive business overview
-   Customer intelligence
-   Product and sales analytics
-   Marketing and promotion analytics
-   AI Business Analyst
-   Natural-language-to-SQL
-   Read-only SQL validation
-   Automated business insights
-   RFM customer segmentation
-   Revenue analysis
-   Product performance analysis
-   Promotion effectiveness analysis
-   Campaign analysis
-   Query result validation
-   Business explanations and recommendations
-   Version-controlled SQL analysis files
-   Technical and database documentation
-   Responsive premium dashboard UI
-   Vercel deployment configuration

## Technology Stack

### Frontend

-   HTML5
-   CSS3
-   JavaScript
-   Business dashboards and visualizations
-   Responsive UI

### Backend

-   Python
-   FastAPI
-   Uvicorn
-   Pydantic
-   psycopg2

### Database

-   PostgreSQL
-   Raw data schema
-   Cleaned analytics tables
-   Analytical SQL
-   Database views

### AI

-   Google Gemini API
-   Natural-language business question processing
-   SQL generation
-   Business explanation
-   AI-assisted investigation

### Deployment

-   GitHub
-   Vercel

## Architecture

``` text
Business Users
      |
      v
Frontend Dashboard
      |
      v
FastAPI Backend
      |
      +--------------------+
      |                    |
      v                    v
  AI Service          Analytics Services
      |                    |
      v                    v
 Gemini AI             PostgreSQL
                           |
                           v
                    Analytics Tables
                           |
                           v
                    Business Insights
```

### AI analytical workflow

``` text
Natural Language Question
          |
          v
       Gemini AI
          |
          v
     SQL Generation
          |
          v
 SQL Safety Validation
      (Read-Only)
          |
          v
      PostgreSQL
          |
          v
     Query Results
          |
          v
    Result Validation
          |
          v
 Business Explanation
          |
          v
 Recommendations
```

## Project Structure

``` text
ai-powered-ecommerce-analytics-decision/
│
├── api/
├── backend/
├── frontend/
│   ├── index.html
│   ├── customers.html
│   ├── products.html
│   ├── marketing.html
│   ├── ai.html
│   ├── overview.js
│   ├── customers.js
│   ├── products.js
│   ├── marketing.js
│   └── style.css
│
├── docs/
├── scripts/
├── sql/
│   ├── 01_schema/
│   │   ├── create_schema.sql
│   │   ├── create_raw_tables.sql
│   │   └── create_analytics_tables.sql
│   │
│   ├── 02_ingestion/
│   │   ├── load_raw_data.sql
│   │   └── verify_row_counts.sql
│   │
│   ├── 03_cleaning/
│   │   ├── clean_households.sql
│   │   ├── clean_transactions.sql
│   │   ├── clean_products.sql
│   │   ├── clean_campaigns.sql
│   │   └── cleaning_summary.sql
│   │
│   ├── 04_validation/
│   │   ├── validate_nulls.sql
│   │   ├── validate_duplicates.sql
│   │   ├── validate_foreign_keys.sql
│   │   ├── validate_ranges.sql
│   │   └── data_quality_report.sql
│   │
│   ├── 05_analytics/
│   │   ├── revenue_analysis.sql
│   │   ├── customer_analysis.sql
│   │   ├── product_analysis.sql
│   │   ├── promotion_analysis.sql
│   │   └── rfm_analysis.sql
│   │
│   └── 06_views/
│       ├── executive_overview.sql
│       ├── customer_intelligence.sql
│       ├── product_sales.sql
│       └── marketing_promotions.sql
│
├── .env.example
├── .gitignore
├── requirements.txt
├── vercel.json
├── README.md
├── AI_ARCHITECTURE.md
├── API_DOCUMENTATION.md
├── BUSINESS_CASE_STUDY.md
├── DATABASE_DOCUMENTATION.md
├── TECHNICAL_DOCUMENTATION.md
├── TEST_CHECKLIST.md
└── TEST_REPORT.md
```

## Dashboard Sections

### Executive Overview

High-level business performance including revenue, active households,
units sold, average basket value, purchase frequency, automated
insights, and customer segment distribution.

### Customer Intelligence

Customer behavior, customer segmentation, and RFM-based analysis.

### Product & Sales

Product, category, sales, and product-performance analysis.

### Marketing & Promotions

Campaign, coupon, redemption, promotion, and promotional-effectiveness
analysis.

### AI Business Analyst

A natural-language analytical interface that can return:

1.  Direct business answer
2.  Key findings
3.  Business interpretation
4.  Recommended actions
5.  Query result data
6.  Generated SQL where appropriate

## Database Lifecycle

``` text
Schema Creation
      |
      v
Raw Data Tables
      |
      v
Data Ingestion
      |
      v
Data Cleaning
      |
      v
Data Validation
      |
      v
Analytics Tables
      |
      v
Analytical Queries
      |
      v
Business Views
```

The SQL directory keeps the major database work organized and
version-controlled.

-   `01_schema` --- schema and table creation
-   `02_ingestion` --- loading and row-count verification
-   `03_cleaning` --- entity-specific cleaning
-   `04_validation` --- null, duplicate, foreign-key, range, and quality
    checks
-   `05_analytics` --- revenue, customer, product, promotion, and RFM
    analysis
-   `06_views` --- dashboard-oriented business views

## Environment Variables

Create a local `.env` file from `.env.example`.

Typical configuration:

``` text
DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=
GEMINI_API_KEY=
```

Never commit `.env`, passwords, or API keys to GitHub.

## Local Setup

### Clone

``` bash
git clone https://github.com/beaaditya/ai-powered-ecommerce-analytics-decision.git
cd ai-powered-ecommerce-analytics-decision
```

### Create virtual environment

Windows PowerShell:

``` powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### Install dependencies

``` bash
pip install -r requirements.txt
```

### Configure environment

Create `.env` using `.env.example` and provide the required PostgreSQL
and Gemini configuration.

### Start backend

Use the FastAPI entry point configured in the project. For a standard
FastAPI layout:

``` bash
uvicorn backend.main:app --reload
```

### Start frontend

From the project root:

``` bash
python -m http.server 3000 --directory frontend
```

Then open:

``` text
http://localhost:3000/
```

## Security

The AI analytical workflow is intended to use read-only SQL:

``` text
User Question
     |
     v
AI SQL Generation
     |
     v
SQL Validation
     |
     v
READ-ONLY Query
     |
     v
PostgreSQL
```

The AI should not directly modify the production database.

Database credentials and Gemini API keys must remain in environment
variables.

## Data and GitHub

The repository contains the application, SQL, documentation, and
architecture materials.

Large raw CSV files are intentionally excluded from GitHub because
GitHub rejects files over its normal 100 MB per-file limit.

The raw dataset can remain local and be loaded into PostgreSQL using the
project's ingestion process.

## Deployment

The project includes `vercel.json` for deployment configuration.

Production architecture:

``` text
GitHub
   |
   v
Vercel
   |
   +---- Frontend
   |
   +---- API configuration
   |
   v
PostgreSQL
   |
   v
Gemini API
```

Production environment variables should be configured in the deployment
platform, not committed to source control.

After deployment, verify:

-   Dashboard pages load
-   API endpoints respond
-   PostgreSQL connection works
-   Gemini requests work
-   AI-generated SQL remains read-only
-   KPI values render correctly
-   Charts render correctly
-   AI Business Analyst returns results
-   Navigation works across all pages

## Documentation

  Document                       Purpose
  ------------------------------ ------------------------------------
  `AI_ARCHITECTURE.md`           AI architecture and workflows
  `API_DOCUMENTATION.md`         API documentation
  `BUSINESS_CASE_STUDY.md`       Business problem and solution
  `DATABASE_DOCUMENTATION.md`    Database design and structures
  `TECHNICAL_DOCUMENTATION.md`   Technical implementation
  `TEST_CHECKLIST.md`            Functional testing checklist
  `TEST_REPORT.md`               Testing results
  `docs/`                        Architecture and workflow diagrams

## Project Objective

The goal is to demonstrate how AI can be integrated with traditional
business intelligence to create a practical decision-support platform.

``` text
Raw Data
   ↓
Clean & Validate
   ↓
Analytics
   ↓
AI-Assisted Investigation
   ↓
Business Insights
   ↓
Recommendations
   ↓
Business Decision
```

## Project Status

**Status: Functional / deployment preparation**

The dashboard, database analytics, AI Business Analyst, SQL
organization, documentation, and UI have been implemented and tested
locally.

The next stage is production deployment and final end-to-end
verification.

## Author

Developed as an AI-assisted e-commerce analytics and business
decision-support capstone project.

**Project:** AI-Powered E-Commerce Analytics & Decision
