import logging
from decimal import Decimal
from typing import Any, Dict, List

try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

logger = logging.getLogger("overview_dashboard")


def serialize_val(val: Any) -> Any:
    """Helper to convert Decimal or numeric objects to Python floats/ints."""
    if val is None:
        return 0
    if isinstance(val, Decimal):
        return float(val)
    return val


def get_overview_dashboard_data() -> Dict[str, Any]:
    """
    Retrieves real PostgreSQL analytical metrics for the Executive Overview Dashboard.
    Data is aggregated strictly from analytics schema tables:
    - analytics.weekly_metrics
    - analytics.customer_rfm_scored
    - analytics.department_metrics
    - analytics.category_metrics
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        # 1. Overall KPIs
        cursor.execute("""
            SELECT 
                (SELECT SUM(revenue) FROM analytics.weekly_metrics) as total_revenue,
                (SELECT COUNT(DISTINCT household_key) FROM analytics.customer_rfm_scored) as active_customers,
                (SELECT SUM(units) FROM analytics.weekly_metrics) as total_units,
                (SELECT SUM(revenue) / NULLIF(SUM(baskets), 0) FROM analytics.weekly_metrics) as avg_basket_value,
                (SELECT AVG(purchase_frequency) FROM analytics.customer_rfm_scored) as purchase_frequency;
        """)
        kpi_row = cursor.fetchone()
        kpis = {
            "total_revenue": serialize_val(kpi_row[0]) if kpi_row else 0.0,
            "active_customers": int(kpi_row[1]) if kpi_row and kpi_row[1] is not None else 0,
            "total_units_sold": int(kpi_row[2]) if kpi_row and kpi_row[2] is not None else 0,
            "avg_basket_value": round(serialize_val(kpi_row[3]), 2) if kpi_row else 0.0,
            "purchase_frequency": round(serialize_val(kpi_row[4]), 1) if kpi_row else 0.0
        }

        # 2. Weekly Revenue Trend (weeks 1 - 102)
        cursor.execute("""
            SELECT week_no, revenue
            FROM analytics.weekly_metrics
            ORDER BY week_no;
        """)
        rev_rows = cursor.fetchall()
        revenue_trend = [
            {"week_no": int(r[0]), "revenue": round(serialize_val(r[1]), 2)}
            for r in rev_rows
        ]

        # 3. Weekly Active Customer Trend (weeks 1 - 102)
        cursor.execute("""
            SELECT week_no, active_households
            FROM analytics.weekly_metrics
            ORDER BY week_no;
        """)
        cust_rows = cursor.fetchall()
        customer_trend = [
            {"week_no": int(r[0]), "active_households": int(r[1]) if r[1] is not None else 0}
            for r in cust_rows
        ]

        # 4. Revenue by Department
        cursor.execute("""
            SELECT department, SUM(revenue) as dept_rev
            FROM analytics.department_metrics
            GROUP BY department
            ORDER BY dept_rev DESC;
        """)
        dept_rows = cursor.fetchall()
        department_revenue = [
            {"department": r[0], "revenue": round(serialize_val(r[1]), 2)}
            for r in dept_rows
        ]

        # 5. Top Categories by Revenue (filtering out misc non-merchandise coupon descriptors)
        cursor.execute("""
            SELECT commodity_desc, SUM(revenue) as cat_rev
            FROM analytics.category_metrics
            WHERE commodity_desc NOT LIKE '%COUPON%' AND commodity_desc NOT LIKE '%MISC%'
            GROUP BY commodity_desc
            ORDER BY cat_rev DESC
            LIMIT 10;
        """)
        cat_rows = cursor.fetchall()
        category_revenue = [
            {"category": r[0].title(), "revenue": round(serialize_val(r[1]), 2)}
            for r in cat_rows
        ]

        # 6. Customer Segment Distribution
        cursor.execute("""
            SELECT customer_segment, COUNT(*) as customer_count
            FROM analytics.customer_rfm_scored
            GROUP BY customer_segment
            ORDER BY customer_count DESC;
        """)
        seg_rows = cursor.fetchall()
        customer_segments = [
            {"segment": r[0], "count": int(r[1])}
            for r in seg_rows
        ]

        return {
            "kpis": kpis,
            "revenue_trend": revenue_trend,
            "customer_trend": customer_trend,
            "department_revenue": department_revenue,
            "category_revenue": category_revenue,
            "customer_segments": customer_segments
        }

    except Exception as e:
        logger.error(f"Error executing overview dashboard queries: {e}")
        return {
            "kpis": {
                "total_revenue": 0.0,
                "active_customers": 0,
                "total_units_sold": 0,
                "avg_basket_value": 0.0,
                "purchase_frequency": 0.0
            },
            "revenue_trend": [],
            "customer_trend": [],
            "department_revenue": [],
            "category_revenue": [],
            "customer_segments": []
        }
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass
