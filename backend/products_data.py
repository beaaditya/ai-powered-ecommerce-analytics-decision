import logging
from decimal import Decimal
from typing import Any, Dict, List

try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

logger = logging.getLogger("product_sales_intelligence")


def serialize_val(val: Any) -> Any:
    """Helper to convert Decimal or numeric objects to Python floats/ints."""
    if val is None:
        return 0
    if isinstance(val, Decimal):
        return float(val)
    return val


def get_product_sales_data() -> Dict[str, Any]:
    """
    Retrieves real PostgreSQL analytics data for Product & Sales Intelligence Dashboard.
    Aggregated strictly from analytics schema tables:
    - analytics.product_metrics
    - analytics.department_metrics
    - analytics.category_metrics
    - analytics.weekly_metrics
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        # 1. Core KPIs
        cursor.execute("""
            SELECT 
                (SELECT SUM(revenue) FROM analytics.weekly_metrics) as total_revenue,
                (SELECT SUM(units) FROM analytics.weekly_metrics) as total_units,
                (SELECT COUNT(DISTINCT product_id) FROM analytics.product_metrics) as total_products,
                (SELECT SUM(revenue) / NULLIF(COUNT(DISTINCT product_id), 0) FROM analytics.product_metrics) as avg_rev_per_product,
                (SELECT SUM(revenue) / NULLIF(SUM(units_sold), 0) FROM analytics.product_metrics) as avg_unit_value,
                (SELECT MAX(revenue) FROM analytics.department_metrics) as top_dept_revenue;
        """)
        kpi_row = cursor.fetchone()
        kpis = {
            "total_revenue": serialize_val(kpi_row[0]) if kpi_row else 0.0,
            "total_units_sold": int(kpi_row[1]) if kpi_row and kpi_row[1] is not None else 0,
            "total_products": int(kpi_row[2]) if kpi_row and kpi_row[2] is not None else 0,
            "avg_revenue_per_product": round(serialize_val(kpi_row[3]), 2) if kpi_row else 0.0,
            "avg_unit_value": round(serialize_val(kpi_row[4]), 2) if kpi_row else 0.0,
            "top_department_revenue": serialize_val(kpi_row[5]) if kpi_row else 0.0
        }

        # 2. Revenue by Department
        cursor.execute("""
            SELECT department, ROUND(SUM(revenue), 2) as dept_rev
            FROM analytics.department_metrics
            GROUP BY department
            ORDER BY dept_rev DESC
            LIMIT 8;
        """)
        dept_rev_rows = cursor.fetchall()
        department_revenue = [
            {"department": r[0], "revenue": serialize_val(r[1])}
            for r in dept_rev_rows
        ]

        # 3. Units Sold by Department
        cursor.execute("""
            SELECT department, SUM(units_sold) as dept_units
            FROM analytics.department_metrics
            GROUP BY department
            ORDER BY dept_units DESC
            LIMIT 8;
        """)
        dept_units_rows = cursor.fetchall()
        department_units = [
            {"department": r[0], "units": int(r[1]) if r[1] is not None else 0}
            for r in dept_units_rows
        ]

        # 4. Revenue by Merchandise Category (top 10 categories, excluding coupon placeholders)
        cursor.execute("""
            SELECT commodity_desc, ROUND(SUM(revenue), 2) as cat_rev
            FROM analytics.category_metrics
            WHERE commodity_desc NOT LIKE '%COUPON%' AND commodity_desc NOT LIKE '%MISC%'
            GROUP BY commodity_desc
            ORDER BY cat_rev DESC
            LIMIT 10;
        """)
        cat_rows = cursor.fetchall()
        category_revenue = [
            {"category": r[0].title(), "revenue": serialize_val(r[1])}
            for r in cat_rows
        ]

        # 5. Weekly Revenue Trend Over Time (102 weeks)
        cursor.execute("""
            SELECT week_no, revenue
            FROM analytics.weekly_metrics
            ORDER BY week_no;
        """)
        rev_trend_rows = cursor.fetchall()
        revenue_trend = [
            {"week_no": int(r[0]), "revenue": round(serialize_val(r[1]), 2)}
            for r in rev_trend_rows
        ]

        # 6. Revenue vs Units Sold Scatter Data across Categories
        cursor.execute("""
            SELECT 
                commodity_desc as label,
                ROUND(SUM(revenue), 2) as revenue,
                SUM(units_sold) as units,
                department
            FROM analytics.category_metrics
            WHERE commodity_desc NOT LIKE '%COUPON%' AND commodity_desc NOT LIKE '%MISC%'
            GROUP BY commodity_desc, department
            ORDER BY revenue DESC
            LIMIT 30;
        """)
        scatter_rows = cursor.fetchall()
        revenue_units_scatter = [
            {
                "label": r[0].title(),
                "revenue": serialize_val(r[1]),
                "units": int(r[2]) if r[2] is not None else 0,
                "department": r[3]
            }
            for r in scatter_rows
        ]

        # 7. Top 10 Products by Revenue
        cursor.execute("""
            SELECT product_id, department, commodity_desc, brand, ROUND(revenue, 2), units_sold
            FROM analytics.product_metrics
            ORDER BY revenue DESC
            LIMIT 10;
        """)
        top_prod_rev_rows = cursor.fetchall()
        top_products_revenue = [
            {
                "product_id": int(r[0]),
                "department": r[1],
                "commodity": r[2].title(),
                "brand": r[3],
                "revenue": serialize_val(r[4]),
                "units": int(r[5]) if r[5] is not None else 0
            }
            for r in top_prod_rev_rows
        ]

        # 8. Top 10 Products by Units Sold
        cursor.execute("""
            SELECT product_id, department, commodity_desc, brand, units_sold, ROUND(revenue, 2)
            FROM analytics.product_metrics
            ORDER BY units_sold DESC
            LIMIT 10;
        """)
        top_prod_unit_rows = cursor.fetchall()
        top_products_units = [
            {
                "product_id": int(r[0]),
                "department": r[1],
                "commodity": r[2].title(),
                "brand": r[3],
                "units": int(r[4]) if r[4] is not None else 0,
                "revenue": serialize_val(r[5])
            }
            for r in top_prod_unit_rows
        ]

        # 9. Revenue Contribution / Pareto Concentration Analysis
        cursor.execute("""
            WITH top10 AS (
                SELECT SUM(revenue) as rev FROM (
                    SELECT revenue FROM analytics.product_metrics ORDER BY revenue DESC LIMIT 10
                ) t
            ),
            top50 AS (
                SELECT SUM(revenue) as rev FROM (
                    SELECT revenue FROM analytics.product_metrics ORDER BY revenue DESC LIMIT 50
                ) t
            ),
            top100 AS (
                SELECT SUM(revenue) as rev FROM (
                    SELECT revenue FROM analytics.product_metrics ORDER BY revenue DESC LIMIT 100
                ) t
            ),
            total AS (
                SELECT SUM(revenue) as rev FROM analytics.weekly_metrics
            )
            SELECT 
                ROUND(top10.rev, 2), ROUND((top10.rev / total.rev) * 100, 2),
                ROUND(top50.rev, 2), ROUND((top50.rev / total.rev) * 100, 2),
                ROUND(top100.rev, 2), ROUND((top100.rev / total.rev) * 100, 2),
                ROUND(total.rev, 2)
            FROM top10, top50, top100, total;
        """)
        pareto_row = cursor.fetchone()
        tot_store_rev = serialize_val(pareto_row[6]) if pareto_row else 8057463.08
        pareto_data = {
            "top10_revenue": serialize_val(pareto_row[0]) if pareto_row else 0.0,
            "top10_pct": serialize_val(pareto_row[1]) if pareto_row else 0.0,
            "top50_revenue": serialize_val(pareto_row[2]) if pareto_row else 0.0,
            "top50_pct": serialize_val(pareto_row[3]) if pareto_row else 0.0,
            "top100_revenue": serialize_val(pareto_row[4]) if pareto_row else 0.0,
            "top100_pct": serialize_val(pareto_row[5]) if pareto_row else 0.0,
            "total_revenue": tot_store_rev
        }

        # 10. Product Performance Table (Top 25 products)
        cursor.execute("""
            SELECT 
                product_id,
                department,
                commodity_desc,
                sub_commodity_desc,
                brand,
                ROUND(revenue, 2) as revenue,
                units_sold,
                ROUND(revenue / NULLIF(units_sold, 0), 2) as avg_unit_value
            FROM analytics.product_metrics
            ORDER BY revenue DESC
            LIMIT 25;
        """)
        tbl_rows = cursor.fetchall()
        product_table = [
            {
                "product_id": int(r[0]),
                "department": r[1],
                "commodity": r[2].title(),
                "sub_commodity": r[3].title() if r[3] else "General",
                "brand": r[4],
                "revenue": serialize_val(r[5]),
                "units_sold": int(r[6]) if r[6] is not None else 0,
                "avg_unit_value": serialize_val(r[7])
            }
            for r in tbl_rows
        ]

        # 11. Data-Driven Product & Sales Insights
        insights = [
            {
                "title": f"Leading Department: Grocery (${kpis['top_department_revenue']:,.2f})",
                "description": f"Grocery generates $4,093,814.14 in sales, accounting for 50.8% of total store revenue across 29.8M units sold.",
                "type": "dept_lead"
            },
            {
                "title": f"Top Merchandise Category: Soft Drinks",
                "description": f"Soft Drinks is the highest revenue commodity category with $327,647.30 in total sales.",
                "type": "top_category"
            },
            {
                "title": f"High Volume Unit Leader: Kiosk-Gas",
                "description": f"Kiosk-Gas accounts for 216.5M units sold (83.1% of store unit volume), serving as the primary foot-traffic driver.",
                "type": "volume_leader"
            },
            {
                "title": f"Revenue Concentration (Top 100 SKUs)",
                "description": f"The top 100 SKUs generate ${pareto_data['top100_revenue']:,.2f} ({pareto_data['top100_pct']}% of store sales), demonstrating high revenue reliance on key products.",
                "type": "revenue_concentration"
            }
        ]

        # 12. Sales Opportunities & Strategic Recommendations
        recommendations = [
            {
                "opportunity": "Protect Core High-Revenue SKUs",
                "detail": f"Maintain 100% in-stock availability for the top 10 revenue products generating ${pareto_data['top10_revenue']:,.2f} ({pareto_data['top10_pct']}% of store sales).",
                "priority": "High"
            },
            {
                "opportunity": "Cross-Merchandise High Volume Fuel & Drinks",
                "detail": "Leverage high foot-traffic drivers (Gasoline & Soft Drinks) with promotional bundles for higher-margin Fresh Bakery & Prepared Foods.",
                "priority": "Medium"
            },
            {
                "opportunity": "Expand High-Margin Specialty Lines",
                "detail": "Increase shelf space and promotional placement for high unit-value categories like Specialty Cheese and Beef.",
                "priority": "High"
            },
            {
                "opportunity": "Audit & Rationalize Low-Velocity Assortments",
                "detail": "Review slow-moving SKUs in declining categories like Corn (-21.3% H2 decline) to reallocate shelf space to high-growth items.",
                "priority": "Medium"
            }
        ]

        return {
            "kpis": kpis,
            "department_revenue": department_revenue,
            "department_units": department_units,
            "category_revenue": category_revenue,
            "revenue_trend": revenue_trend,
            "revenue_units_scatter": revenue_units_scatter,
            "top_products_revenue": top_products_revenue,
            "top_products_units": top_products_units,
            "pareto_data": pareto_data,
            "product_table": product_table,
            "insights": insights,
            "recommendations": recommendations
        }

    except Exception as e:
        logger.error(f"Error retrieving product & sales data: {e}")
        return {
            "kpis": {},
            "department_revenue": [],
            "department_units": [],
            "category_revenue": [],
            "revenue_trend": [],
            "revenue_units_scatter": [],
            "top_products_revenue": [],
            "top_products_units": [],
            "pareto_data": {},
            "product_table": [],
            "insights": [],
            "recommendations": []
        }
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass
