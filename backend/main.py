from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

try:
    from backend.database import check_db_health
    from backend.ai import is_gemini_configured
    from backend.sql_agent import process_retail_question
    from backend.insights import get_all_business_insights
    from backend.overview import get_overview_dashboard_data
    from backend.customers_data import get_customer_intelligence_data
    from backend.products_data import get_product_sales_data
    from backend.marketing_data import get_marketing_promotions_data
    from backend.reports import generate_business_report
    from backend.agent import run_business_analyst_agent
    from backend.pipeline import run_automated_analysis_pipeline, get_latest_automated_analysis
except ImportError:
    from database import check_db_health
    from ai import is_gemini_configured
    from sql_agent import process_retail_question
    from insights import get_all_business_insights
    from overview import get_overview_dashboard_data
    from customers_data import get_customer_intelligence_data
    from products_data import get_product_sales_data
    from marketing_data import get_marketing_promotions_data
    from reports import generate_business_report
    from agent import run_business_analyst_agent
    from pipeline import run_automated_analysis_pipeline, get_latest_automated_analysis

import os

app = FastAPI(
    title="AI Retail Intelligence API",
    description="Backend API for Retail Intelligence System",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# CORS Configuration supporting local development and production FRONTEND_URL
origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

# Allow dynamic production frontend URL configuration
frontend_url_env = os.getenv("FRONTEND_URL", "").strip()
if frontend_url_env:
    for url in frontend_url_env.split(","):
        url = url.strip()
        if url and url not in origins:
            origins.append(url)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
if allowed_origins_env:
    for url in allowed_origins_env.split(","):
        url = url.strip()
        if url and url not in origins:
            origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from typing import Any, Dict, List, Optional


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[Dict[str, Any]]] = None


@app.get("/api/health")
def health_check():
    """
    Health check endpoint to test API and PostgreSQL database connectivity.
    """
    db_health = check_db_health()

    if db_health["connected"]:
        return {
            "api_status": "healthy",
            "overall_status": "healthy",
            "database_status": {
                "status": "connected",
                "details": db_health["details"],
                "version": db_health["version"]
            },
            "version": db_health["version"],
            "schemas_found": db_health["schemas"]
        }
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "api_status": "healthy",
                "overall_status": "unhealthy",
                "database_status": {
                    "status": "disconnected",
                    "details": db_health["error"]
                },
                "version": None,
                "schemas_found": []
            }
        )


@app.get("/api/ai/health")
def ai_health_check():
    """
    Health check endpoint to test Gemini configuration availability.
    Does not make an external Gemini API call.
    """
    configured = is_gemini_configured()
    if configured:
        return {
            "status": "healthy",
            "gemini_configured": True
        }
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "gemini_configured": False
            }
        )


@app.post("/api/chat")
def chat_endpoint(payload: ChatRequest):
    """
    Natural-language-to-SQL chat endpoint for Retail Intelligence.
    Translates questions to SQL, queries PostgreSQL database, and returns insights.
    Supports optional conversation history context for follow-up questions.
    """
    return process_retail_question(payload.question, history=payload.history)


@app.get("/api/insights")
def get_insights_endpoint():
    """
    Automated business insight generation endpoint.
    Scans analytics tables to detect significant trends, anomalies, and risk factors.
    """
    insights_list = get_all_business_insights()
    return {
        "insights": insights_list
    }


@app.get("/api/dashboard/overview")
def get_overview_dashboard_endpoint():
    """
    Executive Overview Dashboard metrics endpoint.
    Returns real PostgreSQL aggregations for KPIs, weekly trends, departments, top categories, and customer segments.
    """
    return get_overview_dashboard_data()


@app.get("/api/dashboard/customers")
def get_customer_intelligence_endpoint():
    """
    Customer Intelligence Dashboard metrics endpoint.
    Returns real PostgreSQL aggregations for customer KPIs, RFM cohort spend, frequency distribution, spend buckets, scatter plot recency, and recommendations.
    """
    return get_customer_intelligence_data()


@app.get("/api/dashboard/products")
def get_product_sales_endpoint():
    """
    Product & Sales Intelligence Dashboard metrics endpoint.
    Returns real PostgreSQL aggregations for product KPIs, department sales & unit volume, top categories, revenue vs units scatter, Pareto concentration, and product table.
    """
    return get_product_sales_data()


@app.get("/api/dashboard/marketing")
def get_marketing_promotions_endpoint():
    """
    Marketing & Promotions Intelligence Dashboard metrics endpoint.
    Returns real PostgreSQL aggregations for campaign KPIs, campaign performance ranking, reach vs response scatter, campaign type performance, promotional channel lift, and customer segment response.
    """
    return get_marketing_promotions_data()


class ReportRequest(BaseModel):
    period: Optional[str] = "overall"


@app.post("/api/reports/business")
def generate_business_report_endpoint(payload: Optional[ReportRequest] = None):
    """
    AI-generated Business Intelligence Management Report endpoint.
    Aggregates real PostgreSQL analytics metrics from overview, customer, product, and marketing modules,
    passes findings to Gemini, and returns a structured executive report.
    """
    period = payload.period if payload and payload.period else "overall"
    return generate_business_report(period=period)


class AgentRequest(BaseModel):
    question: str


@app.post("/api/agent/analyze")
def agent_analyze_endpoint(payload: AgentRequest):
    """
    Advanced AI Business Analyst Agent endpoint.
    Orchestrates multi-step investigation across revenue, customers, products, campaigns, and insights.
    Synthesizes evidence-grounded diagnosis and actionable business recommendations.
    """
    return run_business_analyst_agent(payload.question)


@app.post("/api/analysis/run")
def run_analysis_endpoint():
    """
    Automated Business Analysis Pipeline execution endpoint.
    Runs comprehensive multi-domain retail analytics scan, gathers structured PostgreSQL findings,
    evaluates strategic implications with Gemini, and returns actionable management recommendations.
    """
    return run_automated_analysis_pipeline()


@app.get("/api/analysis/latest")
def get_latest_analysis_endpoint():
    """
    Retrieves the latest automated business analysis result from in-memory cache,
    or triggers a fresh execution if none is cached yet.
    """
    return get_latest_automated_analysis()
